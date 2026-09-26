import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import WeatherChart from '@/components/WeatherChart';
import CurrentWeatherCard from '@/components/CurrentWeatherCard';
import AlertsCard from '@/components/AlertsCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardData } from '../types/weather';
import { CircleCheckIcon, CircleX } from 'lucide-react';
import { toast } from "sonner";
import ErrorFallback from '@/components/ErrorFallback';
import axios from 'axios';

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

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
    const response = await axios.get(`${DASHBOARD_URL}`, {
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

    const [showLocationDialog, setShowLocationDialog] = useState(false);

    useEffect(() => {
        // Check if the account is newly created
        const isNewAccount = localStorage.getItem("newAccount");
        if (isNewAccount) {
            setShowLocationDialog(true);
            localStorage.removeItem("newAccount");
        }
    }, []);

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
            <div className="animate-spin-slow rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        );
      }    if (error) {
        return <ErrorFallback message={error} statusCode={500} />;
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

    const { location: dashboardLocation, current_weather, alerts, historical_data } = dashboardData;

    return (
         <>
            {/* Conditional Location Dialog */}
            {showLocationDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card text-card-foreground p-6 rounded-xl shadow-2xl max-w-sm w-full border border-border"
                    >
                        <h2 className="text-lg font-bold mb-4">Add Your Location</h2>
                        <p className="mb-4 text-muted-foreground">
                            Your account is newly created. Please add a location to get started.
                        </p>
                        <button
                            onClick={() => setShowLocationDialog(false)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}

            <motion.div 
                className="container mx-auto px-4 py-8 space-y-8"
                variants={container}
                initial="hidden"
                animate="show"
            >
            
                <motion.div variants={item} className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold mb-6 tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Weather Dashboard
                    </h1>
                </motion.div>
            
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div variants={item}>
                        <CurrentWeatherCard 
                            location={dashboardLocation}
                            currentWeather={current_weather}
                        />
                    </motion.div>
                    <motion.div variants={item}>
                        <AlertsCard alerts={alerts} />
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    <motion.div variants={item}>
                        <Card className='py-6 border-border/50 bg-card/50 backdrop-blur-sm'>
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
                    </motion.div>

                    {/* <Card className='py-6'>
                        <CardHeader>
                            <CardTitle> 7-Day Forecast </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <WeatherChart
                                data={forecast_data}
                                type="forecast"
                            />
                        </CardContent>
                    </Card> */}
                </div>
            </motion.div>
        </>
    );
}