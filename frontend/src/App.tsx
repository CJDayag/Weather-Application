import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from "./components/auth/login";
import { SignupPage } from "./components/auth/signup";
import AuthLayout from "./layouts/AuthLayout";
import AddUsersLocation from "./components/AddUsersLocation";
import WeatherDashboard from "./components/Dashboard";
import WeatherHistory from "./components/WeatherHistory";
import Alerts from "./components/Alerts";
import LocationList from "./components/LocationList";
import Forecast from './components/WeatherForecast';
import Profile from './components/ProfileForm'
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import RouteChangeProgress from "./components/RouteChangeProgress";
import "sonner/dist/styles.css";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

export default function App() {
  const isAuthenticated = localStorage.getItem("access_token") !== null;
  console.log("isAuthenticated:", isAuthenticated);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <Toaster position="top-right" />
      <RouteChangeProgress />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
          {/* Protected Routes */}
          {isAuthenticated ? (
            <Route element={<AuthLayout />}>
              <Route path="/" element={<Navigate to="/weather/dashboard" replace />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/weather">
                <Route path="dashboard" element={<WeatherDashboard />} />
                <Route path="add-location" element={<AddUsersLocation />} />
                <Route path="history" element={<WeatherHistory />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="locations" element={<LocationList />} />
                <Route path="forecast" element={<Forecast />} />
              </Route>
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}