import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog';
import { Button } from "./ui/button";
import { FaTemperatureLow, FaTint, FaWind, FaCompressArrowsAlt } from 'react-icons/fa';
import { toast } from "sonner";
import 'react-toastify/dist/ReactToastify.css';
import { FaExclamationTriangle } from 'react-icons/fa';
import { CircleX, CircleCheckIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";

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
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);



  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${LOCATION}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('API Response:', response.data); // Log the API response
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


  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Locations and Weather Data</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <Card key={location.id} className="py-6">
            <CardHeader>
            <h2 className="text-xl font-semibold">{location.name}</h2>
            </CardHeader>
            <CardContent>
            <p >Latitude: {location.latitude}</p>
            <p >Longitude: {location.longitude}</p>
            </CardContent>
            <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='outline' className='mt-4'>View Weather Details</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Weather Details for {location.name}</DialogTitle>
                </DialogHeader>
                {location.latest_weather ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center space-x-2">
                    <img 
                        src={decodeURIComponent(location.latest_weather.weather_icon_url).replace('/media/', '')} 
                        alt={location.latest_weather.description || "Weather Icon"} 
                        className="w-12 h-12"
                      />
                      
                      <p className="text-3xl font-bold">{location.latest_weather.temperature}°C</p>
                      <p>{location.latest_weather.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaTemperatureLow/>
                      <p>Feels like: {location.latest_weather.feels_like}°C</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaTint/>
                      <p>Humidity: {location.latest_weather.humidity}%</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaWind />
                      <p >Wind Speed: {location.latest_weather.wind_speed} m/s</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaCompressArrowsAlt/>
                      <p >Pressure: {location.latest_weather.pressure} hPa</p>
                    </div>
                    <p >Last updated: {new Date(location.latest_weather.timestamp).toLocaleString()}</p>
                  </div>
                ) : (
                  <p >No weather data available</p>
                )}
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
            <Button 
              variant='outline' 
              className='mt-4 ml-3 text-red-500' 
              onClick={() => {
                setLocationToDelete(location);
                setDeleteDialogOpen(true);
              }}
            >
              Delete
            </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {deleteDialogOpen && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete the location "{locationToDelete?.name}"?</p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant='outline' className='text-red-500' onClick={handleDelete}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LocationsList;