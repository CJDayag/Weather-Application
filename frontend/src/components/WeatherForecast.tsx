import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useId } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CircleX, TriangleAlert } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface Location {
  id: number;
  name: string;
}

interface ForecastData {
  date: string;
  temperature: number;
  min_temp: number;
  max_temp: number;
}

const Forecast: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [days, setDays] = useState<string>('3');
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const locationId = useId();
  const daysId = useId();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const token = localStorage.getItem('access_token');
        const response = await axios.get('/api/locations/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLocations(response.data);
      } catch (error) {
        const msg = 'Failed to fetch locations';
        const toastId = "fetchLocationError";
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
      } finally {
        setIsLoadingLocations(false);
      }
    };

    const getCsrfToken = async () => {
      try {
        const response = await axios.get('/csrf/', {
          withCredentials: true,
        });
        setCsrfToken(response.data.csrfToken);
      } catch (error) {
        const msg = 'Failed to fetch CSRF token';
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
          { id: toastId, duration: 2000 }
        );
      }
    };
    fetchLocations();
    getCsrfToken();
  }, []);

  const fetchForecast = async () => {
    if (!selectedLocation) {
      const msg = 'Please select a location';
      const toastId = "fetchLocationInfo";
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
        { id: toastId, duration: 2000 }
      );
      return;
    }
    try {
      setIsLoadingForecast(true);
      const token = localStorage.getItem('access_token');
      // Convert selectedLocation and days to numbers if needed
      const response = await axios.get(
        `/api/forecast/${Number(selectedLocation)}/${Number(days)}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-CSRFToken': csrfToken,
          },
        },
      );
      setForecastData(response.data.forecast);
    } catch (error) {
      const msg = 'Failed to fetch forecast data';
      const toastId = "fetchForecastError";
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
    } finally {
      setIsLoadingForecast(false);
    }
  };

  const chartData = {
    labels: forecastData.map((data) => data.date),
    datasets: [
      {
        label: 'Temperature',
        data: forecastData.map((data) => data.temperature),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: 'Min Temperature',
        data: forecastData.map((data) => data.min_temp),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      },
      {
        label: 'Max Temperature',
        data: forecastData.map((data) => data.max_temp),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
      },
    ],
  };

  return (
    // Wrap the component in a full-width container with hidden horizontal overflow.
    <div className="w-full max-w-screen mx-auto p-4 box-border overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-4">Weather Forecast</h1>
      <div className="mb-4">
        <Label htmlFor={locationId}>Select Location:</Label>
        {isLoadingLocations ? (
          <div className="flex items-center space-x-2 mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading locations...</span>
          </div>
        ) : (
          <Select
            onValueChange={(val) => setSelectedLocation(val)}
            value={selectedLocation}
          >
            <SelectTrigger id={locationId}>
              <SelectValue className="py-2"
              placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 py-4">
              <SelectItem value="0">Select a location</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="mb-4">
        <Label htmlFor={daysId}>Select Days:</Label>
        <Select onValueChange={setDays} value={days}>
          <SelectTrigger id={daysId}>
            <SelectValue placeholder="Select days" />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
            <SelectItem value="3">3 Days</SelectItem>
            <SelectItem value="5">5 Days</SelectItem>
            <SelectItem value="7">7 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={fetchForecast}
        className="mb-4"
        disabled={isLoadingForecast || !selectedLocation}
      >
        {isLoadingForecast ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Fetching Forecast...
          </>
        ) : (
          'Fetch Forecast'
        )}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {forecastData.map((data) => (
          <Card key={data.date} className="bg-white shadow-md rounded-lg p-4">
            <CardContent>
              <h2 className="text-xl font-semibold">{data.date}</h2>
              <p className="text-gray-600">Temperature: {data.temperature}°C</p>
              <p className="text-gray-600">Min Temp: {data.min_temp}°C</p>
              <p className="text-gray-600">Max Temp: {data.max_temp}°C</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {forecastData.length > 0 && (
        <Card className="bg-white shadow-md rounded-lg p-4 mt-8">
          <CardContent>
            <div className="relative h-96 w-full">
              <Line
                data={chartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Forecast;