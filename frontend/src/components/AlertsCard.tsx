import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WeatherAlert } from '../types/weather';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from 'axios';

interface AlertsCardProps {
  alerts: WeatherAlert[];
}

export default function AlertsCard({ alerts }: AlertsCardProps) {
  const [fetchedAlerts, setFetchedAlerts] = useState<WeatherAlert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get('/api/alerts/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFetchedAlerts(response.data.alerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <Card className='py-6'>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Weather Alerts</CardTitle>
        <Button variant="link" asChild>
          <Link to="../weather/alerts">Configure</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {fetchedAlerts.length > 0 ? (
          <div className="space-y-3">
            {fetchedAlerts.map((alert, index) => (
              <Alert key={index} variant="destructive" className="border-l-4 border-red-500">
                <AlertTitle className="font-bold text-lg">{alert.location}</AlertTitle>
                <AlertDescription className="space-y-1">
                  <div className="font-medium">Condition: {alert.condition}</div>
                  <div className="font-medium">Threshold: {alert.threshold_value}</div>
                  <div className="font-medium">Status: {alert.is_active ? 'Active' : 'Inactive'}</div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">No active alerts</div>
        )}
      </CardContent>
    </Card>
  );
}