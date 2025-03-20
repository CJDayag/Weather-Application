import React, { useEffect, useState, useId } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2Icon, CirclePlay, CirclePause, PlusIcon } from 'lucide-react';

interface Location {
  id: number;
  name: string;
}

interface Alert {
  id: number;
  location: string;
  condition: string;
  threshold_value: number;
  is_active: boolean;
}

const ALERTS = import.meta.env.VITE_ALERTS_URL;
const CREATE_ALERT = import.meta.env.VITE_CREATE_ALERT_URL;
const TOGGLE_ALERT = import.meta.env.VITE_ALERT_TOGGLE_URL;
const DELETE_ALERT = import.meta.env.VITE_DELETE_ALERT_URL;

const Alerts: React.FC = () => {
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlert, setNewAlert] = useState({ location: '', condition: '', threshold_value: '' });
  const [message, setMessage] = useState<string | null>(null);
  const locationId = useId();
  const conditionId = useId();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${ALERTS}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserLocations(response.data.user_locations);
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${CREATE_ALERT}`, newAlert, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(response.data.message);
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const handleToggleAlert = async (alertId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${TOGGLE_ALERT}${alertId}/`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(response.data.message);
      fetchAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${DELETE_ALERT}${alertId}/`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(response.data.message);
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Weather Alerts Configuration</h1>
      
      {message && (
        <Alert variant="default" className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      <Card className="rounded-lg shadow-md p-6 mb-6">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-semibold mb-4">Create New Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border-input bg-background focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive relative rounded-md border shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-[input:is(:disabled)]:*:pointer-events-none">
              <Label htmlFor={locationId} className="text-foreground block px-3 pt-2 text-xs font-medium">
                  Location
                </Label>
                <Select
                  value={newAlert.location}
                  onValueChange={(value) => setNewAlert({ ...newAlert, location: value })}
                >
                  <SelectTrigger
                    id={locationId}
                    className="border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0"
                  >
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {userLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border-input bg-background focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive relative rounded-md border shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-[input:is(:disabled)]:*:pointer-events-none">
                <label htmlFor={conditionId} className="text-foreground block px-3 pt-2 text-xs font-medium">
                  Condition
                </label>
                <Select
                  value={newAlert.condition}
                  onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                >
                  <SelectTrigger
                    id={conditionId}
                    className="border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0"
                  >
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temp_above">Temperature Above</SelectItem>
                    <SelectItem value="temp_below">Temperature Below</SelectItem>
                    <SelectItem value="rain_above">Rainfall Above</SelectItem>
                    <SelectItem value="wind_above">Wind Speed Above</SelectItem>
                    <SelectItem value="humidity_above">Humidity Above</SelectItem>
                    <SelectItem value="humidity_below">Humidity Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="*:not-first:mt-2">
              <Label htmlFor={"threshold_value"} className="block text-sm font-medium text-gray-700 mb-1">Threshold Value</Label>
              <div className="relative">
                <Input
                  type="number"
                  id={"threshold_value"}
                  name="threshold_value"
                  value={newAlert.threshold_value}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold_value: e.target.value })}
                  required
                  step="0.1"
                  className="peer pe-9"
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 peer-disabled:opacity-50">
                  °C
                </div>
              </div>
            </div>
            <div>
              <Button type="submit" variant="default" className="w-full">
                <PlusIcon />
                Create Alert
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card className="rounded-lg shadow-md p-6">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-semibold mb-4">Your Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.condition}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.threshold_value}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {alert.is_active ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          <Button onClick={() => handleToggleAlert(alert.id)}>
                            {alert.is_active ? <CirclePause /> : <CirclePlay />}
                            {alert.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button variant='destructive' onClick={() => handleDeleteAlert(alert.id)}>
                            <Trash2Icon />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500">You don't have any alerts configured yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;