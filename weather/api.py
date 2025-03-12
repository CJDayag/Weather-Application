import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import MultipleObjectsReturned
import pandas as pd
from prophet import Prophet
from .models import Location, HistoricalWeatherData
from .serializers import LocationSerializer, ForecastDataSerializer


class WeatherForecastAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, location_id=None):
        if location_id:
            location = get_object_or_404(Location, pk=location_id)
        else:
            # Get location name from query params
            location_name = request.query_params.get('location', "").strip()
            if not location_name:
                return Response({"error": "Location is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Split location input into name and coordinates (if present)
            location_parts = location_name.split(',')
            location_name = location_parts[0].strip()
            coordinates = location_parts[1].strip() if len(location_parts) == 2 else None

            latitude, longitude = None, None  # Initialize variables to avoid reference errors

            if len(location_parts) == 2:
                coordinates = location_parts[1].strip()
                try:
                    coordinate_parts = [c.strip() for c in coordinates.replace(',', ' ').split()]
                    if len(coordinate_parts) != 2:
                        raise ValueError("Invalid coordinates format")  # Ensures we have exactly two values

                    latitude, longitude = map(float, coordinate_parts)
                    location_filter = {'latitude': latitude, 'longitude': longitude}
                except ValueError:
                    return Response(
                        {"error": "Invalid coordinates format. Expected format: 'latitude longitude' or 'latitude, longitude'."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            # Construct the location filter
            location_filter = {'name__icontains': location_name}
            if latitude is not None and longitude is not None:
                location_filter.update({'latitude': latitude, 'longitude': longitude})

            try:
                location = Location.objects.get(**location_filter)
            except MultipleObjectsReturned:
                locations = Location.objects.filter(**location_filter)
                return Response(
                    {"error": "Multiple locations found", "locations": LocationSerializer(locations, many=True).data},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except Location.DoesNotExist:
                return Response({"error": "Location not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get forecast days (default: 7)
        try:
            days = int(request.query_params.get('days', 7))
            if days <= 0 or days > 30:
                return Response({"error": "Days parameter must be between 1 and 30"}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"error": "Invalid days parameter"}, status=status.HTTP_400_BAD_REQUEST)

        # Generate forecast
        forecast_data = self.generate_forecast(location, days)
        if not forecast_data:
            return Response({"error": "Insufficient historical data to generate forecast"}, status=status.HTTP_400_BAD_REQUEST)

        # Serialize forecasted data
        serializer = ForecastDataSerializer(forecast_data, many=True)
        return Response(serializer.data)


    def generate_forecast(self, location, days=7):
        # Fetch historical data
        historical_data = list(
            HistoricalWeatherData.objects.filter(location=location)
            .order_by('date')
            .values('date', 'avg_temp')
        )
        

        if len(historical_data) < 14:  # Need at least 14 records for a reasonable forecast
            return []

        # Prepare DataFrame for Prophet
        df = pd.DataFrame(historical_data)
        print(df.head())
        print(df.describe())

        # Rename columns for Prophet
        df.rename(columns={'date': 'ds', 'avg_temp': 'y'}, inplace=True)

        # OPTIONAL: Remove extreme values, but avoid removing too many points
        df = df[df['y'].between(df['y'].quantile(0.01), df['y'].quantile(0.99))]

        # Set dynamic 'cap' and 'floor' per row (important for logistic growth)
        df['cap'] = df['y'].max() * 1.1  # Set cap slightly above max to allow some growth
        df['floor'] = df['y'].min() * 0.9  # Set floor slightly below min

        # Logging for debugging
        logging.debug(f"Max date in dataset: {df['ds'].max()}")
        logging.debug(f"Min date in dataset: {df['ds'].min()}")
        logging.debug(f"Cap: {df['cap'].unique()}")
        logging.debug(f"Floor: {df['floor'].unique()}")

        # Initialize and fit Prophet model
        model = Prophet(
            growth='linear',  # Keep linear growth
            changepoint_prior_scale=0.01,  # Reduce to smooth trends
            seasonality_prior_scale=10.0,
            yearly_seasonality=False,  # Since you only have 30 days of data
            weekly_seasonality=True
        )
        model.add_seasonality(name='monthly', period=30.5, fourier_order=5)

        # Fit model
        model.fit(df)

        logging.debug(f"Last historical date: {df['ds'].max()}")

        # Create future dates
        future = model.make_future_dataframe(periods=days)
        future['cap'] = df['cap'].iloc[0]  # Use the same cap value for future dates
        future['floor'] = df['floor'].iloc[0]  # Use the same floor value for future dates
        forecast = model.predict(future)

        logging.debug(f"First forecasted date: {forecast['ds'].min()}")
        logging.debug(f"Last forecasted date: {forecast['ds'].max()}")

        # Extract relevant forecasted data
        forecast = forecast.tail(days)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
        forecast_data = [
            {
                'date': row['ds'].date(),
                'temperature': round(row['yhat'], 1),
                'min_temp': round(row['yhat_lower'], 1),
                'max_temp': round(row['yhat_upper'], 1),
            }
            for _, row in forecast.iterrows()
        ]

        return forecast_data
