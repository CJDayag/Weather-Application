from celery import shared_task
import requests
from django.core.mail import send_mail
from django.conf import settings
from .models import Location, WeatherData, AlertThreshold, AlertNotification, UserLocation
from django.contrib.auth.models import User
import logging
from requests.exceptions import RequestException, Timeout
from typing import Dict, Any
from django.utils import timezone
from datetime import timedelta
import time

logger = logging.getLogger(__name__)

@shared_task
def check_weather_alerts():
    """
    Check for weather conditions that match user alert thresholds
    and send notifications
    """
    # Get latest weather data for all locations
    latest_data = {}
    
    for location in Location.objects.all():
        weather = WeatherData.objects.filter(location=location).order_by('-date').first()
        if weather:
            latest_data[location.id] = weather
    
    # Check all active alert thresholds
    for threshold in AlertThreshold.objects.filter(is_active=True):
        if threshold.location.id not in latest_data:
            continue
            
        weather = latest_data[threshold.location.id]
        alert_triggered = False
        
        # Check if threshold is exceeded
        if threshold.condition == 'temp_above' and weather.temperature > threshold.threshold_value:
            alert_triggered = True
            message = f"Temperature is {weather.temperature}°C, which exceeds your threshold of {threshold.threshold_value}°C"
        
        elif threshold.condition == 'temp_below' and weather.temperature < threshold.threshold_value:
            alert_triggered = True
            message = f"Temperature is {weather.temperature}°C, which is below your threshold of {threshold.threshold_value}°C"
            
        elif threshold.condition == 'rain_above' and weather.precipitation > threshold.threshold_value:
            alert_triggered = True
            message = f"Rainfall is {weather.precipitation}mm, which exceeds your threshold of {threshold.threshold_value}mm"
            
        elif threshold.condition == 'wind_above' and weather.wind_speed > threshold.threshold_value:
            alert_triggered = True
            message = f"Wind speed is {weather.wind_speed}m/s, which exceeds your threshold of {threshold.threshold_value}m/s"
            
        elif threshold.condition == 'humidity_above' and weather.humidity > threshold.threshold_value:
            alert_triggered = True
            message = f"Humidity is {weather.humidity}%, which exceeds your threshold of {threshold.threshold_value}%"
            
        elif threshold.condition == 'humidity_below' and weather.humidity < threshold.threshold_value:
            alert_triggered = True
            message = f"Humidity is {weather.humidity}%, which is below your threshold of {threshold.threshold_value}%"
        
        # Create notification if alert is triggered
        if alert_triggered:
            # Check if we already sent this alert today
            existing_alert = AlertNotification.objects.filter(
                threshold=threshold,
                weather_data=weather
            ).exists()
            
            if not existing_alert:
                # Create notification
                notification = AlertNotification.objects.create(
                    user=threshold.user,
                    threshold=threshold,
                    weather_data=weather,
                    message=message
                )
                
                # Send email if user has email
                if threshold.user.email:
                    send_mail(
                        subject=f"Weather Alert for {threshold.location.name}",
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[threshold.user.email],
                        fail_silently=True
                    )
                    notification.sent_email = True
                    notification.save()

