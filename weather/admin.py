from django.contrib import admin
from .models import Location, WeatherData, HistoricalWeatherData
from accounts.models import CustomUser

# Register your models here.
admin.site.register(Location)
admin.site.register(WeatherData)
admin.site.register(HistoricalWeatherData)
admin.site.register(CustomUser)