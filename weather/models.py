from django.db import models
from django.conf import settings
from django.utils import timezone


    
class Location(models.Model):
    name = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return self.name

def weather_icon_upload_path(instance, filename):
    """Generate the path to store weather icons based on location and timestamp."""
    return f"weather_icons/{instance.location.name}/{filename}"

class WeatherData(models.Model):
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(default=timezone.now)  # Real-time data timestamp

    # Temperature
    temperature = models.FloatField()
    feels_like = models.FloatField(default=0)
    heat_index = models.FloatField(null=True, blank=True)
    wind_chill = models.FloatField(null=True, blank=True)
    dew_point = models.FloatField(null=True, blank=True)

    # Atmospheric conditions
    humidity = models.FloatField()
    pressure = models.FloatField()
    uv_index = models.FloatField(null=True, blank=True)

    # Wind details
    wind_speed = models.FloatField()
    wind_direction = models.CharField(max_length=20, default="N/A")

    # Precipitation & Clouds
    precipitation = models.FloatField(default=0)  # Rainfall in mm
    cloud_coverage = models.IntegerField(default=0)
    
    # Weather description & icon
    description = models.CharField(max_length=100)
    weather_icon_url = models.ImageField(upload_to=weather_icon_upload_path, blank=True, null=True)

    def __str__(self):
        return f"{self.location.name} - {self.timestamp}"

class HistoricalWeatherData(models.Model):
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    date = models.DateField()

    # Daily aggregated values
    min_temp = models.FloatField()
    max_temp = models.FloatField()
    avg_temp = models.FloatField()
    avg_humidity = models.FloatField()
    avg_wind_speed = models.FloatField()
    total_precip_mm = models.FloatField(default=0)
    uv_index = models.FloatField(default=0)
    total_snow_cm = models.FloatField(default=0)

    # Most frequent weather condition of the day
    most_common_description = models.CharField(max_length=100)

    class Meta:
        unique_together = ('location', 'date')

    def __str__(self):
        return f"{self.location.name} - {self.date}"
    
class UserLocation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'location')

class AlertThreshold(models.Model):
    CONDITION_CHOICES = [
        ('temp_above', 'Temperature Above'),
        ('temp_below', 'Temperature Below'),
        ('rain_above', 'Rainfall Above'),
        ('wind_above', 'Wind Speed Above'),
        ('humidity_above', 'Humidity Above'),
        ('humidity_below', 'Humidity Below'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    threshold_value = models.FloatField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.get_condition_display()} {self.threshold_value} for {self.location.name}"

class AlertNotification(models.Model):
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    threshold = models.ForeignKey(AlertThreshold, on_delete=models.CASCADE)
    weather_data = models.ForeignKey(WeatherData, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    sent_email = models.BooleanField(default=False)

    def __str__(self):
        return f"Alert for {self.user.username} on {self.created_at}"

class WeatherForecast(models.Model):
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    forecast_date = models.DateField()  # Forecast for a specific date

    # Predicted weather data
    min_temp = models.FloatField(null=True, blank=True)
    max_temp = models.FloatField(null=True, blank=True)
    avg_temp = models.FloatField(null=True, blank=True)
    avg_humidity = models.FloatField(null=True, blank=True)
    avg_wind_speed = models.FloatField(null=True, blank=True)
    description = models.CharField(max_length=200, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['forecast_date']
        indexes = [
            models.Index(fields=['location', 'forecast_date']),
        ]

    def __str__(self):
        return f"{self.location.name} forecast for {self.forecast_date}"