@shared_task(
    bind=True,
    retry_backoff=True,
    max_retries=3,
    rate_limit='60/m'
)
def fetch_weather_data(self, location_id):
    """
    Fetch and store weather data from WeatherAPI.com for a given location.
    Updates existing data if it exists for the same date.
    """
    try:
        location = Location.objects.get(id=location_id)
        current_date = timezone.now().date()
        
        api_url = "http://api.weatherapi.com/v1/current.json"
        params = {
            'key': settings.WEATHER_API_KEY,
            'q': f"{location.latitude},{location.longitude}",
            'aqi': 'no'
        }
        
        response = requests.get(
            api_url, 
            params=params, 
            timeout=(3.05, 27)
        )
        response.raise_for_status()
        data = response.json()

        # Update or create weather data
        weather_data, created = WeatherData.objects.update_or_create(
            location=location,
            date=current_date,
            defaults={
                'temperature': data['current']['temp_c'],
                'humidity': data['current']['humidity'],
                'wind_speed': data['current']['wind_kph'] / 3.6,
                'pressure': data['current']['pressure_mb'],
                'description': data['current']['condition']['text']
            }
        )

        action = "Created new" if created else "Updated existing"
        logger.info(f"{action} weather data for {location.name} on {current_date}")
        
        return {
            'status': 'success',
            'data': {
                'location': location.name,
                'date': current_date,
                'created': created
            }
        }

    except Location.DoesNotExist:
        logger.error(f"Location ID {location_id} does not exist")
        return {'status': 'error', 'message': 'Invalid location ID'}
    
    except Timeout as exc:
        logger.warning(f"Timeout fetching weather data for location {location_id}: {exc}")
        raise self.retry(exc=exc)
        
    except RequestException as exc:
        logger.error(f"Error fetching weather data for location {location_id}: {exc}")
        raise self.retry(exc=exc)
        
    except Exception as exc:
        logger.error(f"Unexpected error in fetch_weather_data for location {location_id}: {exc}")
        return {'status': 'error', 'message': str(exc)}
    
@shared_task(
    bind=True,
    retry_backoff=True,
    max_retries=3,
    rate_limit='60/m'
)
def fetch_all_historical_weather_data(self, days: int = 7) -> Dict[str, Any]:
    """
    Fetch historical weather data for all locations using a single API call per location.
    
    Args:
        days: Number of days of historical data to fetch (max 7 for free tier)
    
    Returns:
        Dict[str, Any]: Response containing status and summary
    """
    try:
        locations = Location.objects.all()
        results = []
        
        # Calculate date range
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        for location in locations:
            logger.info(f"Fetching historical data for {location.name}")
            
            # Check if we already have recent data for this location
            if WeatherData.objects.filter(
                location=location,
                date__gte=start_date,
                date__lte=end_date
            ).count() == days:
                logger.info(f"Complete data already exists for {location.name}")
                continue
            
            api_url = "http://api.weatherapi.com/v1/history.json"
            params = {
                'key': settings.WEATHER_API_KEY,
                'q': f"{location.latitude},{location.longitude}",
                'dt': start_date.strftime('%Y-%m-%d'),
                'end_dt': end_date.strftime('%Y-%m-%d')
            }
            
            try:
                response = requests.get(
                    api_url, 
                    params=params, 
                    timeout=(3.05, 27)
                )
                response.raise_for_status()
                data = response.json()
                
                if 'forecast' in data:
                    for day_data in data['forecast']['forecastday']:
                        date = day_data['date']
                        
                        # Skip if we already have data for this date
                        if WeatherData.objects.filter(location=location, date=date).exists():
                            continue
                            
                        WeatherData.objects.create(
                            location=location,
                            date=date,
                            temperature=day_data['day']['avgtemp_c'],
                            max_temp=day_data['day']['maxtemp_c'],
                            min_temp=day_data['day']['mintemp_c'],
                            humidity=day_data['day']['avghumidity'],
                            wind_speed=day_data['day']['maxwind_kph'] / 3.6,
                            precipitation=day_data['day']['totalprecip_mm'],
                            description=day_data['day']['condition']['text']
                        )
                        results.append({
                            'location': location.name,
                            'date': date,
                            'status': 'success'
                        })
            
            except (RequestException, Timeout) as exc:
                logger.error(f"Error fetching data for {location.name}: {exc}")
                results.append({
                    'location': location.name,
                    'status': 'error',
                    'error': str(exc)
                })
            
            # Brief pause between locations
            time.sleep(0.5)
        
        logger.info("Historical data fetch completed")
        return {
            'status': 'success',
            'results': results,
            'message': f'Processed {len(results)} data points'
        }
        
    except Exception as exc:
        logger.error(f"Unexpected error in historical data fetch: {exc}")
        return {'status': 'error', 'message': str(exc)}

@shared_task
def test_celery():
    """
    Simple task to verify Celery is working.
    Returns a success message and logs the execution.
    """
    message = "Test task executed successfully!"
    logger.info(message)
    return message

@shared_task
def fetch_all_weather_data():
    locations = Location.objects.all()
    for location in locations:
        fetch_weather_data.delay(location.id)