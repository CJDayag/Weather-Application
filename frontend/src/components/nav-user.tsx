"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, LogOut, CircleUser, CircleCheckIcon } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import ProfileDialog from "@/components/ProfileDialog";

import { toast } from "sonner";

type UserData = {
  id?: number;
  name: string;
  avatar: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

export function NavUser() {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  // Set initial state to null until we load user data.
  const [user, setUser] = useState<UserData | null>(null);

  // Helper function to get full avatar URL if needed.
  const getAvatarUrl = (avatar: string) => {
    if (avatar.startsWith("http") || avatar.startsWith("/")) {
      return avatar;
    }
    const fullUrl = `http://127.0.0.1:8000/media/${avatar}`;
    return fullUrl;
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser: UserData = JSON.parse(storedUser);
        const computedName = `${parsedUser.first_name || ""} ${parsedUser.last_name || ""}`.trim();
        if (computedName) {
          parsedUser.name = computedName;
        }
        setUser(parsedUser);
        return;
      }
      setUser({
        name: "Guest",
        avatar: "/default-avatar.png",
      });
    } catch (error) {
      setUser({
        name: "Guest",
        avatar: "/default-avatar.png",
      });
    }
  }, []);

  const getInitials = (user: UserData) => {
    // Use first and last name initials, prioritizing the computed display name.
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.name) {
      return user.name[0].toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
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
                        <p className="text-sm">Logged out successfully</p>
                    </div>
                </div>
            </div>
        </div>
    ));
    await sleep(2000); // Wait for 2 seconds
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
};

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.avatar ? (
                  <AvatarImage src={getAvatarUrl(user.avatar)} alt={user.name || "User"} />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name || "Guest"}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar ? (
                    <AvatarImage src={getAvatarUrl(user.avatar)} alt={user.name || "User"} />
                  ) : null}
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name || "Guest"}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Profile Link */}
            <ProfileDialog />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}