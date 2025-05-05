import { CurrentWeather, Location } from '../types/weather';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from 'react';
import { 
  Cloud, 
  Droplets, 
  Wind, 
  GaugeCircle, 
  Thermometer, 
  RefreshCw, 
  MapPin,
  CalendarClock 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CurrentWeatherCardProps {
    location: Location;
    currentWeather: CurrentWeather;
}

export default function CurrentWeatherCard({ location, currentWeather }: CurrentWeatherCardProps) {
    const [currentDate, setCurrentDate] = useState<string>('');
    const [lastFetchedTime, setLastFetchedTime] = useState<string>('');

    useEffect(() => {
        const now = new Date();
        setCurrentDate(now.toLocaleDateString(undefined, { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }));
        setLastFetchedTime(now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        }));
    }, [currentWeather]);

    const getWeatherIcon = () => {
        // We can extend this with more icon mappings based on weather description
        const description = currentWeather.description.toLowerCase();
        if (description.includes('cloud')) return <Cloud className="h-14 w-14 text-blue-400" />;
        if (description.includes('rain')) return <Droplets className="h-14 w-14 text-blue-500" />;
        if (description.includes('wind')) return <Wind className="h-14 w-14 text-gray-400" />;
        if (description.includes('clear')) return <Thermometer className="h-14 w-14 text-yellow-500" />;
        if (description.includes('thunder')) return <Thermometer className="h-14 w-14 text-purple-500" />;
        // Default icon
        return <Thermometer className="h-14 w-14 text-orange-500" />;
    };

    return (
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20 py-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-xl">Current Weather</h3>
                    <Badge variant="outline" className="ml-2 bg-background/80 backdrop-blur-sm">
                        <CalendarClock className="mr-2 h-3 w-3" /> 
                        {currentDate}
                    </Badge>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-6 w-6 ml-4" />
                    <span className="text-sm font-medium ml-8">{location.name}</span>
                </div>
            </CardHeader>
            
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <motion.div 
                        className="space-y-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-end gap-2">
                            <div className="text-5xl font-bold text-primary">
                                {currentWeather.temperature}
                                <span className="text-3xl">°C</span>
                            </div>
                        </div>
                        <div className="text-muted-foreground capitalize font-medium">
                            {currentWeather.description}
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="p-4 bg-muted/20 rounded-full"
                    >
                        {getWeatherIcon()}
                    </motion.div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <motion.div 
                        className="p-3 bg-muted/20 rounded-lg flex items-center gap-3"
                        whileHover={{ backgroundColor: "rgba(var(--muted), 0.3)" }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <Droplets className="h-6 w-6 text-blue-500" />
                        <div>
                            <div className="text-sm text-muted-foreground">Humidity</div>
                            <div className="font-medium">{currentWeather.humidity}%</div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="p-3 bg-muted/20 rounded-lg flex items-center gap-3"
                        whileHover={{ backgroundColor: "rgba(var(--muted), 0.3)" }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <Wind className="h-6 w-6 text-gray-500" />
                        <div>
                            <div className="text-sm text-muted-foreground">Wind Speed</div>
                            <div className="font-medium">{currentWeather.wind_speed} m/s</div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="p-3 bg-muted/20 rounded-lg flex items-center gap-3"
                        whileHover={{ backgroundColor: "rgba(var(--muted), 0.3)" }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                    >
                        <GaugeCircle className="h-6 w-6 text-amber-500" />
                        <div>
                            <div className="text-sm text-muted-foreground">Pressure</div>
                            <div className="font-medium">{currentWeather.pressure} hPa</div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="p-3 bg-muted/20 rounded-lg flex items-center gap-3"
                        whileHover={{ backgroundColor: "rgba(var(--muted), 0.3)" }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                    >
                    </motion.div>
                </div>
            </CardContent>
            
            <CardFooter className="pt-2 pb-4 text-xs text-muted-foreground border-t mt-4 flex justify-between items-center">
                <div className="flex items-center">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    <span>Last updated: {lastFetchedTime}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                    {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                </Badge>
            </CardFooter>
        </Card>
    );
}