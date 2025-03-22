"use client";

import { useState } from "react";
import { Dialog, DialogDescription, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CircleUser } from "lucide-react";
import ProfileForm from "@/components/ProfileForm";

export default function ProfileDialog() {
  const [open, setOpen] = useState(false);

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

      <DialogContent aria-describedby={undefined} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="border-b px-6 py-4 text-base">Edit Profile</DialogTitle>
          <DialogDescription className="sr-only">
            Update your personal information and manage your account settings.
          </DialogDescription>
        </DialogHeader>
        
        <ProfileForm onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
