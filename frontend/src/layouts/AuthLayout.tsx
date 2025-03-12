import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from 'react';

export default function AuthLayout() {
  const location = useLocation();

  const breadcrumbItems = useMemo(() => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return pathnames.map((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
      return (
        <BreadcrumbItem key={to}>
          {index === pathnames.length - 1 ? (
            <BreadcrumbPage>{value}</BreadcrumbPage>
          ) : (
            <BreadcrumbItem />
          )}
        </BreadcrumbItem>
      );
    });
  }, [location]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 flex flex-col transition-all duration-200 ease-linear overflow-x-hidden">
        <header>
          <div className="flex items-center p-4">
            <SidebarTrigger />
            <Breadcrumb className="ml-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Weather</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {breadcrumbItems}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          <SidebarInset
            className="block lg:block"
            style={{
              width: '100%',
              transition: 'margin 0.2s linear'
            }}
          >
            <Separator />
            <Outlet />
          </SidebarInset>
        </main>
      </div>
    </SidebarProvider>
  );
}