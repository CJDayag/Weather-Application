import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, CircleX, TriangleAlert, CircleCheckIcon, Globe, MapPin, Plus, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from 'axios';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

const API = import.meta.env.VITE_API_URL;
const CSRF_TOKEN = import.meta.env.VITE_CSRF_URL;
const SEARCH = import.meta.env.VITE_SEARCH_URL;
const ADD_LOCATION = import.meta.env.VITE_ADD_LOCATION_URL;

const AddUsersLocation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [pendingLocationId, setPendingLocationId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Get CSRF token on component mount
  useEffect(() => {
    const getCsrfToken = async () => {
      try {
        const response = await axios.get(`${API}${CSRF_TOKEN}`, {
          withCredentials: true // Important for CSRF cookie
        });
        setCsrfToken(response.data.csrfToken);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        const msg = 'Failed to initialize security token';
        toast.error(msg);
      }
    };
    getCsrfToken();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error("Please login to continue");
      navigate('/login');
      return false;
    }
    return token;
  };

  // Search locations query with auth check
  const { data: locations, isLoading, error, refetch } = useQuery<Location[]>({
    queryKey: ["locations", searchQuery],
    queryFn: async () => {
      const token = checkAuth();
      if (!token) throw new Error("Unauthorized");
  
      const response = await axios.post(`${API}${SEARCH}`, 
        { location_query: searchQuery },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );
        
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
        throw new Error("Session expired. Please login again");
      }
        
      if (response.status !== 200) {
        throw new Error(response.data.error || "Failed to fetch locations");
      }
        
      return response.data.locations.map((loc: any, index: number) => ({
        id: index,  // Use the index as a temporary key
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));
    },
    enabled: false,
  });
  
  // Update the mutation to send the location details
  const addLocationMutation = useMutation({
    mutationFn: async (selectedLocation: Location) => {
      const token = checkAuth();
      if (!token) throw new Error("Unauthorized");
  
      if (!csrfToken) {
        throw new Error("Security token not initialized");
      }
  
      const response = await axios.post(`${API}${ADD_LOCATION}`, 
        {
          name: selectedLocation.name,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        }
      );
  
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
        throw new Error("Session expired. Please login again");
      }
  
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.data.error || "Failed to add location");
      }
        
      return response.data;
    },
    onSuccess: (data) => {
      const msg = data.message || "Location added successfully";
      toast.success(msg);
      refetch();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(errorMessage);
    },
    onMutate: (selectedLocation: Location) => {
      setPendingLocationId(selectedLocation.id);
    },
    onSettled: () => {
      setPendingLocationId(null);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 3) {
      toast.warning("Please enter at least 3 characters");
      return;
    }
    setHasSearched(true);
    refetch();
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Globe className="mr-2 h-7 w-7 text-primary" />
            Search Locations
          </h1>
          <p className="text-muted-foreground mt-1">
            Find and add new locations to track weather data
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-2 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-background pb-4 py-4">
          <CardTitle>Search for a City</CardTitle>
          <CardDescription>
            Enter a city name to search for locations around the world
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Enter city name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CircleX className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Searching for locations...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 flex items-center"
              >
                <CircleX className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>{error instanceof Error ? error.message : 'An error occurred'}</p>
              </motion.div>
            ) : locations && locations.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    Search Results
                    <Badge variant="outline" className="ml-2">
                      {locations.length} found
                    </Badge>
                  </h2>
                </div>
                
                <Separator className="mb-4" />
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {locations.map((location, index) => (
                      <motion.div
                        key={`${location.id}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: index * 0.05 } 
                        }}
                        exit={{ opacity: 0 }}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <div className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-center flex-wrap gap-4">
                            <div className="flex items-start">
                              <MapPin className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                              <div>
                                <h3 className="text-lg font-medium">{location.name}</h3>
                                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 mt-1">
                                  <span>Lat: {location.latitude ? Number(location.latitude).toFixed(4) : "N/A"}</span>
                                  <span>Long: {location.longitude ? Number(location.longitude).toFixed(4) : "N/A"}</span>
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => addLocationMutation.mutate(location)}
                              disabled={pendingLocationId === location.id || addLocationMutation.isPending}
                              className={`min-w-[120px] transition-all ${
                                pendingLocationId === location.id ? "bg-primary/80" : "bg-primary"
                              }`}
                            >
                              {pendingLocationId === location.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Location
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : hasSearched ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No locations found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any locations matching "{searchQuery}". 
                  Try a different search term or check your spelling.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="initial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 border-2 border-dashed border-muted rounded-lg"
              >
                <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Search for a location</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Enter a city name above to start tracking weather data for that location
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AddUsersLocation;