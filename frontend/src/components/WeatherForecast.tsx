"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, CircleX, TrendingUp } from "lucide-react";
import { useId } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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

const chartConfig = {
  temperature: {
    label: "Temperature",
    color: "hsl(var(--chart-1))",
  },
  min_temp: {
    label: "Min Temp",
    color: "hsl(var(--chart-2))",
  },
  max_temp: {
    label: "Max Temp",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const WEATHER_LOCATION = import.meta.env.VITE_WEATHER_LOCATION_URL;
const WEATHER_FORECAST = import.meta.env.VITE_WEATHER_FORECAST_URL;
const CSRF_TOKEN = import.meta.env.VITE_CSRF_URL;

const Forecast: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [days, setDays] = useState<string>("3");
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const locationId = useId();
  const daysId = useId();

  // Fetch Locations and CSRF Token on Mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`${WEATHER_LOCATION}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocations(response.data);
      } catch {
        const msg = "Failed to fetch locations";
        const toastId = toast.custom(() => (
          <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
              <div className="flex gap-2">
                  <div className="flex grow gap-3">
                      <CircleX
                          className="mt-0.5 shrink-0 text-red-500"
                          size={16}
                          aria-hidden="true"
                      />
                      <div className="flex grow justify-between gap-12">
                          <p className="text-sm">
                              {msg}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      ));
      setTimeout(() => {
          toast.dismiss(toastId);
      }, 3000); 
      } finally {
        setIsLoadingLocations(false);
      }
    };

    const getCsrfToken = async () => {
      try {
        const response = await axios.get(`${CSRF_TOKEN}`, { withCredentials: true });
        setCsrfToken(response.data.csrfToken);
      } catch {
        const msg = "Failed to fetch CSRF token";
        const toastId = toast.custom(() => (
          <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
              <div className="flex gap-2">
                  <div className="flex grow gap-3">
                      <CircleX
                          className="mt-0.5 shrink-0 text-red-500"
                          size={16}
                          aria-hidden="true"
                      />
                      <div className="flex grow justify-between gap-12">
                          <p className="text-sm">
                              {msg}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      ));
      setTimeout(() => {
          toast.dismiss(toastId);
      }, 3000); 
      }
    };

    fetchLocations();
    getCsrfToken();
  }, []);

  // Fetch Forecast Data
  const fetchForecast = async () => {
    if (!selectedLocation) {
      toast.warning("Please select a location");
      return;
    }

    try {
      setIsLoadingForecast(true);
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${WEATHER_FORECAST}${Number(selectedLocation)}/${Number(days)}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CSRFToken": csrfToken,
          },
        }
      );
      setForecastData(response.data.forecast);
    } catch {
      const msg = "Failed to fetch forecast data";
      const toastId = toast.custom(() => (
        <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
            <div className="flex gap-2">
                <div className="flex grow gap-3">
                    <CircleX
                        className="mt-0.5 shrink-0 text-red-500"
                        size={16}
                        aria-hidden="true"
                    />
                    <div className="flex grow justify-between gap-12">
                        <p className="text-sm">
                          {msg}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    ));
    setTimeout(() => {
        toast.dismiss(toastId);
    }, 3000); 
    } finally {
      setIsLoadingForecast(false);
    }
  };

  return (
    <div className="w-full max-w-screen mx-auto p-4 box-border overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-4">Weather Forecast</h1>

      {/* Location Select */}
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
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Days Select */}
      <div className="mb-4">
        <Label htmlFor={daysId}>Select Days:</Label>
        <Select onValueChange={setDays} value={days}>
          <SelectTrigger id={daysId}>
            <SelectValue placeholder="Select days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 Days</SelectItem>
            <SelectItem value="5">5 Days</SelectItem>
            <SelectItem value="7">7 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fetch Button */}
      <Button
        onClick={fetchForecast}
        disabled={isLoadingForecast || !selectedLocation}
      >
        {isLoadingForecast ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Fetching Forecast...
          </>
        ) : (
          <>
          <TrendingUp className="h-4 w-4" />
          Fetch Forecast
          </>
        )}
      </Button>

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {forecastData.map((data) => (
          <Card className="py-6" key={data.date}>
            <CardContent>
              <h2 className="text-xl font-semibold">{data.date}</h2>
              <p>Temperature: {data.temperature}°C</p>
              <p>Min Temp: {data.min_temp}°C</p>
              <p>Max Temp: {data.max_temp}°C</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Line Chart */}
      {forecastData.length > 0 && (
        <Card className="py-8 mt-8">
      <CardHeader>
        <CardTitle>Weather Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={forecastData}
            width={800}
            height={300}
            margin={{ left: 12, right: 12, top: 10, bottom: 10 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="temperature"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="min_temp"
              type="monotone"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="max_temp"
              type="monotone"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 font-medium leading-none">
                Showing data for the next {days} days <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                Based on latest weather predictions.
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
      )}
    </div>
  );
};

export default Forecast;
