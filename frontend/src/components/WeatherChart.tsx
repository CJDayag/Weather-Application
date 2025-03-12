import { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { HistoricalData, ForecastData } from '../types/weather';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface WeatherChartProps {
    data: HistoricalData[] | ForecastData[];
    type: 'historical' | 'forecast';
}

export default function WeatherChart({ data, type }: WeatherChartProps) {
    const chartRef = useRef<ChartJS>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, []);

    const chartData = {
        labels: data.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: type === 'historical' ? [
            {
                label: 'Temperature (°C)',
                data: (data as HistoricalData[]).map(item => item.avg_temp),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.3
            },
            {
                label: 'Humidity (%)',
                data: (data as HistoricalData[]).map(item => item.avg_humidity),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.3,
                yAxisID: 'humidity'
            }
        ] : [
            {
                label: 'Predicted Temperature (°C)',
                data: (data as ForecastData[]).map(item => item.temperature),
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 2,
                tension: 0.3
            },
            {
                label: 'Min Temperature (°C)',
                data: (data as ForecastData[]).map(item => item.min_temp),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                tension: 0.3,
                borderDash: [5, 5]
            },
            {
                label: 'Max Temperature (°C)',
                data: (data as ForecastData[]).map(item => item.max_temp),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                tension: 0.3,
                borderDash: [5, 5]
            }
        ]
    };

    const options = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: 'Temperature (°C)'
                }
            },
            ...(type === 'historical' ? {
                humidity: {
                    position: 'right' as const,
                    beginAtZero: false,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Humidity (%)'
                    }
                }
            } : {}),
            x: {
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        }
    };

    return (
        <Card className="w-full py-6">
        <CardHeader>
            <CardTitle className="text-lg font-medium">
            {type === "historical" ? "Historical Weather Data" : "Weather Forecast"}
            </CardTitle>
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
            <Chart
                ref={chartRef}
                type="line"
                data={chartData}
                options={{
                ...options,
                maintainAspectRatio: false,
                responsive: true, // Ensure responsiveness
                }}
            />
            </div>
        </CardContent>
        </Card>
    );
}
