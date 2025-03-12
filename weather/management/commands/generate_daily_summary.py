from django.core.management.base import BaseCommand
from django.utils import timezone
from weather.models import WeatherData, HistoricalWeatherData
from django.db.models import Avg, Max, Min, Sum

class Command(BaseCommand):
    help = "Generate daily weather summary"

    def handle(self, *args, **kwargs):
        yesterday = timezone.now().date() - timezone.timedelta(days=1)
        locations = WeatherData.objects.values_list('location', flat=True).distinct()

        for location_id in locations:
            daily_data = WeatherData.objects.filter(location_id=location_id, timestamp__date=yesterday)

            if not daily_data.exists():
                self.stdout.write(self.style.WARNING(f"No data found for location {location_id} on {yesterday}"))
                continue

            summary = daily_data.aggregate(
                min_temp=Min('temperature'),
                max_temp=Max('temperature'),
                avg_temp=Avg('temperature'),
                avg_humidity=Avg('humidity'),
                avg_wind_speed=Avg('wind_speed'),
                total_precip_mm=Sum('precipitation')
            )

            most_common_description = daily_data.values('description').annotate(count=Sum('id')).order_by('-count').first()
            description = most_common_description['description'] if most_common_description else "No Data"

            HistoricalWeatherData.objects.update_or_create(
                location_id=location_id,
                date=yesterday,
                defaults={
                    "min_temp": summary["min_temp"],
                    "max_temp": summary["max_temp"],
                    "avg_temp": summary["avg_temp"],
                    "avg_humidity": summary["avg_humidity"],
                    "avg_wind_speed": summary["avg_wind_speed"],
                    "total_precip_mm": summary["total_precip_mm"] or 0,
                    "most_common_description": description,
                }
            )

            self.stdout.write(self.style.SUCCESS(f"Stored summary for {location_id} on {yesterday}"))
