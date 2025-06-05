import { CurrentWeather, Location } from '../types/weather';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from 'react';
import { 
  Cloud, 
  CloudRain,
  Droplets, 
  Wind, 
  GaugeCircle, 
  Thermometer, 
  RefreshCw, 
  MapPin,
  CalendarClock,
  Sun,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Sunrise,
  Sunset,
  ThermometerSnowflake,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CurrentWeatherCardProps {
    location: Location;
    currentWeather: CurrentWeather;
}

export default function CurrentWeatherCard({ location, currentWeather }: CurrentWeatherCardProps) {
    const [currentDate, setCurrentDate] = useState<string>('');
    const [lastFetchedTime, setLastFetchedTime] = useState<string>('');
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('day');

    useEffect(() => {
        const now = new Date();
        
        // Set current date
        setCurrentDate(now.toLocaleDateString(undefined, { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }));
        
        // Set last fetched time
        setLastFetchedTime(now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        }));
        
        // Determine time of day for background gradient
        const hour = now.getHours();
        if (hour >= 5 && hour < 10) setTimeOfDay('morning');
        else if (hour >= 10 && hour < 17) setTimeOfDay('day');
        else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
        else setTimeOfDay('night');
    }, [currentWeather]);

    // Function to determine the appropriate gradient based on weather and time of day
    const getCardGradient = () => {
        const description = currentWeather.description.toLowerCase();
        
        if (description.includes('rain') || description.includes('drizzle')) {
            return 'bg-gradient-to-br from-blue-500/30 to-slate-700/30';
        } else if (description.includes('cloud')) {
            return 'bg-gradient-to-br from-gray-300/40 to-blue-300/20';
        } else if (description.includes('snow')) {
            return 'bg-gradient-to-br from-blue-100/40 to-slate-200/30';
        } else if (description.includes('thunder') || description.includes('lightning')) {
            return 'bg-gradient-to-br from-purple-600/30 to-slate-800/40';
        } else if (description.includes('fog') || description.includes('mist')) {
            return 'bg-gradient-to-br from-gray-400/30 to-slate-500/20';
        } else {
            // Clear skies - use time of day gradients
            switch (timeOfDay) {
                case 'morning':
                    return 'bg-gradient-to-br from-amber-200/30 to-blue-300/20';
                case 'day':
                    return 'bg-gradient-to-br from-blue-400/20 to-sky-200/20';
                case 'evening':
                    return 'bg-gradient-to-br from-orange-300/30 to-purple-400/20';
                case 'night':
                    return 'bg-gradient-to-br from-blue-900/30 to-slate-800/30';
                default:
                    return 'bg-gradient-to-br from-blue-400/20 to-sky-200/20';
            }
        }
    };

    const getWeatherIcon = () => {
        const description = currentWeather.description.toLowerCase();
        
        if (description.includes('cloud') && description.includes('rain')) {
            return <CloudRain className="h-16 w-16 text-blue-500" />;
        } else if (description.includes('cloud')) {
            return <Cloud className="h-16 w-16 text-blue-400" />;
        } else if (description.includes('rain') || description.includes('drizzle')) {
            return <Droplets className="h-16 w-16 text-blue-500" />;
        } else if (description.includes('wind')) {
            return <Wind className="h-16 w-16 text-slate-500" />;
        } else if (description.includes('clear') || description.includes('sun')) {
            return <Sun className="h-16 w-16 text-amber-400" />;
        } else if (description.includes('thunder') || description.includes('lightning')) {
            return <CloudLightning className="h-16 w-16 text-purple-500" />;
        } else if (description.includes('snow')) {
            return <CloudSnow className="h-16 w-16 text-blue-200" />;
        } else if (description.includes('fog') || description.includes('mist')) {
            return <CloudFog className="h-16 w-16 text-gray-400" />;
        }
        
        // Default icon
        return <Thermometer className="h-16 w-16 text-orange-500" />;
    };    // Create a temperature color based on value
    const getTempColor = (temp: number) => {
        if (temp <= 0) return "text-blue-500";
        if (temp <= 10) return "text-blue-400";
        if (temp <= 20) return "text-green-500";
        if (temp <= 25) return "text-yellow-500";
        if (temp <= 30) return "text-orange-500";
        return "text-red-500";
    };

    // Function to estimate feels like temperature
    const getFeelsLikeTemp = () => {
        // Simplified estimation
        const windChill = 0.045 * (5.27 * Math.sqrt(currentWeather.wind_speed) + 10.45 - 0.28 * currentWeather.wind_speed) * (currentWeather.temperature - 33) * 0.55;
        return Math.round(currentWeather.temperature - windChill);
    };
    
    // Animation variants for weather tiles
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <Card className={`overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 ${getCardGradient()} backdrop-blur-sm border border-white/10`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 backdrop-blur-sm border-b border-white/10 py-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xl tracking-tight">Current Weather</h3>
                    <Badge variant="outline" className="ml-2 bg-background/60 backdrop-blur-sm border border-white/20">
                        <CalendarClock className="mr-2 h-3 w-3" /> 
                        {currentDate}
                    </Badge>
                </div>
                <div className="flex items-center">
                    <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{location.name}</span>
                    </Badge>
                </div>
            </CardHeader>
            
            <CardContent className="pt-6 pb-2">
                <div className="flex items-center justify-between mb-8">
                    <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, type: "spring" }}
                    >
                        <motion.div 
                            className="flex items-end gap-2"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                        >
                            <div className={`text-6xl font-bold ${getTempColor(currentWeather.temperature)}`}>
                                {currentWeather.temperature}
                                <span className="text-4xl">°C</span>
                            </div>
                        </motion.div>
                        <motion.div 
                            className="flex flex-col gap-0.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="text-muted-foreground capitalize font-medium text-lg">
                                {currentWeather.description}
                            </div>
                            <div className="text-muted-foreground/80 text-sm flex items-center gap-1">
                                <ThermometerSnowflake className="h-3 w-3" />
                                <span>Feels like {getFeelsLikeTemp()}°C</span>
                            </div>
                        </motion.div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, type: "spring" }}
                        className="p-6 bg-gradient-to-br from-background/40 to-background/10 backdrop-blur-sm rounded-full border border-white/10 shadow-lg"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                        {getWeatherIcon()}
                    </motion.div>
                </div>
                
                <motion.div 
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    <motion.div 
                        className="p-3 bg-background/40 backdrop-blur-sm rounded-xl flex items-center gap-3 border border-white/10"
                        whileHover={{ scale: 1.03, backgroundColor: "rgba(var(--background), 0.6)" }}
                        variants={itemVariants}
                    >
                        <Droplets className="h-8 w-8 text-blue-500 opacity-90" />
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Humidity</div>
                            <div className="font-semibold text-lg">{currentWeather.humidity}%</div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="p-3 bg-background/40 backdrop-blur-sm rounded-xl flex items-center gap-3 border border-white/10"
                        whileHover={{ scale: 1.03, backgroundColor: "rgba(var(--background), 0.6)" }}
                        variants={itemVariants}
                    >                        <Wind className="h-8 w-8 text-slate-500 opacity-90" />
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Wind</div>
                            <div className="font-semibold text-lg">{currentWeather.wind_speed.toFixed(2)} m/s</div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="p-3 bg-background/40 backdrop-blur-sm rounded-xl flex items-center gap-3 border border-white/10"
                        whileHover={{ scale: 1.03, backgroundColor: "rgba(var(--background), 0.6)" }}
                        variants={itemVariants}
                    >
                        <GaugeCircle className="h-8 w-8 text-amber-500 opacity-90" />
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Pressure</div>
                            <div className="font-semibold text-lg">{currentWeather.pressure} hPa</div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="p-3 bg-background/40 backdrop-blur-sm rounded-xl flex items-center gap-3 border border-white/10"
                        whileHover={{ scale: 1.03, backgroundColor: "rgba(var(--background), 0.6)" }}
                        variants={itemVariants}
                    >
                        <Eye className="h-8 w-8 text-violet-500 opacity-90" />
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Visibility</div>
                            <div className="font-semibold text-lg">Good</div>
                        </div>
                    </motion.div>
                </motion.div>
            </CardContent>
            
            <CardFooter className="pt-3 pb-4 text-xs text-muted-foreground border-t border-white/10 mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="flex items-center">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin-slow" />
                    <span>Last updated: {lastFetchedTime}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs border-white/20 bg-background/40 backdrop-blur-sm">
                        Lat: {location.latitude.toFixed(2)}° N
                    </Badge>
                    <Badge variant="outline" className="text-xs border-white/20 bg-background/40 backdrop-blur-sm">
                        Long: {location.longitude.toFixed(2)}° E
                    </Badge>
                </div>
            </CardFooter>
        </Card>
    );
}