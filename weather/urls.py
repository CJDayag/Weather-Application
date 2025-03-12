from django.http import JsonResponse
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from weather.views import SignupAPIView, LoginAPIView, WeatherHistoryAPIView, LocationSearchAPIView, DashboardAPIView, AddUserLocationAPIView, FetchWeatherDataAPIView
from weather.views import AlertsAPIView, AlertCreateAPIView, AlertToggleAPIView, AlertDeleteAPIView, MarkNotificationReadAPIView, ForecastAPIView, LocationListAPIView
from weather.views import LocationDeleteAPIView, ProfileUpdateAPIView, ProfileAPIView, PasswordResetConfirmView, PasswordResetRequestView, ChangePasswordAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.middleware.csrf import get_token


def csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})

urlpatterns = [
    # User authentication and profile management
    path("csrf/", csrf),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/login/', LoginAPIView.as_view(), name='api_login'),
    path('api/signup/', SignupAPIView.as_view(), name='api_signup'),
    path("api/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("api/password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("api/profile/update/", ProfileUpdateAPIView.as_view(), name="profile-update"),
    path("api/profile/", ProfileAPIView.as_view(), name="profile-api"),
    path("api/profile/change-password/", ChangePasswordAPIView.as_view(), name="change-password"),
    # Dashboard view
    path('api/dashboard/', DashboardAPIView.as_view(), name='dashboard_api'),
    # Weather data and location management
    path('api/history/', WeatherHistoryAPIView.as_view(), name='weather_history_api'),
    path('api/weather/<int:location_id>/', FetchWeatherDataAPIView.as_view(), name='fetch-weather'),
    path('api/locations/', LocationListAPIView.as_view(), name='location-list'),
    path('api/locations/<int:pk>/', LocationDeleteAPIView.as_view(), name='location-delete'),
    path('api/locations/search/', LocationSearchAPIView.as_view(), name='location_search_api'),
    path('api/locations/add/', AddUserLocationAPIView.as_view(), name='add-user-location'),
    # Forecast using Prophet
    path('api/forecast/<int:location_id>/<int:days>/', ForecastAPIView.as_view(), name='forecast'),
    # Alert management
    path('api/alerts/', AlertsAPIView.as_view(), name='alerts'),
    path('api/alerts/create/', AlertCreateAPIView.as_view(), name='alert_create'),
    path('api/alerts/toggle/<int:alert_id>/', AlertToggleAPIView.as_view(), name='alert_toggle'),
    path('api/alerts/delete/<int:alert_id>/', AlertDeleteAPIView.as_view(), name='alert_delete'),
    path('api/notifications/read/<int:notification_id>/', MarkNotificationReadAPIView.as_view(), name='mark_notification_read'),
    

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
