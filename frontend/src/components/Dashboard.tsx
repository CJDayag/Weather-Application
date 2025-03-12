import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import WeatherChart from '@/components/WeatherChart';
import CurrentWeatherCard from '@/components/CurrentWeatherCard';
import AlertsCard from '@/components/AlertsCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardData } from '../types/weather';
import { CircleCheckIcon, CircleX } from 'lucide-react';
import { toast } from "sonner";
import { FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

export function useAuth() {
    const getToken = useCallback(async () => {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            const msg="No access token found"
            const toastId = toast.custom(() => (
                <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
                    <div className="flex gap-2">
                        <div className="flex grow gap-3">
                            <CircleX
                                className="mt-0.5 shrink-0 text-red-500"
                                size={16}
                                aria-hidden="true"
                            />
                            <div className="flex grow justify-between gap-12">
                                <p className="text-sm">
                                    No access token found
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ));
            setTimeout(() => {
                toast.dismiss(toastId);
            }, 3000); 
            throw new Error(msg);
        }
        return accessToken;
    }, []);

    const getRefreshToken = useCallback(async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            const msg="No refresh token found"
            const toastId = toast.custom(() => (
                <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
                    <div className="flex gap-2">
                        <div className="flex grow gap-3">
                            <CircleX
                                className="mt-0.5 shrink-0 text-red-500"
                                size={16}
                                aria-hidden="true"
                            />
                            <div className="flex grow justify-between gap-12">
                                <p className="text-sm">
                                    No refresh token found
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ));
            setTimeout(() => {
                toast.dismiss(toastId);
            }, 3000); 
            throw new Error(msg);
        }
        return refreshToken;
    }, []);

    return { getToken, getRefreshToken };
}

export async function fetchDashboardData(token: string): Promise<DashboardData> {
    const response = await axios.get('/api/dashboard/', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        withCredentials: true,
    });


    if (response.status !== 200) {
        if (response.status === 401) {
            const msg = "Session expired. Please login again."
            const toastId = toast.custom(() => (
                <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
                    <div className="flex gap-2">
                        <div className="flex grow gap-3">
                            <CircleX
                                className="mt-0.5 shrink-0 text-red-500"
                                size={16}
                                aria-hidden="true"
                            />
                            <div className="flex grow justify-between gap-12">
                                <p className="text-sm">
                                    Session expired. Please login again.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ));
            setTimeout(() => {
                toast.dismiss(toastId);
            }, 3000);        
            throw new Error(msg);
        }
        throw new Error(response.data.message || 'Failed to fetch dashboard data');
    }

    return response.data;
}

export default function Dashboard() {
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          console.log("Fetched user data:", JSON.parse(storedUser));
        } else {
          console.log("No user data found in localStorage.");
        }
      }, []);


    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const { getToken } = useAuth();

    // Trigger toast if user has just logged in
    useEffect(() => {
        // Log stored user data for debugging
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          console.log("Fetched user data:", JSON.parse(storedUser));
        } else {
          console.log("No user data found in localStorage.");
        }
        
        // Trigger toast on initial login if "justLoggedIn" flag is set
        const justLoggedIn = localStorage.getItem("justLoggedIn");
        if (justLoggedIn) {
          const userJson = localStorage.getItem("user") || '{"name": "Guest"}';
          const userData = JSON.parse(userJson);
          // Compute displayName from name or first_name and last_name
          const displayName = userData.name || `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "";
          const toastId = toast.custom(() => (
            <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
                <div className="flex gap-2">
                    <div className="flex grow gap-3">
                        <CircleCheckIcon
                            className="mt-0.5 shrink-0 text-emerald-500"
                            size={16}
                            aria-hidden="true"
                        />
                        <div className="flex grow justify-between gap-12">
                            <p className="text-sm">
                                Welcome back{displayName ? `, ${displayName}` : ""}!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        ));
        setTimeout(() => {
            toast.dismiss(toastId);
        }, 4000);
          localStorage.removeItem("justLoggedIn");
        }
      }, []);

      useEffect(() => {
        const loadDashboardData = async () => {
          try {
            setIsLoading(true);
            const token = await getToken();
            const data = await fetchDashboardData(token);
            
            await new Promise((resolve) => setTimeout(resolve, 2000));
      
            setDashboardData(data);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
          } finally {
            setIsLoading(false);
          }
        };
      
        loadDashboardData();
      }, [getToken]);

    if (isLoading) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        );
      }

    if (error) {
        return (
          <div className="max-w-md mx-auto my-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center space-x-2">
            <FaExclamationTriangle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        );
      }

    if (!dashboardData?.location) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert>
                    <AlertDescription>
                        You haven't added any locations yet. <Link to="/search" className="font-medium underline underline-offset-4">Search for a location</Link> to get started.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const { location: dashboardLocation, current_weather, alerts, historical_data, forecast_data } = dashboardData;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold mb-6">
                    Weather Dashboard
                </h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CurrentWeatherCard 
                    location={dashboardLocation}
                    currentWeather={current_weather}
                />
                <AlertsCard alerts={alerts} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <Card className='py-6'>
                    <CardHeader>
                        <CardTitle>Last 7 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <WeatherChart
                            data={historical_data}
                            type="historical"
                        />
                    </CardContent>
                </Card>

                <Card className='py-6'>
                    <CardHeader>
                        <CardTitle>7-Day Forecast</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <WeatherChart
                            data={forecast_data}
                            type="forecast"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}