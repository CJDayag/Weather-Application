import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { AlertCircle, Cloud, MapPin } from "lucide-react";
import AppLogo from "@/components/app-logo";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarRail, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem,
  SidebarMenuButton,
 } from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Weather",
      url: "#",
      icon: Cloud,
      items: [
        {
          title: "Dashboard",
          url: "/weather/dashboard",
        },
        {
          title: "History",
          url: "/weather/history",
        },
        {
          title: "Forecast",
          url: "/weather/forecast",
        },
      ],
    },
    {
      title: "Alert",
      url: "#",
      icon: AlertCircle,
      items: [
        {
          title: "Alerts",
          url: "/weather/alerts",
        },
      ],
    },
    {
      title: "Locations",
      url: "#",
      icon: MapPin,
      items: [
        {
          title: "Search",
          url: "/weather/add-location",
        },
        {
          title: "Locations",
          url: "/weather/locations",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();

  const navMainWithActiveState = data.navMain.map((navItem) => {
    const isActive = navItem.items.some((item) => item.url === location.pathname);
    return {
      ...navItem,
      isActive,
      items: navItem.items.map((item) => ({
        ...item,
        isActive: item.url === location.pathname,
      })),
    };
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/dashboard" prefetch="none">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActiveState} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}