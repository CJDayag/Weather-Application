import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { FaExclamationTriangle } from 'react-icons/fa';
import { toast } from "sonner";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WeatherData {
  date: string;
  avg_temp: number;
  avg_humidity: number;
  avg_wind_speed: number;
  most_common_description: string;
}

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface ChartData {
  dates: string[];
  temperatures: number[];
  humidity: number[];
  wind_speed: number[];
  description: string[];
}

interface Location {
  name: string;
}

export default function WeatherHistory() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [historicalData, setHistoricalData] = useState<WeatherData[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)), // Default to last 7 days
    endDate: new Date()
  });
  const [date, setDate] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });
  const chartRef = useRef(null);

  const temperatureChartRef = useRef<ChartJS | null>(null);
  const humidityChartRef = useRef<ChartJS | null>(null);
  const windChartRef = useRef<ChartJS | null>(null);

  const isDateRangeValid = () => {
    if (!date.from || !date.to) return false;
    const daysDiff = Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 30;
  };

  useEffect(() => {
    if (date.from && date.to) {
      setDateRange({
        startDate: date.from,
        endDate: date.to
      });
    }
  }, [date]);

  useEffect(() => {
    // Cleanup function for chart instances
    return () => {
      temperatureChartRef.current?.destroy();
      humidityChartRef.current?.destroy();
      windChartRef.current?.destroy();
    };
  }, []);

  const fetchData = async () => {
    try {
      if (!isDateRangeValid()) {
        const msg = 'Please select a valid date range (maximum 30 days)';
        const toastId = "fetchWeatherError";
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
        return;
      }
      setIsLoading(true);
      const params = new URLSearchParams({
        start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
        end_date: format(dateRange.endDate, 'yyyy-MM-dd')
      });

      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/history/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,  // If using token auth
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status !== 200) {
        const msg = 'Failed to fetch data';
        const toastId = "fetchWeatherError";
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
      
      const data = response.data;
      
      setLocation({ name: data.location.name });
      setHistoricalData(data.historical_data);
      setChartData(data.chart_data);
    }  catch (err) {
      const msg = 'Failed to fetch weather data';
      const toastId = "fetchWeatherError";
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Fetch data on component mount

  const handleDateRangeChange = () => {
    fetchData();
  };

  if (isLoading) {
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

  if (!location) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertDescription>
          You haven't added any locations yet.{' '}
          <a href="/weather/add-location" className="underline">
            Search for a location
          </a>{' '}
          to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Weather History</h1>

      <Card className="mb-6 py-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{location.name}</CardTitle>
            <span className="text-sm text-gray-500">Historical Data</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Label htmlFor="date-range">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range"
                  variant="outline"
                  className={cn(
                    "group bg-background hover:bg-background border-input w-full sm:w-[300px] justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <span className={cn("truncate", !date && "text-muted-foreground")}>
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </span>
                  <CalendarIcon
                    size={16}
                    className="text-muted-foreground/80 group-hover:text-foreground shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={(range) => setDate(range || { from: undefined, to: undefined })}
                  numberOfMonths={1}
                  disabled={(date) => 
                    date > new Date() || 
                    date < new Date(new Date().setDate(new Date().getDate() - 30))
                  }
                />
              </PopoverContent>
            </Popover>

            <Button 
              onClick={handleDateRangeChange}
              className="w-full sm:w-auto"
              disabled={!isDateRangeValid()}
            >
              Update
            </Button>
          </div>
          <div className="h-px bg-border my-8 w-full"></div>
        </div>

        {chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Temperature (°C)</CardTitle>
              </CardHeader>
              <CardContent>
                <Line
                  data={{
                    labels: chartData.dates,
                    datasets: [{
                      label: 'Temperature (°C)',
                      data: chartData.temperatures,
                      backgroundColor: 'rgba(255, 99, 132, 0.2)',
                      borderColor: 'rgba(255, 99, 132, 1)',
                      borderWidth: 2,
                      tension: 0.3
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: false,
                        // Remove max since temperature range varies more than humidity
                        ticks: {
                          callback: (value) => `${value}°C`
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => `Temperature: ${context.parsed.y}°C`
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>

            <Card className="w-full py-6">
          <CardHeader>
            <CardTitle className="text-lg">Humidity (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="relative w-full"
              style={{
                minHeight: "300px",
                height: "50vh",
                maxHeight: "600px",
              }}
            >
              <Line
                ref={chartRef}
                data={{
                  labels: chartData.dates,
                  datasets: [
                    {
                      label: "Humidity (%)",
                      data: chartData.humidity,
                      backgroundColor: "rgba(75, 192, 192, 0.2)",
                      borderColor: "rgba(75, 192, 192, 1)",
                      borderWidth: 2,
                      tension: 0.3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // Ensure the chart fills the container
                  scales: {
                    y: {
                      beginAtZero: false,
                      max: 100,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
            <Card className="py-6">
                <CardHeader>
                  <CardTitle className="text-lg">Wind Speed (m/s)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Line
                    data={{
                      labels: chartData.dates,
                      datasets: [{
                        label: 'Wind Speed (m/s)',
                        data: chartData.wind_speed,
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 2,
                        tension: 0.3
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 py-6">
      <CardHeader>
        <CardTitle>Data Table</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Temperature (°C)</TableHead>
                  <TableHead className="whitespace-nowrap">Humidity (%)</TableHead>
                  <TableHead className="whitespace-nowrap">Wind Speed (m/s)</TableHead>
                  <TableHead className="whitespace-nowrap">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalData.map((data) => (
                  <TableRow key={data.date}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(data.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{data.avg_temp.toFixed(1)}</TableCell>
                    <TableCell>{data.avg_humidity.toFixed(0)}</TableCell>
                    <TableCell>{data.avg_wind_speed.toFixed(1)}</TableCell>
                    <TableCell className="capitalize">{data.most_common_description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}