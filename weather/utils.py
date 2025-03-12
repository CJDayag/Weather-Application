from datetime import timezone
from django.core.cache import cache
from django.conf import settings
import requests # type: ignore

from weather.models import WeatherData # type: ignore

def get_weather_data_with_cache(location):
    """
    Get weather data with caching to prevent redundant API calls
    """
    cache_key = f"weather_data_{location.id}"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    # Check if we have recent data in the database
    today = timezone.now().date()
    db_data = WeatherData.objects.filter(location=location, date=today).first()
    
    if db_data:
        # Cache the database data
        cache.set(cache_key, db_data, settings.CACHE_TTL)
        return db_data
    
    # Make the API call if no cached or recent data exists
    weather_url = f"{settings.WEATHER_API_URL}?lat={location.latitude}&lon={location.longitude}&appid={settings.WEATHER_API_KEY}&units=metric"
    response = requests.get(weather_url)
    
    if response.status_code == 200:
        data = response.json()
        
        # Save weather data to database
        weather_data = WeatherData.objects.create(
            location=location,
            date=today,
            temperature=data['main']['temp'],
            humidity=data['main']['humidity'],
            wind_speed=data['wind']['speed'],
            pressure=data['main']['pressure'],
            description=data['weather'][0]['description']
        )
        
        # Cache the new data
        cache.set(cache_key, weather_data, settings.CACHE_TTL)
        return weather_data
    
    return None