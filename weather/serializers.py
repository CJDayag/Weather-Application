from rest_framework import serializers
from .models import Location, HistoricalWeatherData, WeatherData

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'latitude', 'longitude']

class HistoricalWeatherDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalWeatherData
        fields = ['date', 'avg_temp', 'avg_humidity', 'avg_wind_speed', 'most_common_description']

class CurrentWeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherData
        fields = ['temperature', 'feels_like', 'humidity', 'wind_speed', 'pressure', 'description', 'weather_icon_url', 'timestamp']
    def get_weather_icon_url(self, obj):
        if obj.weather_icon:
            return obj.weather_icon.url
        return None  

class LocationWithWeatherSerializer(serializers.ModelSerializer):
    latest_weather = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ['id', 'name', 'latitude', 'longitude', 'latest_weather']

    def get_latest_weather(self, obj):
        latest_weather = WeatherData.objects.filter(location=obj).order_by('-timestamp').first()
        if latest_weather:
            return CurrentWeatherSerializer(latest_weather).data
        return None

class WeatherDataSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    
    class Meta:
        model = WeatherData  # Corrected model reference
        fields = ['id', 'location', 'timestamp', 'temperature', 'feels_like', 'humidity', 'wind_speed', 'pressure', 'description', 'weather_icon_url']
    def get_weather_icon_url(self, obj):
        if obj.weather_icon:
            return obj.weather_icon.url
        return None    

class ForecastDataSerializer(serializers.Serializer):
    date = serializers.DateField()
    temperature = serializers.FloatField()
    min_temp = serializers.FloatField()
    max_temp = serializers.FloatField()