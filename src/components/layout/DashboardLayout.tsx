"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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

interface User {
  email: string;

  role: "superadmin" | "admin" | "manager" | "technician" | "user";
}

// Pretty labels for known route segments — fall back to a title-cased copy
// of the raw segment so a brand-new page still gets a sensible breadcrumb.
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  maintenance: "Maintenance",
  tickets: "Tickets",
  create: "New Ticket",
  technician: "Technicians",
  departments: "Departments",
  location: "Locations",
  user: "Users",
  "my-complaints": "My Complaints",
};

function prettySegment(seg: string): string {
  if (ROUTE_LABELS[seg]) return ROUTE_LABELS[seg];
  // Skip ids that look like uuids/cuids.
  if (/^[0-9a-f-]{8,}$/i.test(seg)) return "Details";
  return seg
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [user, setUser] = useState<User | null>(null);

  // Build the trail from the URL: "/maintenance/tickets/abc" →
  // [{label: "Maintenance", href: "/maintenance"},
  //  {label: "Tickets",     href: "/maintenance/tickets"},
  //  {label: "Details",     href: "/maintenance/tickets/abc"}]
  const crumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, i) => ({
      label: prettySegment(seg),
      href: "/" + segments.slice(0, i + 1).join("/"),
    }));
  }, [pathname]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      router.push("/login");

      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      router.push("/login");
    }
  }, [router]);

  if (!user) return null;

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />

      <SidebarInset>
        <header className="flex h-20 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-40 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <span key={c.href} className="flex items-center gap-1">
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{c.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={c.href}>
                          {c.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-6 bg-gray-100">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
