from django.core.management.base import BaseCommand
from django.utils import timezone
import requests
import logging
from weather.models import Location, WeatherData
from django.conf import settings

# Set up logging
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Fetch real-time weather data and store it"

    def handle(self, *args, **kwargs):
        API_KEY = settings.WEATHER_API_KEY  # Load API Key from settings

        if not API_KEY:
            self.stdout.write(self.style.ERROR("Weather API key is missing in settings!"))
            return

        locations = Location.objects.all()
        if not locations:
            self.stdout.write(self.style.WARNING("No locations found"))
            return

        for location in locations:
            try:
                url = f"http://api.weatherapi.com/v1/current.json?key={API_KEY}&q={location.name}"
                response = requests.get(url, timeout=10)  # Set timeout for reliability
                response.raise_for_status()  # Raise error if request fails

                data = response.json()
                
                # Extract weather details
                weather_info = data.get("current", {})
                condition_info = weather_info.get("condition", {})

                # Check if data is valid
                if not weather_info:
                    self.stdout.write(self.style.ERROR(f"No weather data found for {location.name}"))
                    continue
                
                # Prevent duplicate data for the same timestamp
                latest_weather = WeatherData.objects.filter(location=location).order_by("-timestamp").first()
                if latest_weather and latest_weather.timestamp.hour == timezone.now().hour and latest_weather.timestamp.date() == timezone.now().date():
                    self.stdout.write(self.style.WARNING(f"Weather data already exists for {location.name} this hour. Skipping."))
                    continue

                # Save weather data
                weather_data = WeatherData.objects.create(
                    location=location,
                    timestamp=timezone.now(),
                    temperature=weather_info.get("temp_c"),
                    humidity=weather_info.get("humidity"),
                    wind_speed=weather_info.get("wind_kph", 0) / 3.6,  # Convert km/h to m/s
                    precipitation=weather_info.get("precip_mm", 0),
                    pressure=weather_info.get("pressure_mb"),
                    description=condition_info.get("text", "Unknown"),
                    weather_icon_url=f"https:{condition_info.get('icon', '')}",  # Full icon URL
                )

                self.stdout.write(self.style.SUCCESS(f"Weather data stored for {location.name}"))

            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to fetch weather for {location.name}: {str(e)}")
                self.stdout.write(self.style.ERROR(f"API error fetching {location.name}: {str(e)}"))
            except Exception as e:
                logger.error(f"Unexpected error processing {location.name}: {str(e)}")
                self.stdout.write(self.style.ERROR(f"Unexpected error for {location.name}: {str(e)}"))

