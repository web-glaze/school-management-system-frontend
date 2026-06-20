"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { NavUser } from "../nav-user";

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
  if (pathname === "/user") return { parent: "Dashboard", parentHref: "/dashboard", current: "Users" };
  if (pathname === "/roles") return { parent: "Dashboard", parentHref: "/dashboard", current: "Roles & Permissions" };
  return { parent: null, parentHref: "/dashboard", current: "Dashboard" };
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-purple-500",
  admin: "bg-sky-500",
  manager: "bg-amber-500",
  user: "bg-emerald-500",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  const data = {
    user: {
      name: user.name || "",
      email: user.email || "",
      avatar: "",
    },
  };

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />

      <SidebarInset>
        <header className="flex h-20 items-center justify-between gap-2 border-b px-4 sticky top-0 z-40 bg-white">
          <div className="flex-1 flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
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
          </div>
          <div>
            <NavUser user={data.user} />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6 bg-gray-100">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
