export interface CurrentWeather {
    temperature: number;
    description: string;
    humidity: number;
    wind_speed: number;
    pressure: number;
    weather_icon: string;
    timestamp: string;
}

export interface WeatherAlert {
    id: number;
    location: string;
    condition: string;
    threshold_value: number;
    is_active: string;
}

export interface HistoricalData {
    date: string;
    avg_temp: number;
    avg_humidity: number;
    avg_wind_speed: number;
    most_common_description: string;
}

export interface ForecastData {
    date: string;
    temperature: number;
    min_temp: number;
    max_temp: number;
    description: string;
}

export interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
}

export interface DashboardData {
    location: Location;
    current_weather: CurrentWeather;
    alerts: WeatherAlert[];
    historical_data: HistoricalData[];
    forecast_data: ForecastData[];
}