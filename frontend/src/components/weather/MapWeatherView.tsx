import { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Tooltip, 
  useMap 
} from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './map-weather-view.css';
import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, MapPin, Loader2, Cloud, Droplets, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Fix for default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the imported images as URLs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface WeatherData {
  temperature?: number;
  feels_like?: number;
  humidity?: number;
  wind_speed?: number;
  pressure?: number;
  description?: string;
  weather_icon_url?: string;
  timestamp?: string;
}

interface WeatherLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  latest_weather?: WeatherData | null;
  // Added these fields to maintain compatibility with existing code
  temperature?: number;
  description?: string;
  humidity?: number;
  windSpeed?: number;
}

interface MapWeatherViewProps {
  tileLayer?: string;
  onLocationSelect?: (location: WeatherLocation | null) => void;
}

function MapFlyTo({ coords }: { coords: LatLngTuple }) {
  const map = useMap();
  
  useEffect(() => {
    // When the coords change, fly the map to that location with animation
    if (coords) {
      map.flyTo(coords, map.getZoom(), {
        animate: true,
        duration: 1
      });
    }
  }, [coords, map]);
  
  return null; // This component doesn't render anything
}

// Custom marker icon with color based on temperature
const getCustomIcon = (temperature?: number) => {
  let cssClass = 'temperature-marker';
  
  if (temperature !== undefined) {
    if (temperature <= 0) cssClass += ' temperature-marker-cold';
    else if (temperature <= 15) cssClass += ' temperature-marker-cool';
    else if (temperature <= 25) cssClass += ' temperature-marker-warm';
    else if (temperature <= 35) cssClass += ' temperature-marker-hot';
    else cssClass += ' temperature-marker-very-hot';
  }
  
  return new Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    className: cssClass,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

export default function MapWeatherView({ 
  tileLayer = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  onLocationSelect
}: MapWeatherViewProps) {
  const [locations, setLocations] = useState<WeatherLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);  
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([20, 0]); // Default world center
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation | null>(null);
  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }
        
        const response = await axios.get('/api/locations/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('API Response:', response.data);

        // Process the location data to map nested weather info to top level props
        const processedLocations = response.data.map((loc: WeatherLocation) => {
          const weatherData = loc.latest_weather;
          return {
            ...loc,
            // Only set these properties if they don't already exist at the top level
            temperature: loc.temperature !== undefined ? loc.temperature : weatherData?.temperature,
            description: loc.description !== undefined ? loc.description : weatherData?.description,
            humidity: loc.humidity !== undefined ? loc.humidity : weatherData?.humidity,
            windSpeed: loc.windSpeed !== undefined ? loc.windSpeed : weatherData?.wind_speed
          };
        });
        
        // Log processed data for debugging
        console.log('Processed Locations:', processedLocations);
        
        setLocations(processedLocations);
        
        // If we have locations, center the map on the first one
        if (response.data.length > 0) {
          setMapCenter([
            response.data[0].latitude, 
            response.data[0].longitude
          ]);
        }
      } catch (err) {
        console.error('Error fetching location data:', err);
        setError('Failed to load weather locations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, []);  const handleMarkerClick = (location: WeatherLocation) => {
    setMapCenter([location.latitude, location.longitude]);
    
    // Ensure the weather data is properly mapped before setting the selected location
    const enrichedLocation = {
      ...location,
      // Make sure to map weather properties if they exist in latest_weather but not at top level
      temperature: location.temperature || location.latest_weather?.temperature,
      description: location.description || location.latest_weather?.description,
      humidity: location.humidity || location.latest_weather?.humidity,
      windSpeed: location.windSpeed || location.latest_weather?.wind_speed
    };
    
    console.log('Selected location with weather data:', enrichedLocation);
    
    setSelectedLocation(enrichedLocation);
    
    // Notify parent component about the selected location
    if (onLocationSelect) {
      onLocationSelect(enrichedLocation);
    }
  };
  
  if (loading) {
    return (
      <Card className="w-full shadow-lg border border-border/80">
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading weather map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full shadow-lg border border-border/80">
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-[600px] w-full relative">
      {selectedLocation && (
        <div className="absolute top-4 right-4 z-10 w-64 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border p-3 space-y-3 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">{selectedLocation.name}</h3>
            <Badge variant="outline" className="text-xs">Details</Badge>
          </div>
            <div className="flex items-center justify-center gap-3">
            <div className="flex flex-col items-center justify-center">
              <Thermometer className="h-8 w-8 text-orange-500" />
              <span className="text-lg font-bold">
                {(selectedLocation.temperature || selectedLocation.latest_weather?.temperature) !== undefined ? 
                  `${selectedLocation.temperature || selectedLocation.latest_weather?.temperature}°C` : 'N/A'}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {selectedLocation.description || selectedLocation.latest_weather?.description || 'No data'}
              </span>
            </div>
            
            <div className="h-12 border-r mx-1"></div>
            
            <div className="grid grid-cols-2 gap-2">              <div className="flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-xs truncate">
                  {(selectedLocation.humidity || selectedLocation.latest_weather?.humidity) !== undefined ? 
                    `${selectedLocation.humidity || selectedLocation.latest_weather?.humidity}%` : 'N/A'}
                </span>
              </div>              <div className="flex items-center gap-1.5">
                <Wind className="h-4 w-4 text-slate-500" />
                <span className="text-xs truncate">
                  {(selectedLocation.windSpeed !== undefined || selectedLocation.latest_weather?.wind_speed !== undefined) ? 
                    `${Number(selectedLocation.windSpeed || selectedLocation.latest_weather?.wind_speed).toFixed(2)} km/h` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cloud className="h-4 w-4 text-slate-400" />
                <span className="text-xs">Cloud Cover</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-xs truncate">View Forecast</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setSelectedLocation(null)} 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center mt-1"
          >
            Close
          </button>
        </div>
      )}
      
      <MapContainer
        center={mapCenter}
        zoom={3}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution={
            tileLayer.includes('arcgisonline') 
              ? '&copy; <a href="https://www.arcgis.com/">Esri</a>'
              : tileLayer.includes('opentopomap') 
                ? '&copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
          url={tileLayer}
        />
        
        {/* Fly to selected location when it changes */}
        <MapFlyTo coords={mapCenter} />
        
        {locations.map((location) => (
          <Marker
            key={location.id}            position={[location.latitude, location.longitude]}
            icon={getCustomIcon(location.temperature || location.latest_weather?.temperature)}
            eventHandlers={{
              click: () => handleMarkerClick(location)
            }}
          >
            <Tooltip direction="top" offset={[0, -36]} opacity={1} permanent={false}>              <div className="text-center font-medium">
                {location.name}
                {(location.temperature !== undefined || location.latest_weather?.temperature !== undefined) && (
                  <span className="ml-2">{(location.temperature || location.latest_weather?.temperature)}°C</span>
                )}
              </div>
            </Tooltip>
            
            <Popup>
              <div className="p-2 text-center">                <h3 className="font-bold text-base">{location.name}</h3>
                  {(location.temperature !== undefined || location.latest_weather?.temperature !== undefined) && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Thermometer className="w-4 h-4" />
                    <span className="font-semibold">
                      {location.temperature || location.latest_weather?.temperature}°C
                    </span>
                  </div>
                )}
                
                {(location.description || location.latest_weather?.description) && (
                  <p className="text-sm mt-1 capitalize">{location.description || location.latest_weather?.description}</p>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
