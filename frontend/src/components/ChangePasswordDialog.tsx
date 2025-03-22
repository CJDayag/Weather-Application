"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CircleCheckIcon } from "lucide-react";
import PasswordInput from "@/components/comp-23";
import { useState } from "react";
import axios from "axios";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ChangePasswordDialog = ({ open, onOpenChange }: ChangePasswordDialogProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("No access token found. Please log in.");
        setLoading(false);
        return;
      }

      await axios.post(
        "http://127.0.0.1:8000/api/profile/change-password/",
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Success message
      toast.custom(() => (
        <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
          <div className="flex gap-2">
            <CircleCheckIcon className="mt-0.5 shrink-0 text-emerald-500" size={16} />
            <p className="text-sm">Password changed successfully</p>
          </div>
        </div>
      ), { id: "passwordChangeSuccess", duration: 2000 });

      // Reset form and close dialog
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("Error changing password. Please try again.");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Change Password</DialogTitle>
        <p className="text-sm text-muted-foreground mb-4">
          Please fill out the fields below to update your password.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPassword" className="mb-2 block">Current Password</Label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="newPassword" className="mb-2 block">New Password</Label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="mb-2 block">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleChangePassword} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
