import pandas as pd
import numpy as np
from datetime import timedelta
import os
import joblib
from django.conf import settings
from weather.models import HistoricalWeatherData  # adjust import paths
from tensorflow.keras.models import load_model

class ForecastService:
    def __init__(self):
        self.lstm_model = None
        self.scaler = None

    def load_lstm_model(self):
        model_path = os.path.join(settings.BASE_DIR, 'weather_forecast_lstm.h5')
        scaler_path = os.path.join(settings.BASE_DIR, 'weather_scaler.save')

        self.lstm_model = load_model(model_path, compile=False)
        self.scaler = joblib.load(scaler_path)
    pass

    def get_weather_description(self, temp):
        if temp > 30:
            return "Sunny"
        elif temp > 25:
            return "Clear"
        elif temp > 20:
            return "Partly cloudy"
        elif temp > 15:
            return "Cloudy"
        elif temp > 10:
            return "Overcast"
        elif temp > 5:
            return "Foggy"
        elif temp > 0:
            return "Snowy"
        else:
            return "Freezing"
    pass

    def generate_forecast(self, location, days=7):
        self.load_lstm_model()
        
        historical_data = list(
            HistoricalWeatherData.objects.filter(location=location)
            .order_by('date')
            .values('date', 'avg_temp', 'avg_humidity', 'avg_wind_speed', 'total_precip_mm', 'location')
        )

        if len(historical_data) < 30:
            return []

        df = pd.DataFrame(historical_data)
        features = ['avg_temp', 'avg_humidity', 'avg_wind_speed', 'total_precip_mm']
        input_data = df[features].values[-30:]
        input_scaled = self.scaler.transform(input_data)
        input_scaled = np.expand_dims(input_scaled, axis=0)

        forecast_data = []
        current_input = input_scaled
        last_date = df['date'].iloc[-1]

        for i in range(days):
            pred_temp = self.lstm_model.predict(current_input)[0][0]
            forecast_data.append({
                'date': (last_date + timedelta(days=i+1)),
                'location': location.name,
                'temperature': round(pred_temp, 1),
                'min_temp': round(pred_temp - 2, 1),
                'max_temp': round(pred_temp + 2, 1),
                'description': self.get_weather_description(pred_temp),
            })
            next_features = np.copy(current_input[0][-1])
            next_features[0] = pred_temp
            next_sequence = np.vstack((current_input[0][1:], next_features))
            current_input = np.expand_dims(next_sequence, axis=0)

        return forecast_data