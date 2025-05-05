
import os
import django
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler
import joblib

# 1. Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "weather_app.settings")
django.setup()

# 2. Import your model
from weather.models import HistoricalWeatherData

# 3. Fetch historical weather data
def load_historical_data():
    data = HistoricalWeatherData.objects.all().order_by('date').values(
        'avg_temp', 'avg_humidity', 'avg_wind_speed', 'total_precip_mm'
    )
    return pd.DataFrame(data)

# 4. Prepare sequences
def create_sequences(data, seq_length):
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i+seq_length])
        y.append(data[i+seq_length, 0])  # Temperature (first feature)
    return np.array(X), np.array(y)

# 5. Main training function
def train_model():
    df = load_historical_data()
    
    if df.empty or len(df) < 50:
        print("❗ Not enough data to train the model. Need at least 50 records.")
        return
    
    features = ['avg_temp', 'avg_humidity', 'avg_wind_speed', 'total_precip_mm']
    target = 'avg_temp'

    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(df[features])

    seq_length = 30
    X, y = create_sequences(data_scaled, seq_length)

    model = Sequential()
    model.add(LSTM(64, activation='relu', input_shape=(seq_length, len(features))))
    model.add(Dense(1))  # Predict temperature
    model.compile(optimizer='adam', loss='mse')

    print("🚀 Training model...")
    model.fit(X, y, epochs=50, batch_size=16, validation_split=0.1)

    # Save the model and scaler
    model.save('weather_forecast_lstm.h5')
    joblib.dump(scaler, 'weather_scaler.save')
    print("✅ Model and scaler saved successfully.")

if __name__ == "__main__":
    train_model()
