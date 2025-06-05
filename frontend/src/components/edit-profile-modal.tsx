"use client";

import { useState, useEffect } from "react";
import { useImageUpload } from "@/hooks/use-image-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ImagePlusIcon, XIcon, CircleX, Loader2, CircleCheckIcon, CircleUser } from "lucide-react";
import PasswordInput from "@/components/comp-23";
import axios from "axios";

// Environment variables
const API = import.meta.env.VITE_API_URL;
const UPDATE_PROFILE = import.meta.env.VITE_PROFILE_UPDATE_URL;
const PROFILE = import.meta.env.VITE_PROFILE_URL;

interface User {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  avatar: string | null;
}

export default function EditProfileModal() {
  const [open, setOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Image upload hook
  const {
    previewUrl,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  } = useImageUpload({ avatar: user?.avatar || null });

  useEffect(() => {
    if (open) {
      setLoading(true);
      const fetchUser = async () => {
        try {
          const accessToken = localStorage.getItem("access_token");
          if (!accessToken) {
            console.error("No access token found.");
            setLoading(false);
            return;
          }
          const response = await axios.get(`${API}${PROFILE}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setUser(response.data);
          setFirstName(response.data.first_name || "");
          setLastName(response.data.last_name || "");
          setUsername(response.data.username || "");
          setEmail(response.data.email || "");
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("No access token found. Please log in.");
        return;
      }
      
      const formData = new FormData();
      if (firstName) formData.append("first_name", firstName);
      if (lastName) formData.append("last_name", lastName);
      if (username) formData.append("username", username);
      if (email) formData.append("email", email);
      if (fileInputRef.current?.files?.length) {
        formData.append("avatar", fileInputRef.current.files[0]);
      }
      
      const response = await axios.patch(
        `${API}${UPDATE_PROFILE}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      toast.custom(() => (
        <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
            <div className="flex gap-2">
                <div className="flex grow gap-3">
                    <CircleCheckIcon
                        className="mt-0.5 shrink-0 text-emerald-500"
                        size={16}
                        aria-hidden="true"
                    />
                    <div className="flex grow justify-between gap-12">
                        Profile saved!
                    </div>
                </div>
            </div>
        </div>
      ));
      
      setOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error(error);
      toast.error("Error saving profile. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("No access token found. Please log in.");
        setPasswordLoading(false);
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
      ));

      // Reset form and close password section
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangePasswordOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error changing password. Please try again.");
    }

    setPasswordLoading(false);
  };
  
  const displayedAvatar = previewUrl || (user?.avatar || "");
  
  if (loading && open) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            <CircleUser />
            Profile
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!user && open) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            <CircleUser />
            Profile
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-6">
            <Card className="max-w-md mx-auto">
              <CardHeader className="flex items-center gap-2">
                <CircleX className="text-red-500" size={24} />
                <CardTitle>Error: User not found</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Please check your account settings or try logging in again.</p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          className="cursor-pointer"
        >
          <CircleUser />
          Profile
        </DropdownMenuItem>
      </DialogTrigger>
      
      <DialogContent aria-describedby={undefined} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="border-b px-6 py-4 text-base">Edit Profile</DialogTitle>
          <DialogDescription className="sr-only">
            Update your personal information and manage your account settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="w-full space-y-6 p-2">
          <div>
            <div className="relative mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-xs shadow-black/10">
              {displayedAvatar && (
                <img
                  src={displayedAvatar}
                  alt="Avatar Preview"
                  className="h-full w-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={handleThumbnailClick}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white outline-none hover:bg-black/80"
                aria-label="Change avatar"
              >
                <ImagePlusIcon size={16} aria-hidden="true" />
              </button>
              {displayedAvatar && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white outline-none hover:bg-black/80"
                  aria-label="Remove avatar"
                >
                  <XIcon size={16} aria-hidden="true" />
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload avatar"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {isChangePasswordOpen && (
            <div className="space-y-4 border rounded-md p-4 bg-muted/30">
              <h3 className="text-sm font-medium">Change Password</h3>
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsChangePasswordOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="submit">Save Changes</Button>
            {!isChangePasswordOpen && (
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                Change Password
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
