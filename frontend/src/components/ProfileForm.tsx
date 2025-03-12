"use client";

import { useEffect, useState } from "react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImagePlusIcon, XIcon, CircleX, Loader2, CircleCheckIcon } from "lucide-react";
import axios from "axios";

// Import shadcn Dialog components
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Import the password input component from comp-23 (renamed to PasswordInput)
import PasswordInput from "@/components/comp-23";

interface User {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  avatar: string | null;
}

export default function ProfileForm() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          console.error("No access token found.");
          return;
        }
        const response = await axios.get("http://127.0.0.1:8000/api/profile/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  if (!user)
    return (
      <div className="flex items-center justify-center h-8/12">
        <Card className="max-w-md mx-auto py-6">
          <CardHeader className="flex items-center gap-2">
            <CircleX className="text-red-500" size={24} />
            <CardTitle>Error: User not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please check your account settings or try logging in again.</p>
          </CardContent>
        </Card>
      </div>
    );
  return <ProfileFormContent user={user} />;
}

function ProfileFormContent({ user }: { user: User }) {
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");

  // State for change password (handled separately via dialog)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    previewUrl,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  } = useImageUpload({ avatar: user.avatar });
  const displayedAvatar = previewUrl || user.avatar;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("No access token found. Please log in.");
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
        "http://127.0.0.1:8000/api/profile/update/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      localStorage.setItem("user", JSON.stringify(response.data.user));
      alert("Profile saved!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error saving profile. Please try again.");
    }
  };

  // Separate handler for change password.
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        alert("No access token found. Please log in.");
        setPasswordLoading(false);
        return;
      }
      const payload = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      await axios.post(
        "http://127.0.0.1:8000/api/profile/change-password/",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msg = 'Password changed successfully';
      const toastId = "passwordChangeSuccess";
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
                            <p className="text-sm">{msg}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            { id: toastId, duration: 2000 }
          );
      // Reset password fields and close dialog
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangePasswordOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error changing password. Please try again.");
    }
    setPasswordLoading(false);
  };

  return (
    <form
      onSubmit={handleSave}
      className="w-full max-w-md mt-8 space-y-6 ml-8"
    >
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

      <div className="ml-8">
        <Avatar
          previewUrl={displayedAvatar}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          handleThumbnailClick={handleThumbnailClick}
          handleRemove={handleRemove}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row ml-8">
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

      <div className="space-y-2 ml-8">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="space-y-2 ml-8">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex justify-start ml-8 gap-4">
        <Button type="submit">Save Changes</Button>
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" type="button">
              Change Password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Change Password</DialogTitle>
            {/* Dialog description added */}
            <p className="text-sm text-muted-foreground mb-4">
              Please fill out the fields below to update your password.
            </p>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={passwordLoading}>
                {passwordLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}

function Avatar({
  previewUrl,
  fileInputRef,
  handleFileChange,
  handleThumbnailClick,
  handleRemove,
}: {
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: React.ChangeEventHandler<HTMLInputElement>;
  handleThumbnailClick: () => void;
  handleRemove: () => void;
}) {
  const currentImage = previewUrl;
  return (
    <div className="relative mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-xs shadow-black/10">
      {currentImage && (
        <img
          src={currentImage}
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
      {currentImage && (
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
  );
}