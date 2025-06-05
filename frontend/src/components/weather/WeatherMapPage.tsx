import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import MapWeatherView from './MapWeatherView';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { 
  Map, 
  MapPin, 
  Info, 
  HelpCircle, 
  ThermometerSnowflake, 
  ThermometerSun, 
  Snowflake, 
  CloudSun, 
  Sun, 
  Flame,
  Settings,
  Layers,
  ChevronDown,
  Eye,
  PanelRight,
  BarChart4,
  Wind
} from 'lucide-react';

// Tile layer URLs for different map types
const MAP_LAYERS = {
  standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
};

// Define weather data type
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

// Define the location type
interface WeatherLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  latest_weather?: WeatherData | null;
  // These fields can come either from top-level properties or from latest_weather
  temperature?: number;
  description?: string;
  icon?: string;
  humidity?: number;
  windSpeed?: number;
}

export default function WeatherMapPage() {
  const [showMap, setShowMap] = useState(true);  // This state is managed by the Tabs component internally
  const [_activeMapLayer, setActiveMapLayer] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const [showTips, setShowTips] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation | null>(null);
  const [allLocations, setAllLocations] = useState<WeatherLocation[]>([]);
  const [weatherStats, setWeatherStats] = useState({
    highestTemp: { value: 0, location: '' },
    lowestTemp: { value: 0, location: '' },
    averageTemp: 0,
    conditions: { clear: 0, cloudy: 0, rain: 0, snow: 0, other: 0 }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.5,
      }
    }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  // Fetch locations and calculate statistics
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          return;
        }
        
        const response = await axios.get('/api/locations/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setAllLocations(response.data);
        
        // Calculate statistics from the locations data
        if (response.data.length > 0) {
          let highest = { value: -100, location: '' };
          let lowest = { value: 100, location: '' };
          let tempSum = 0;
          let tempCount = 0;
          const conditions = { clear: 0, cloudy: 0, rain: 0, snow: 0, other: 0 };
          
          response.data.forEach((loc: WeatherLocation) => {
            // Calculate highest and lowest temperatures
            if (loc.temperature !== undefined) {
              tempSum += loc.temperature;
              tempCount++;
              
              if (loc.temperature > highest.value) {
                highest = { value: loc.temperature, location: loc.name };
              }
              
              if (loc.temperature < lowest.value) {
                lowest = { value: loc.temperature, location: loc.name };
              }
            }
            
            // Count weather conditions
            if (loc.description) {
              const desc = loc.description.toLowerCase();
              if (desc.includes('clear') || desc.includes('sun')) {
                conditions.clear++;
              } else if (desc.includes('cloud')) {
                conditions.cloudy++;
              } else if (desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle')) {
                conditions.rain++;
              } else if (desc.includes('snow') || desc.includes('sleet') || desc.includes('ice')) {
                conditions.snow++;
              } else {
                conditions.other++;
              }
            }
          });
          
          setWeatherStats({
            highestTemp: highest,
            lowestTemp: lowest,
            averageTemp: tempCount > 0 ? Math.round((tempSum / tempCount) * 10) / 10 : 0,
            conditions
          });
        }
      } catch (err) {
        console.error('Error fetching location data:', err);
      }
    };
    
    fetchLocations();
  }, []);

  // Handle location selection from the map
  const handleLocationSelect = (location: WeatherLocation | null) => {
    setSelectedLocation(location);
    if (location && !showDetailPanel) {
      setShowDetailPanel(true);
    }
  };

  return (
    <motion.div 
      className="container mx-auto py-6 px-4 max-w-7xl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >

      <motion.div variants={itemVariants} className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Map className="h-6 w-6 text-primary" />
              <Badge variant="outline" className="text-sm px-2 py-0.5">Interactive</Badge>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Global Weather Map</h2>
            <p className="text-muted-foreground mt-1">View real-time weather data across the world</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <BarChart4 className="h-4 w-4" />
                  <span className="hidden sm:inline">Weather Stats</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Weather Statistics</SheetTitle>
                  <SheetDescription>
                    View detailed weather statistics for all locations
                  </SheetDescription>
                </SheetHeader>                <div className="py-4">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">Temperature Overview</h4>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex justify-between">
                          <span>Highest Temperature:</span>
                          <span className="font-medium">
                            {weatherStats.highestTemp.value !== 0 
                              ? `${weatherStats.highestTemp.value}°C (${weatherStats.highestTemp.location})` 
                              : 'No data'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lowest Temperature:</span>
                          <span className="font-medium">
                            {weatherStats.lowestTemp.value !== 100 
                              ? `${weatherStats.lowestTemp.value}°C (${weatherStats.lowestTemp.location})` 
                              : 'No data'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Temperature:</span>
                          <span className="font-medium">
                            {weatherStats.averageTemp ? `${weatherStats.averageTemp}°C` : 'No data'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Locations:</span>
                          <span className="font-medium">{allLocations.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">Weather Conditions</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {weatherStats.conditions.clear > 0 && (
                          <Badge className="justify-center">
                            Clear ({weatherStats.conditions.clear})
                          </Badge>
                        )}
                        {weatherStats.conditions.cloudy > 0 && (
                          <Badge className="justify-center" variant="outline">
                            Cloudy ({weatherStats.conditions.cloudy})
                          </Badge>
                        )}
                        {weatherStats.conditions.rain > 0 && (
                          <Badge className="justify-center" variant="outline">
                            Rain ({weatherStats.conditions.rain})
                          </Badge>
                        )}
                        {weatherStats.conditions.snow > 0 && (
                          <Badge className="justify-center" variant="outline">
                            Snow ({weatherStats.conditions.snow})
                          </Badge>
                        )}
                        {weatherStats.conditions.other > 0 && (
                          <Badge className="justify-center" variant="outline">
                            Other ({weatherStats.conditions.other})
                          </Badge>
                        )}
                        {Object.values(weatherStats.conditions).every(val => val === 0) && (
                          <div className="col-span-2 text-center text-muted-foreground">
                            No weather condition data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowTips(!showTips)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showTips ? "Hide Tips" : "Show Tips"}
                </DropdownMenuItem>                <DropdownMenuItem onClick={() => setShowDetailPanel(!showDetailPanel)}>
                  <PanelRight className="h-4 w-4 mr-2" />
                  {showDetailPanel ? "Hide Detail Panel" : "Show Detail Panel"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showMap ? "default" : "outline"}
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-2"
                  >
                    <Map className="h-4 w-4" />
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showMap ? 'Hide the interactive map' : 'Show the interactive map'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {showMap && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-4"
          >
            <div className={`${showDetailPanel ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
              <Card className="py-4 shadow-lg border border-border/80">                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="text-sm font-medium">Map View</h3>
                    </div>
                    {showTips && (
                      <Badge variant="outline" className="hidden sm:flex">
                        <Info className="h-3.5 w-3.5 mr-1" />
                        Tip: Scroll to zoom, drag to pan
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <Tabs defaultValue="standard" onValueChange={(val) => setActiveMapLayer(val as any)} className="w-full">
                    <div className="px-4 pb-2">
                      <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="standard" className="flex items-center gap-1">
                          <Map className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Standard</span>
                        </TabsTrigger>
                        <TabsTrigger value="satellite" className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Satellite</span>
                        </TabsTrigger>
                        <TabsTrigger value="terrain" className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Terrain</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>                    <TabsContent value="standard" className="m-0">
                      <MapWeatherView tileLayer={MAP_LAYERS.standard} onLocationSelect={handleLocationSelect} />
                    </TabsContent>
                    <TabsContent value="satellite" className="m-0">
                      <MapWeatherView tileLayer={MAP_LAYERS.satellite} onLocationSelect={handleLocationSelect} />
                    </TabsContent>
                    <TabsContent value="terrain" className="m-0">
                      <MapWeatherView tileLayer={MAP_LAYERS.terrain} onLocationSelect={handleLocationSelect} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            {showDetailPanel && (
              <motion.div 
                className="lg:col-span-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >                
              <Card className="py-4 h-full shadow-lg border border-border/80">
                  <CardHeader className="px-6">
                    <CardTitle className="text-lg">Weather Details</CardTitle>
                    <CardDescription>Selected location information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-6">
                    {selectedLocation ? (
                      <div className="space-y-4">                        <div className="flex flex-col items-center pb-4 border-b">
                          <h2 className="text-2xl font-bold mb-1">{selectedLocation.name}</h2>
                          {selectedLocation.description && (
                            <div className="flex items-center gap-2">
                              {selectedLocation.description.toLowerCase().includes('clear') && (
                                <Sun className="h-8 w-8 text-yellow-500" />
                              )}
                              {selectedLocation.description.toLowerCase().includes('cloud') && (
                                <CloudSun className="h-8 w-8 text-blue-400" />
                              )}
                              {selectedLocation.description.toLowerCase().includes('rain') && (
                                <CloudSun className="h-8 w-8 text-blue-600" />
                              )}
                              {selectedLocation.description.toLowerCase().includes('snow') && (
                                <Snowflake className="h-8 w-8 text-blue-300" />
                              )}
                              <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
                                {selectedLocation.description.charAt(0).toUpperCase() + selectedLocation.description.slice(1)}
                              </Badge>
                            </div>
                          )}
                          <div className="mt-3 text-3xl font-semibold">
                            {(selectedLocation.temperature !== undefined || selectedLocation.latest_weather?.temperature !== undefined) ? 
                              `${selectedLocation.temperature || selectedLocation.latest_weather?.temperature}°C` : 'N/A'}
                          </div>
                        </div>

                        <div className="grid gap-3"> 
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium flex items-center">
                              <CloudSun className="h-4 w-4 mr-2 text-blue-400" />
                              Humidity
                            </span>                            

                            <span className="text-right max-w-[100px] truncate font-medium">
                              {(selectedLocation.humidity !== undefined || selectedLocation.latest_weather?.humidity !== undefined) ? 
                                `${selectedLocation.humidity || selectedLocation.latest_weather?.humidity}%` : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-red-500" />
                              Coordinates
                            </span>                            

                            <span className="text-xs text-right max-w-[100px] truncate font-medium">
                              {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}°
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center">
                              <Wind className="h-4 w-4 mr-2 text-blue-500" />
                              Wind Speed
                            </span>                            

                            <span className="text-right max-w-[100px] truncate font-medium">
                              {(selectedLocation.windSpeed !== undefined || selectedLocation.latest_weather?.wind_speed !== undefined) ? 
                                `${Number(selectedLocation.windSpeed || selectedLocation.latest_weather?.wind_speed).toFixed(2)} km/h` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-md bg-muted/30 flex flex-col items-center justify-center">
                        <p className="text-sm text-muted-foreground">Click a location on the map to see its details</p>
                      </div>
                    )}                      <Collapsible className="border rounded-md">
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          <span>Additional Information</span>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 pt-0 border-t text-sm">
                        <div className="space-y-2">
                          <p>The weather data is updated hourly from multiple weather services.</p>
                          <p>You can add new locations from the Locations page.</p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                  <CardFooter className="px-6 pt-0">
                    <p className="text-xs text-muted-foreground">
                      Last updated: {selectedLocation?.latest_weather?.timestamp ? 
                        new Date(selectedLocation.latest_weather.timestamp).toLocaleString() : 
                        'N/A'}
                    </p>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
        
        <motion.div variants={itemVariants}>
          <Card className="py-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <CardTitle>About Weather Map</CardTitle>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <HelpCircle className="h-4 w-4" />
                        <span className="sr-only">Help</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      The map shows real-time weather data for locations you've added or searched for
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                This interactive map displays weather data for various locations around the world
              </CardDescription>
              <Separator />
            </CardHeader>
            
            <CardContent>
              <p className="mb-4">
                Each marker on the map represents a location with available weather data.
                The color of the marker indicates the current temperature range:
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-background/80 border shadow-sm">
                  <Snowflake className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="text-sm font-medium">Very Cold</div>
                  <div className="text-xs text-muted-foreground">Below 0°C</div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-background/80 border shadow-sm">
                  <CloudSun className="h-8 w-8 text-green-500 mb-2" />
                  <div className="text-sm font-medium">Cool</div>
                  <div className="text-xs text-muted-foreground">0-15°C</div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-background/80 border shadow-sm">
                  <Sun className="h-8 w-8 text-yellow-500 mb-2" />
                  <div className="text-sm font-medium">Warm</div>
                  <div className="text-xs text-muted-foreground">15-25°C</div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-background/80 border shadow-sm">
                  <ThermometerSun className="h-8 w-8 text-orange-500 mb-2" />
                  <div className="text-sm font-medium">Hot</div>
                  <div className="text-xs text-muted-foreground">25-35°C</div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-background/80 border shadow-sm sm:col-span-3 md:col-span-1">
                  <Flame className="h-8 w-8 text-red-500 mb-2" />
                  <div className="text-sm font-medium">Very Hot</div>
                  <div className="text-xs text-muted-foreground">Above 35°C</div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t pt-4 bg-muted/30">
              <div className="text-sm text-muted-foreground">
                Click on any marker to zoom to that location and see detailed weather information
              </div>
              
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="cursor-help">
                        <ThermometerSnowflake className="h-3.5 w-3.5 mr-1" />
                        Updated hourly
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Weather data is updated every hour
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
