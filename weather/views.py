from pyexpat.errors import messages
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth.decorators import login_required
from django.conf import settings
from weather.models import AlertNotification, AlertThreshold, Location, WeatherData, UserLocation, WeatherForecast, HistoricalWeatherData
import pandas as pd
from prophet import Prophet
from django.utils import timezone
from datetime import datetime, timedelta
import requests
import logging
from requests.exceptions import RequestException
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import LocationSerializer, HistoricalWeatherDataSerializer, LocationWithWeatherSerializer, WeatherDataSerializer
from django.contrib.auth import authenticate
from rest_framework.generics import ListAPIView, DestroyAPIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from accounts.serializers import PasswordResetRequestSerializer, PasswordResetSerializer
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes

logger = logging.getLogger(__name__)

class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        try:
            # Get unread notifications
            alerts = AlertNotification.objects.filter(
                user=user,
                is_read=False
            ).order_by('-created_at')[:5]
            
            # Get user's default location or first location
            user_location = (UserLocation.objects.filter(user=user, is_default=True).first() or 
                           UserLocation.objects.filter(user=user).first())

            if not user_location:
                return Response({
                    'error': 'No location found',
                    'no_location': True
                }, status=status.HTTP_404_NOT_FOUND)

            location = user_location.location

            # Fetch the most recent weather data
            weather_data = WeatherData.objects.filter(
                location=location
            ).order_by('-timestamp')[:7]  # Last 7 days
            
            current_weather = weather_data.first()

            # Fetch historical data (Last 7 days)
            today = timezone.now().date()
            last_7_days = today - timedelta(days=7)

            historical_data = HistoricalWeatherData.objects.filter(
                location=location,
                date__gte=last_7_days,
                date__lte=today
            ).order_by('date')

            # Generate forecast data
            forecast_data = ForecastAPIView.generate_forecast(None, location, days=7)

            # Serialize the data
            alerts_data = [{
                'id': alert.id,
                'message': alert.message,
                'created_at': alert.created_at.isoformat(),
                'is_read': alert.is_read
            } for alert in alerts]

            current_weather_data = WeatherDataSerializer(current_weather).data if current_weather else None

            historical_data_serialized = [{
                'date': data.date.isoformat(),
                'avg_temp': data.avg_temp,
                'avg_humidity': data.avg_humidity,
                'avg_wind_speed': data.avg_wind_speed,
                'most_common_description': data.most_common_description
            } for data in historical_data]

            location_data = {
                'id': location.id,
                'name': location.name,
                'latitude': location.latitude,
                'longitude': location.longitude
            }

            return Response({
                'alerts': alerts_data,
                'location': location_data,
                'current_weather': current_weather_data,
                'forecast_data': forecast_data,
                'historical_data': historical_data_serialized,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Dashboard API Error: {str(e)}")
            return Response({
                'error': 'An error occurred while fetching dashboard data'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

logger = logging.getLogger(__name__)

class ForecastAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, location_id, days):
        if days not in [3, 5, 7]:
            return Response({'error': 'Invalid number of days. Choose 3, 5, or 7.'}, status=status.HTTP_400_BAD_REQUEST)

        location = get_object_or_404(Location, pk=location_id)
        forecast_data = self.generate_forecast(location, days)

        if not forecast_data:
            return Response({'error': 'Not enough historical data to generate forecast.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'forecast': forecast_data}, status=status.HTTP_200_OK)

    def generate_forecast(self, location, days=7):
        # Fetch historical data
        historical_data = list(
            HistoricalWeatherData.objects.filter(location=location)
            .order_by('date')
            .values('date', 'avg_temp', 'avg_humidity', 'avg_wind_speed', 'total_precip_mm', 'most_common_description')
        )

        if len(historical_data) < 14:  # Ensure enough historical data
            return []

        # Prepare DataFrame for Prophet
        df = pd.DataFrame(historical_data)
        df.rename(columns={'date': 'ds', 'avg_temp': 'y', 'avg_humidity': 'humidity', 
                        'avg_wind_speed': 'wind_speed', 'total_precip_mm': 'precipitation', 
                        'most_common_description': 'description'}, inplace=True)

        # Clip extreme temperature values (outlier removal)
        df['y'] = df['y'].clip(lower=df['y'].quantile(0.01), upper=df['y'].quantile(0.99))

        # Initialize Prophet model with the same settings as API
        model = Prophet(
            growth='linear',
            changepoint_prior_scale=0.05,  # Matches API flexibility
            seasonality_prior_scale=5.0,
            yearly_seasonality=False,
            weekly_seasonality=True
        )

        # Add same regressors as API
        model.add_regressor('humidity')
        model.add_regressor('wind_speed')
        model.add_regressor('precipitation')

        # Fit the model
        model.fit(df)

        # Create future dataframe
        future = model.make_future_dataframe(periods=days+1)
        
        # Use the latest available values for the regressors
        future['humidity'] = df['humidity'].iloc[-1]
        future['wind_speed'] = df['wind_speed'].iloc[-1]
        future['precipitation'] = df['precipitation'].iloc[-1]

        # Generate forecast
        forecast = model.predict(future)

        # Extract relevant forecast data
        forecast = forecast.tail(days)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
        
        # Generate weather descriptions based on forecasted temperature
        forecast_data = []
        for _, row in forecast.iterrows():
            temp = row['yhat']
            precipitation = future['precipitation'].iloc[-1]  # Get precipitation value
            
            # Determine weather description based on temperature and precipitation
            if precipitation > 5:
                description = "Rainy"
            elif precipitation > 1:
                description = "Drizzle"
            elif temp > 30:
                description = "Sunny"
            elif temp > 25:
                description = "Clear"
            elif temp > 20:
                description = "Partly cloudy"
            elif temp > 15:
                description = "Cloudy"
            elif temp > 10:
                description = "Overcast"
            elif temp > 5:
                description = "Foggy"
            elif temp > 0:
                description = "Snowy"
            else:
                description = "Freezing"
            
            forecast_data.append({
                'date': row['ds'].date(),
                'temperature': round(row['yhat'], 1),
                'min_temp': round(row['yhat_lower'], 1),
                'max_temp': round(row['yhat_upper'], 1),
                'description': description,
            })
        return forecast_data

class WeatherHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get user's location
        user_location = UserLocation.objects.filter(user=user, is_default=True).first()
        if not user_location:
            user_location = UserLocation.objects.filter(user=user).first()
        
        if not user_location:
            return Response(
                {'error': 'No location found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        location = user_location.location
        
        # Get date range from query params
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Process dates
        try:
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            else:
                start_date = timezone.now().date() - timedelta(days=30)
                
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            else:
                end_date = timezone.now().date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Query historical data
        historical_data = HistoricalWeatherData.objects.filter(
            location=location,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
        
        # Serialize data
        location_data = LocationSerializer(location).data
        historical_data_serialized = HistoricalWeatherDataSerializer(
            historical_data, 
            many=True
        ).data
        
        # Prepare chart data
        chart_data = {
            'dates': [data.date.strftime('%b %d') for data in historical_data],
            'temperatures': [data.avg_temp for data in historical_data],
            'humidity': [data.avg_humidity for data in historical_data],
            'wind_speed': [data.avg_wind_speed for data in historical_data],
            'description': [data.most_common_description for data in historical_data]
        }
        
        return Response({
            'location': location_data,
            'historical_data': historical_data_serialized,
            'chart_data': chart_data
        })
    
class SignupAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        User = get_user_model()
        try:
            data = request.data
            username = data.get('username')
            password = data.get('password')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            email = data.get('email')

            # Validate required fields
            if not all([username, password, first_name, last_name, email]):
                return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(username=username).exists():
                return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(email=email).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(
                username=username,
                password=password,
                first_name=first_name,
                last_name=last_name,
                email=email
            )

            return Response({
                'message': 'User created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,  # <-- Added username field
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "avatar": request.build_absolute_uri(user.avatar.url) if user.avatar else None  # <-- Absolute avatar URL
        }, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')

            if not username or not password:
                return Response({
                    'error': 'Please provide both username and password'
                }, status=status.HTTP_400_BAD_REQUEST)

            user = authenticate(username=username, password=password)

            if not user:
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Login successful',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'avatar': request.build_absolute_uri(user.avatar.url) if user.avatar else None
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        
        if not current_password or not new_password:
            return Response(
                {"error": "Both current and new passwords are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        if not user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK
        )


class PasswordResetRequestView(APIView):
    def post(self, request):
        User = get_user_model()
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"http://localhost:5173/reset-password/{uid}/{token}/"

            send_mail(
                "Password Reset",
                f"Click the link to reset your password: {reset_link}",
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            return Response({"message": "Password reset link sent!"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    def post(self, request, uidb64, token):
        User = get_user_model()
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data["password"])
            user.save()
            return Response({"message": "Password reset successful!"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    # Removed the GET method to only allow PATCH updates
    def patch(self, request):
        """Handles partial updates to user profile fields."""
        user = request.user
        data = request.data

        first_name = data.get("first_name", user.first_name)
        last_name = data.get("last_name", user.last_name)
        email = data.get("email", user.email)
        password = data.get("password", None)
        avatar_file = request.FILES.get("avatar")

        # Validate avatar type
        allowed_types = ["image/jpeg", "image/jpg", "image/png"]
        if avatar_file and avatar_file.content_type not in allowed_types:
            return Response(
                {"error": "Invalid avatar file type. Only JPG, JPEG, PNG allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update user fields
        user.first_name = first_name
        user.last_name = last_name
        user.email = email

        # Update password if provided
        if password:
            user.set_password(password)

        # Update avatar if provided
        if avatar_file:
            user.avatar.save(avatar_file.name, avatar_file, save=False)

        try:
            user.save()
            return Response({
                "message": "Profile updated successfully",
                "user": {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "avatar": request.build_absolute_uri(user.avatar.url) if user.avatar else None
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        """Handles full updates to the user profile."""
        return self.patch(request)
    
class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve the authenticated user's profile for the frontend."""
        user = request.user
        return Response({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "avatar": request.build_absolute_uri(user.avatar.url) if user.avatar else None
        }, status=status.HTTP_200_OK)

class LocationSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        query = request.data.get('location_query')
        if not query:
            return Response(
                {'error': 'Location query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use WeatherAPI.com to search locations
            weatherapi_url = f"http://api.weatherapi.com/v1/search.json?key={settings.WEATHER_API_KEY}&q={query}"
            response = requests.get(weatherapi_url, timeout=5)
            response.raise_for_status()
            
            locations = response.json()
            if not locations:
                return Response(
                    {'error': 'Location not found. Please try again.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            search_results = []
            for loc in locations:
                location_name = f"{loc['name']}, {loc['country']}"
                latitude = loc['lat']
                longitude = loc['lon']
                search_results.append({
                    # Do not include an 'id' because nothing is saved yet.
                    'name': location_name,
                    'latitude': latitude,
                    'longitude': longitude
                })
    
            return Response({'locations': search_results}, status=status.HTTP_200_OK)
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching location data: {str(e)}")
            return Response(
                {'error': 'An error occurred while searching. Please try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return Response(
                {'error': 'An unexpected error occurred.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        return Response({'message': 'Please use POST method to search locations'})
    
class AddUserLocationAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Expecting location details from the search view
        location_name = request.data.get('name')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if not all([location_name, latitude, longitude]):
            return Response(
                {'error': 'Missing location details'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create or get the location in DB
            location, created = Location.objects.get_or_create(
                name=location_name,
                defaults={'latitude': latitude, 'longitude': longitude}
            )
            
            # Fetch weather details from external API and save WeatherData
            weather_url = f"http://api.weatherapi.com/v1/current.json?key={settings.WEATHER_API_KEY}&q={latitude},{longitude}"
            weather_response = requests.get(weather_url, timeout=5)
            weather_response.raise_for_status()
            weather_data = weather_response.json()
            weather_icon_url = weather_data['current']['condition']['icon']
            if weather_icon_url.startswith('//'):
                weather_icon_url = f"https:{weather_icon_url}"
            elif not weather_icon_url.startswith('https://'):
                weather_icon_url = f"https://{weather_icon_url}"
            
            WeatherData.objects.create(
                location=location,
                temperature=weather_data['current']['temp_c'],
                feels_like=weather_data['current']['feelslike_c'],
                humidity=weather_data['current']['humidity'],
                wind_speed=weather_data['current']['wind_kph'],
                pressure=weather_data['current']['pressure_mb'],
                description=weather_data['current']['condition']['text'],
                weather_icon_url=weather_icon_url,
                timestamp=timezone.now()
            )
            
            # Associate the location with the user
            user_location, created = UserLocation.objects.get_or_create(
                user=request.user,
                location=location
            )
            
            return Response({
                'message': 'Location added successfully',
                'location': {
                    'id': location.id,
                    'name': location.name,
                    'latitude': location.latitude,
                    'longitude': location.longitude,
                }
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching weather details: {str(e)}")
            return Response(
                {'error': 'Failed to fetch weather details'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Error in adding user location: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class FetchWeatherDataAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, location_id):
        """Fetch current weather data from API and store in database."""
        try:
            location = get_object_or_404(Location, pk=location_id)
            
            # Check for existing data for today
            today = timezone.now().date()
            existing_data = WeatherData.objects.filter(location=location, timestamp__date=today).first()
            
            if existing_data:
                return Response(self._serialize_weather_data(existing_data))

            # Fetch weather data from external API
            weather_url = f"{settings.WEATHER_API_URL}?lat={location.latitude}&lon={location.longitude}&appid={settings.WEATHER_API_KEY}&units=metric"
            response = requests.get(weather_url, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            # Download the weather icon
            icon_url = f"https://openweathermap.org/img/wn/{data['weather'][0]['icon']}@2x.png"
            icon_response = requests.get(icon_url, timeout=5)
            icon_filename = f"{data['weather'][0]['icon']}.png"

            weather_data = WeatherData(
                location=location,
                temperature=data['main']['temp'],
                feels_like=data['main']['feels_like'],
                humidity=data['main']['humidity'],
                wind_speed=data['wind']['speed'],
                pressure=data['main']['pressure'],
                description=data['weather'][0]['description'],
                timestamp=timezone.now(),
            )

            # Save the downloaded icon image to `weather_icon` field
            if icon_response.status_code == 200:
                weather_data.weather_icon.save(icon_filename, ContentFile(icon_response.content), save=True)

            weather_data.save()

            return Response(self._serialize_weather_data(weather_data), status=status.HTTP_201_CREATED)

        except RequestException as e:
            return Response({'error': 'Failed to fetch weather data'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        except Exception as e:
            return Response({'error': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _serialize_weather_data(self, weather_data):
        """Helper method to serialize weather data for the response."""
        return {
            'id': weather_data.id,
            'location': {
                'id': weather_data.location.id,
                'name': weather_data.location.name
            },
            'temperature': weather_data.temperature,
            'feels_like': weather_data.feels_like,
            'humidity': weather_data.humidity,
            'wind_speed': weather_data.wind_speed,
            'pressure': weather_data.pressure,
            'description': weather_data.description,
            'weather_icon': weather_data.weather_icon.url if weather_data.weather_icon else None,
            'timestamp': weather_data.timestamp
        }
class AlertsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_locations = Location.objects.filter(userlocation__user=user)
        alerts = AlertThreshold.objects.filter(user=user)
        
        user_locations_data = [{'id': loc.id, 'name': loc.name} for loc in user_locations]
        alerts_data = [{
            'id': alert.id,
            'location': alert.location.name,
            'condition': alert.condition,
            'threshold_value': alert.threshold_value,
            'is_active': alert.is_active
        } for alert in alerts]
        
        return Response({
            'user_locations': user_locations_data,
            'alerts': alerts_data
        }, status=status.HTTP_200_OK)

class AlertCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        location_id = request.data.get('location')
        condition = request.data.get('condition')
        threshold_value = request.data.get('threshold_value')
        
        location = get_object_or_404(Location, pk=location_id)
        
        AlertThreshold.objects.create(
            user=request.user,
            location=location,
            condition=condition,
            threshold_value=float(threshold_value),
            is_active=True
        )
        
        return Response({'message': 'Alert created successfully!'}, status=status.HTTP_201_CREATED)

class AlertToggleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, alert_id):
        alert = get_object_or_404(AlertThreshold, pk=alert_id, user=request.user)
        alert.is_active = not alert.is_active
        alert.save()
        
        status_message = 'activated' if alert.is_active else 'deactivated'
        return Response({'message': f'Alert {status_message} successfully!'}, status=status.HTTP_200_OK)

class AlertDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, alert_id):
        alert = get_object_or_404(AlertThreshold, pk=alert_id, user=request.user)
        alert.delete()
        
        return Response({'message': 'Alert deleted successfully!'}, status=status.HTTP_200_OK)

class MarkNotificationReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        notification = get_object_or_404(AlertNotification, pk=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        
        return Response({'success': True}, status=status.HTTP_200_OK)

class LocationListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Location.objects.all()
    serializer_class = LocationWithWeatherSerializer

class LocationDeleteAPIView(DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Location.objects.all()
    serializer_class = LocationWithWeatherSerializer

