# Weather Web Application 🌦️🌍☀️

## Overview 🌐📊🔍

The Weather Web Application allows users to search for a location to get the latest weather conditions and future weather forecasts. It is designed for regular users who want to stay informed about current and upcoming weather for their desired locations. 🌦️📅🌡️

### Features 📋✅🛠️

- **User Dashboard**: Personalized dashboard displaying user-specific weather data.
- **Weather History**: View past weather conditions for saved locations.
- **Weather Forecast**: Check future weather predictions.
- **Alerts**: Receive important weather-related alerts.
- **Search Locations**: Search and view weather details for any location.
- **Add Location**: Save preferred locations for quick access.
- **List of Locations**: Manage and view saved locations.

## Tech Stack 🧰📚🖥️

- **Backend**: Python Django Rest Framework
- **Frontend**: React 19 with TypeScript
- **Database**: SQLite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Charts**: Recharts

## Installation Instructions 📥🛠️🚀

### Prerequisites 📌🔎⚙️

Ensure the following dependencies are installed on your system:

- Python (>= 3.10)
- Node.js (v22.12.0)

### Backend Setup (Django Rest Framework) 🐍📊🔧

1. Clone the repository:

   ```bash
   git clone (https://github.com/CJDayag/Weather-Application.git)
   cd weather-web-app
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Apply migrations:

   ```bash
   python manage.py migrate
   ```

5. Start the backend server:

   ```bash
   python manage.py runserver
   ```

### Frontend Setup (React 19 + TypeScript) ⚛️📘💻

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:

   ```bash
   npm install
   ```

3. Start the frontend development server:

   ```bash
   npm run dev
   ```

## Usage 📊🖥️🔑

1. Sign up or log in to access the dashboard.
2. Search for a location to view current weather and forecasts.
3. Add and manage your preferred locations.

## Environment Variables 🌍🔐🗂️

Create a `.env` file in both the backend and frontend directories and add the following:

### Root directory `.env`: 📂📝🔑

```
SECRET_KEY = <Your Secret key>
API_AUTH = <Your API_AUTH>
WEATHER_API = <Your WEATHER_API
EMAIL_HOST_USER = <Your EMAIL_HOST>
EMAIL_HOST_PASSWORD = <Your EMAIL_PASSWORD
FRONTEND_URL = <Your FRONTEND_URL>
FRONTEND_URL_LOCAL =  <Your FRONTEND_LOCAL>
CSRF_TRUSTED_ORIGINS = <Your CSRF_TRUSTED>
CELERY_BROKER_URL = <Your CELERY_URL>
DATABASE = <Your DATABASE>
```

### Frontend `.env`: 📁🔧📊

```
VITE_API_URL=http://localhost:8000
VITE_CSRF_URL = /csrf/

## Login URLs
VITE_LOGIN_URL = /api/token/
VITE_PROFILE_URL = /api/profile/

## Signup URLs
VITE_SIGNUP_URL = /api/signup/

## Dashboard URLs
VITE_DASHBOARD_URL = /api/dashboard/

## Weather History URLs
VITE_WEATHER_HISTORY_URL = /api/history/?

## Weather Forecast URLs
VITE_WEATHER_LOCATION_URL = /api/locations/
VITE_WEATHER_FORECAST_URL = /api/forecast/

## Weather Alerts URLs
VITE_ALERTS_URL = /api/alerts/
VITE_CREATE_ALERT_URL = /api/alerts/create/
VITE_ALERT_TOGGLE_URL = /api/alerts/toggle/
VITE_DELETE_ALERT_URL = /api/alerts/delete/

## Weather Locations URLs
VITE_SEARCH_URL = /api/locations/search/
VITE_ADD_LOCATION_URL = /api/locations/add/
VITE_DISPLAY_LOCATION_URL = /api/locations/
```

## License 📄🔓✅

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. See the [LICENSE](LICENSE) file for more details.

---


