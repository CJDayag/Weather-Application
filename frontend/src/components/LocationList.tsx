import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { Button } from "./ui/button";
import { FaTemperatureLow, FaTint, FaWind, FaCompressArrowsAlt, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
import { toast } from "sonner";
import { CircleX, CircleCheckIcon, Eye, CloudSun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import ErrorFallback from '@/components/ErrorFallback';
import { motion } from "framer-motion";

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  latest_weather: WeatherData | null;
}

interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  description: string;
  weather_icon_url: string;
  timestamp: string;
}

const LOCATION = import.meta.env.VITE_DISPLAY_LOCATION_URL;

const LocationsList: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${LOCATION}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLocations(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch locations');
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const getCsrfToken = () => {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1);
      }
    }
    return '';
  };

  const handleDelete = async () => {
    if (locationToDelete) {
      try {
        const token = localStorage.getItem('access_token');
        const csrfToken = getCsrfToken();
        await axios.delete(`${LOCATION}${locationToDelete.id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-CSRFToken': csrfToken,
          },
        });
        setLocations(locations.filter(location => location.id !== locationToDelete.id));
        const msg = 'Location deleted successfully';
        const toastId = "deleteLocationSuccess";
        toast.custom(() => (
          <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
            <div className="flex gap-2">
              <div className="flex grow gap-3">
                <CircleCheckIcon
                  className="mt-0.5 shrink-0 text-emerald-500"
                  size={16}
                  aria-hidden="true"
                />
                <div className="flex grow justify-between gap-12">
                  <p className="text-sm">{msg}</p>
                </div>
              </div>
            </div>
          </div>
        ),
        { id: toastId, duration: 2000 }
        );
        setDeleteDialogOpen(false);
      } catch (err) {
        const msg = 'Failed to delete location';
        const toastId = "deleteLocationFailed";
        toast.custom(
          () => (
            <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
              <div className="flex gap-2">
                <div className="flex grow gap-3">
                  <CircleX
                    className="mt-0.5 shrink-0 text-red-500"
                    size={16}
                    aria-hidden="true"
                  />
                  <div className="flex grow justify-between">
                    <p className="text-sm">{msg}</p>
                  </div>
                </div>
              </div>
            </div>
          ),
          { id: toastId, duration: 2000 }
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Locations and Weather Data</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-0">
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent className="py-4">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-32 mr-2" />
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return <ErrorFallback message={error} statusCode={500} />;
  }
  return (
    <div className="container mx-auto p-4 pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Locations and Weather Data</h1>
      </div>
        {locations.length > 0 ? (
        <div className="relative">
          {/* Horizontal Scroll Layout */}
          <div className="flex overflow-x-auto pb-6 snap-x snap-mandatory" style={{scrollbarWidth: 'auto'}}>
            {locations.map((location) => (<motion.div
                key={location.id}
                className="min-w-[300px] md:min-w-[350px] lg:min-w-[400px] px-2 snap-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-0 py-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">{location.name}</h2>
                      {location.latest_weather && (
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                          {location.latest_weather.temperature}°C
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    {location.latest_weather ? (
                      <>
                        {/* Weather Display */}
                        <motion.div 
                          className="flex items-center justify-center mb-6"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <div className="flex flex-col items-center">
                            <img 
                              src={decodeURIComponent(location.latest_weather.weather_icon_url).replace('/media/', '')} 
                              alt={location.latest_weather.description || "Weather Icon"} 
                              className="w-16 h-16"
                            />
                            <p className="text-sm font-medium text-center capitalize mt-1">
                              {location.latest_weather.description}
                            </p>
                          </div>
                        </motion.div>
                
                        {/* Weather Data Grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-3">
                          <motion.div 
                            className="bg-muted/30 p-2 rounded flex items-center space-x-2"
                            whileHover={{ backgroundColor: "rgba(var(--muted), 0.5)" }}
                          >
                            <FaTemperatureLow className="text-blue-500 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Feels Like</p>
                              <p className="text-sm font-medium">{location.latest_weather.feels_like}°C</p>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="bg-muted/30 p-2 rounded flex items-center space-x-2"
                            whileHover={{ backgroundColor: "rgba(var(--muted), 0.5)" }}
                          >
                            <FaTint className="text-blue-400 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Humidity</p>
                              <p className="text-sm font-medium">{location.latest_weather.humidity}%</p>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="bg-muted/30 p-2 rounded flex items-center space-x-2"
                            whileHover={{ backgroundColor: "rgba(var(--muted), 0.5)" }}
                          >                            <FaWind className="text-gray-500 shrink-0" />                              
                            <div>
                              <p className="text-xs text-muted-foreground">Wind Speed</p>
                              <p className="text-sm font-medium">{location.latest_weather.wind_speed.toFixed(2)} m/s</p>
                            </div>
                          </motion.div>
                          
                          <motion.div 
                            className="bg-muted/30 p-2 rounded flex items-center space-x-2"
                            whileHover={{ backgroundColor: "rgba(var(--muted), 0.5)" }}
                          >
                            <FaCompressArrowsAlt className="text-gray-500 shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Pressure</p>
                              <p className="text-sm font-medium">{location.latest_weather.pressure} hPa</p>
                            </div>
                          </motion.div>
                        </div>
                      </>
                    ) : (
                      <motion.div 
                        className="flex flex-col items-center justify-center py-8"
                        animate={{ rotate: [0, 10, 0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                      >
                        <CloudSun size={32} className="text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No weather data available</p>
                      </motion.div>
                    )}
                
                    {/* Location Information */}
                    <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground mt-2 border-t pt-3">
                      <FaMapMarkerAlt size={12} />
                      <p>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t pt-4 py-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Eye size={16} />
                          {!isMobile && "Weather Details"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Weather Details for {location.name}</DialogTitle>
                        </DialogHeader>
                        {location.latest_weather ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={decodeURIComponent(location.latest_weather.weather_icon_url).replace('/media/', '')} 
                                  alt={location.latest_weather.description || "Weather Icon"} 
                                  className="w-16 h-16"
                                />
                                <div>
                                  <p className="text-3xl font-bold">{location.latest_weather.temperature}°C</p>
                                  <p className="text-muted-foreground capitalize">{location.latest_weather.description}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {new Date(location.latest_weather.timestamp).toLocaleDateString()}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                  <FaTemperatureLow className="text-blue-500" />
                                  <p className="font-medium">Feels like</p>
                                </div>
                                <p className="text-2xl pl-6">{location.latest_weather.feels_like}°C</p>
                              </div>
                              
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                  <FaTint className="text-blue-400" />
                                  <p className="font-medium">Humidity</p>
                                </div>
                                <p className="text-2xl pl-6">{location.latest_weather.humidity}%</p>
                              </div>
                                <div className="bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                  <FaWind className="text-gray-500" />
                                  <p className="font-medium">Wind Speed</p>
                                </div>
                                <p className="text-2xl pl-6">{location.latest_weather.wind_speed.toFixed(2)} m/s</p>
                              </div>
                              
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                  <FaCompressArrowsAlt className="text-gray-500" />
                                  <p className="font-medium">Pressure</p>
                                </div>
                                <p className="text-2xl pl-6">{location.latest_weather.pressure} hPa</p>
                              </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground text-center">
                              Last updated: {new Date(location.latest_weather.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6">
                            <CloudSun size={48} className="text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No weather data available</p>
                          </div>
                        )}
                        <DialogClose asChild>
                          <Button className="w-full mt-2">Close</Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors" 
                      onClick={() => {
                        setLocationToDelete(location);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <FaTrash size={16} />
                      {!isMobile && "Delete"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : !loading && (
        <div className="text-center py-12">
          <CloudSun size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No locations found</h3>
          <p className="text-muted-foreground mb-6">Add your first location to track weather data</p>
          <Button>Add Location</Button>
        </div>
      )}
      
      {deleteDialogOpen && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete the location "{locationToDelete?.name}"?</p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LocationsList;