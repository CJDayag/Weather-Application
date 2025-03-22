import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, CircleX, TriangleAlert, CircleCheckIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from 'axios';

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
        const toastId = "fetchCSRFError";
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
          { id: toastId }
        );
      }
    };
    getCsrfToken();
  }, []);

  

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      const msg = "Please login to continue";
      const toastId = "fetchErrorLogin";
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
      navigate('/login');
      return false;
    }
    return token;
  };

  // Search locations query with auth check
  const { data: locations, isLoading, error, refetch } = useQuery<Location[]>( {
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
        latitude: loc.latitude,  // since the API now returns 'latitude'
        longitude: loc.longitude, // and 'longitude'
      }));
    },
    enabled: false,
  });
  
  // Update the mutation to send the location details (instead of an id) to the add endpoint.
  const addLocationMutation = useMutation({
    mutationFn: async (selectedLocation: Location) => {
      const token = checkAuth();
      if (!token) throw new Error("Unauthorized");
  
      if (!csrfToken) {
        throw new Error("Security token not initialized");
      }
  
      // POST the complete location details to the updated add endpoint.
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
        
      return response.data; // Return the response data
    },
    onSuccess: (data) => {
      const msg = data.message || "Location added successfully";
      const toastId = "fetchSearch";
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
      ), { id: toastId, duration: 2000 });
      refetch();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const toastId = "fetchCSRFError";
      toast.custom(() => (
        <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
          <div className="flex gap-2">
            <div className="flex grow gap-3">
              <CircleX
                className="mt-0.5 shrink-0 text-red-500"
                size={16}
                aria-hidden="true"
              />
              <div className="flex grow justify-between">
                <p className="text-sm">{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      ), { id: toastId });
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
      const msg = "Please enter at least 3 characters";
      const toastId = "searchQueryInfo";
      toast.custom(
        () => (
          <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
            <div className="flex gap-2">
              <div className="flex grow gap-3">
                <TriangleAlert
                  className="mt-0.5 shrink-0 text-amber-500"
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
        { id: toastId }
      );
      return;
    }
    refetch();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold mb-6">
          Search Locations
        </h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter city name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </form>

          <h2 className="text-2xl font-semibold mb-6">
            Search Results
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          ) : locations && locations.length > 0 ? (
          <div className="grid gap-4">
            {locations.map((location, index) => (
              <div
                // Using combination of id and index as key for uniqueness
                key={`${location.id}-${index}`}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-medium">
                      {location.name}
                    </h3>
                    <p className="text-sm">
                      Latitude: {location.latitude ? Number(location.latitude).toFixed(4) : "N/A"}{" "}
                      Longitude: {location.longitude ? Number(location.longitude).toFixed(4) : "N/A"}
                    </p>
                  </div>
                  <Button
                    onClick={() => addLocationMutation.mutate(location)}
                    disabled={pendingLocationId === location.id}
                    className="min-w-[120px]"
                  >
                    {addLocationMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      "Add Location"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          ) : searchQuery ? (
            <p className="text-gray-500">No locations found matching your search.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddUsersLocation;