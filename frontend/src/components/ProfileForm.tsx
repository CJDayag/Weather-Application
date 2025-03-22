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
import ChangePasswordDialog from "@/components/ChangePasswordDialog";

interface User {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  avatar: string | null;
}

interface ProfileFormProps {
  onClose: () => void;
}

export default function ProfileForm({ onClose }: ProfileFormProps) {
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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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
      const msg = "Profile saved!";
      const toastId = toast.custom(() => (
        <div className="bg-background text-foreground w-full rounded-md border px-4 py-3 shadow-lg sm:w-[var(--width)]">
            <div className="flex gap-2">
                <div className="flex grow gap-3">
                    <CircleCheckIcon
                        className="mt-0.5 shrink-0 text-emerald-500"
                        size={16}
                        aria-hidden="true"
                    />
                    <div className="flex grow justify-between gap-12">
                        {msg}
                    </div>
                </div>
            </div>
        </div>
    ));
    setTimeout(() => {
      toast.dismiss(toastId);
  }, 3000);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error saving profile. Please try again.");
    }
  };


  return (
    <form
      onSubmit={handleSave}
      className="w-full max-w-md mt-8 space-y-6 ml-2"
    >
      <div>
        <Avatar
          previewUrl={displayedAvatar}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          handleThumbnailClick={handleThumbnailClick}
          handleRemove={handleRemove}
        />
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

      <div className="">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit">Save Changes</Button>
        <Button
        variant="outline"
        type="button"
        onClick={() => setIsChangePasswordOpen(true)}
      >
        Change Password
      </Button>
      <ChangePasswordDialog
      open={isChangePasswordOpen}
      onOpenChange={setIsChangePasswordOpen}
    />
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