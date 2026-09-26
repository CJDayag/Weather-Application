import requests
import csv
from datetime import datetime, timedelta

# Your WeatherAPI.com API Key
API_KEY = "76dde01949154cd3a1f150218250203"
LOCATION = "Quezon City"  # Change as needed
DAYS = 7  # Number of past days to fetch

# Get start date
end_date = datetime.today() - timedelta(days=1)  # Yesterday (API doesn't allow future dates)
start_date = end_date - timedelta(days=DAYS - 1)

# Prepare CSV file
CSV_FILE = "historical_weather_data_2.csv"

# List to store all weather data
historical_data = []

print(f"Fetching weather data from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}...")
    
for i in range(DAYS):
    date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
    url = f"https://api.weatherapi.com/v1/history.json?key={API_KEY}&q={LOCATION}&dt={date}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        forecast = data["forecast"]["forecastday"][0]  # Get the forecast for the date
        
        # Create location string with city and country
        location_name = f"{data['location']['name']}, {data['location']['country']}"
       
        historical_data.append({
            "date": forecast["date"],
            "location": location_name,
            "min_temp": forecast["day"].get("mintemp_c", 0),
            "max_temp": forecast["day"].get("maxtemp_c", 0),
            "avg_temp": forecast["day"].get("avgtemp_c", 0),
            "avg_humidity": forecast["day"].get("avghumidity", 0),
            "avg_wind_speed": forecast["day"].get("maxwind_kph", 0),
            "total_precip_mm": forecast["day"].get("totalprecip_mm", 0),
            "uv_index": forecast["day"].get("uv", 0),
            "total_snow_cm": forecast["day"].get("totalsnow_cm", 0),  # API might not always return this
            "most_common_description": forecast["day"]["condition"].get("text", "Unknown")
        })
       
        print(f"✅ {date} data saved.")
    else:
        print(f"❌ Error fetching {date}: {response.status_code}, {response.text}")

# Write data to CSV file
with open(CSV_FILE, mode="w", newline='', encoding="utf-8") as csv_file:
    # Define CSV headers based on the dictionary keys
    fieldnames = [
        "date", "location", "min_temp", "max_temp", "avg_temp",
        "avg_humidity", "avg_wind_speed", "total_precip_mm",
        "uv_index", "total_snow_cm", "most_common_description"
    ]
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
    
    # Write headers and data
    writer.writeheader()
    writer.writerows(historical_data)

print(f"✅ Data saved to {CSV_FILE}")
print(f"Total records: {len(historical_data)}")