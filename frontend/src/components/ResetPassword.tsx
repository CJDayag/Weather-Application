import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { CircleX, CircleCheck } from "lucide-react";

const ResetPassword: React.FC = () => {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Helper function to display a toast notification.
  const showToast = (title: string, description: string, success: boolean = false) => {
    const toastId = success ? "password-reset-success" : "password-error";
    const Icon = success ? CircleCheck : CircleX;
    toast.custom(
      () => (
        <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
          <div className="flex gap-2">
            <Icon className={`mt-0.5 shrink-0 ${success ? 'text-emerald-500' : 'text-red-500'}`} size={16} aria-hidden="true" />
            <div className="flex flex-col">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      ),
      { id: toastId, duration: 2000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check for password match.
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "Please ensure both password fields are identical.");
      return;
    }

    // IMPORTANT: Check that uidb64 and token are defined.
    if (!uidb64 || !token) {
      showToast("Invalid Link", "Reset link parameters are missing or invalid.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/password-reset-confirm/${uidb64}/${token}/`,
        { password }
      );
      if (response.status === 200) {
        showToast("Password Reset Successful", "You can now log in using your new password.", true);
        navigate("/login");
      }
    } catch (error: any) {
      showToast("Error Resetting Password", error.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPassword;