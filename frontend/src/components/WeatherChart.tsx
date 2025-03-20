import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Import your existing types
import { HistoricalData, ForecastData } from "../types/weather";

interface WeatherChartProps {
  data: HistoricalData[] | ForecastData[];
  type: "historical" | "forecast";
}

const WeatherChart: React.FC<WeatherChartProps> = ({ data, type }) => {
  // Chart configuration with varying colors based on chart type
  const chartConfig = {
    temperature: {
      label: "Temperature",
      color: type === "historical" ? "hsl(var(--chart-1))" : "hsl(var(--chart-4))",
    },
    avg_temp: {
      label: "Avg Temp",
      color: "hsl(var(--chart-1))",
    },
    min_temp: {
      label: "Min Temp",
      color: type === "historical" ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))",
    },
    max_temp: {
      label: "Max Temp",
      color: type === "historical" ? "hsl(var(--chart-3))" : "hsl(var(--chart-6))",
    },
    avg_humidity: {
      label: "Avg Humidity",
      color: "hsl(var(--chart-2))",
    },
    precipitation: {
      label: "Precipitation",
      color: "hsl(var(--chart-8))",
    },
  } satisfies ChartConfig;

  // Format the date labels for better display
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  // Function to check if this is forecast data
  const isForecastData = (data: any[]): data is ForecastData[] => {
    return type === "forecast";
  };

  // Function to check if this is historical data
  const isHistoricalData = (data: any[]): data is HistoricalData[] => {
    return type === "historical";
  };

  return (
    <div className="w-full h-80">
      <ChartContainer config={chartConfig} className="w-full h-full px-2">
        <LineChart
          accessibilityLayer
          data={formattedData}
          margin={{ left: 20, right: 30, top: 20, bottom: 20 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          {/* Left Y-axis for temperature */}
          <YAxis
            yAxisId="temp"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            domain={["auto", "auto"]}
            tickFormatter={(value) => `${value.toFixed(1)}°`}
            label={{
                value: "Temperature (°C)",
                angle: -90, // Rotates the label vertically
                position: "insideLeft", // Position of the label
                style: { textAnchor: "middle", fill: "#555" }, // Styling options
              }}
          />
          {/* Right Y-axis for humidity */}
          <YAxis
            yAxisId="humidity"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            domain={["auto", "auto"]}
            tickFormatter={(value) => `${value}%`}
            label={{
                value: "Humidity (%)",
                angle: 90,
                position: "insideRight",
                style: { textAnchor: "middle", fill:"#555" },
              }}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          
          {isHistoricalData(data) && (
            <>
              <Line
                yAxisId="temp"
                dataKey="avg_temp"
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="humidity"
                dataKey="avg_humidity"
                type="monotone"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </>
          )}
          
          {isForecastData(data) && (
            <Line
              yAxisId="temp"
              dataKey="temperature"
              type="monotone"
              stroke="var(--chart-4)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
          
          <Line
            yAxisId="temp"
            dataKey="min_temp"
            type="monotone"
            stroke="var(--chart-5)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="temp"
            dataKey="max_temp"
            type="monotone"
            stroke="var(--chart-3)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};

export default WeatherChart;