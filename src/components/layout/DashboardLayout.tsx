"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Separator } from "../ui/separator";

interface User {
  name?: string;
  email: string;
  role: "superadmin" | "admin" | "manager" | "user";
}

function getBreadcrumb(pathname: string): { parent: string | null; parentHref: string; current: string } {
  if (pathname === "/dashboard") return { parent: null, parentHref: "/dashboard", current: "Dashboard" };
  if (pathname === "/maintenance") return { parent: "Dashboard", parentHref: "/dashboard", current: "Maintenance" };
  if (pathname === "/maintenance/tickets") return { parent: "Maintenance", parentHref: "/maintenance", current: "Tickets" };
  if (pathname === "/maintenance/tickets/create") return { parent: "Tickets", parentHref: "/maintenance/tickets", current: "Create Ticket" };
  if (pathname.startsWith("/maintenance/tickets/")) return { parent: "Tickets", parentHref: "/maintenance/tickets", current: "Ticket Detail" };
  if (pathname === "/maintenance/departments") return { parent: "Maintenance", parentHref: "/maintenance", current: "Departments" };
  if (pathname === "/maintenance/technician") return { parent: "Maintenance", parentHref: "/maintenance", current: "Technicians" };
  if (pathname === "/maintenance/location") return { parent: "Maintenance", parentHref: "/maintenance", current: "Locations" };
  if (pathname === "/maintenance/user") return { parent: "Maintenance", parentHref: "/maintenance", current: "Users" };
  if (pathname === "/maintenance/roles") return { parent: "Maintenance", parentHref: "/maintenance", current: "Roles & Permissions" };
  return { parent: null, parentHref: "/dashboard", current: "Dashboard" };
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-purple-500",
  admin: "bg-sky-500",
  manager: "bg-amber-500",
  user: "bg-emerald-500",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      window.location.href = "/login";
      return;
    }

    queueMicrotask(() => {
      setUser(JSON.parse(storedUser));
    });
  }, []);

  if (!user) return null;

  const { parent, parentHref, current } = getBreadcrumb(pathname);
  const role = (user.role || "user").toLowerCase();
  const roleColor = ROLE_COLORS[role] ?? "bg-gray-400";

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-white/90 backdrop-blur-sm px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {parent && (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href={parentHref}>{parent}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{current}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <span className={`inline-block size-2 rounded-full ${roleColor}`} />
              {user.name || user.email}
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 md:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
