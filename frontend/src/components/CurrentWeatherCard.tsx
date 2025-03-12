import { CurrentWeather, Location } from '../types/weather';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useEffect, useState } from 'react';

interface CurrentWeatherCardProps {
    location: Location;
    currentWeather: CurrentWeather;
}

export default function CurrentWeatherCard({ location, currentWeather }: CurrentWeatherCardProps) {
    const [currentDate, setCurrentDate] = useState<string>('');
    const [lastFetchedTime, setLastFetchedTime] = useState<string>('');

    useEffect(() => {
        const now = new Date();
        setCurrentDate(now.toLocaleDateString());
        setLastFetchedTime(now.toLocaleTimeString());
    }, [currentWeather]);

    return (
        <Card className="py-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="font-semibold text-xl">Current Weather</h3>
                <span className="text-sm text-muted-foreground">{location.name}</span>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-4xl font-bold">{currentWeather.temperature}°C</div>
                        <div className="text-muted-foreground capitalize">{currentWeather.description}</div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center text-muted-foreground">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                            </svg>
                            <span className="text-sm">Humidity: {currentWeather.humidity}%</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="text-sm">Wind: {currentWeather.wind_speed} m/s</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                            </svg>
                            <span className="text-sm">Pressure: {currentWeather.pressure} hPa</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                    <div>Current Date: {currentDate}</div>
                    <div>Last Fetched: {lastFetchedTime}</div>
                </div>
            </CardContent>
        </Card>
    );
}