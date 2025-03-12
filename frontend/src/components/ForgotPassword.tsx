import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CircleCheck, CircleX } from 'lucide-react';

// Helper function to extract a cookie value by name.
function getCookie(name: string): string | null {
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='));
  return cookieValue ? cookieValue.split('=')[1] : null;
}

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    // Ensure axios sends cookies with the request.
    axios.defaults.withCredentials = true;
    
    // Get CSRF token from cookies.
    const csrfToken = getCookie('csrftoken');

    try {
      const response = await axios.post(
        'http://localhost:8000/api/password-reset/',
        { email },
        { headers: { 'X-CSRFToken': csrfToken || '' } }
      );
      if (response.status === 200) {
        setMessage('Password reset link sent to your email.');
        const msg = 'Password reset link sent!';
        const toastId = "fetch-success";
        toast.custom(
          () => (
            <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
              <div className="flex gap-2">
                <div className="flex grow gap-3">
                  <CircleCheck
                    className="mt-0.5 shrink-0 text-emerald-500"
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
          { id: toastId, duration: 3000 }
        );
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'An error occurred.');
      const msg = 'Error sending password reset email';
      const toastId = "fetch-error";
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
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10 py-6">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          {message && (
            <p className="text-sm text-center text-red-600">
              {message}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ForgotPassword;