"use client";

import * as React from "react";
import {
  Hammer,
  MapPin,
  Ticket,
  VectorSquare,
  Scroll,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const user =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : {};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: "superadmin" | "admin" | "manager" | "user";
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  user: "User",
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-sky-100 text-sky-700 border border-sky-200",
  admin: "bg-sky-100 text-sky-700 border border-sky-200",
  manager: "bg-sky-100 text-sky-700 border border-sky-200",
  user: "bg-sky-100 text-sky-700 border border-sky-200",
};

export function AppSidebar({ role = "user", ...props }: AppSidebarProps) {
  const pathname = usePathname();

  // Normalize to lowercase - backend may send "ADMIN" or "admin"
  const normalizedRole = (role || "user").toLowerCase() as
    | "superadmin"
    | "admin"
    | "manager"
    | "user";

  const superAdminMenu = [
    {
      title: "Tickets",
      url: "/maintenance/tickets",
      icon: Ticket,
      isActive:
        pathname === "/maintenance/tickets" ||
        pathname.startsWith("/maintenance/tickets/"),
    },
    {
      title: "Departments",
      url: "/maintenance/departments",
      icon: VectorSquare,
      isActive: pathname === "/maintenance/departments",
    },
    {
      title: "Technicians",
      url: "/maintenance/technician",
      icon: Hammer,
      isActive: pathname === "/maintenance/technician",
    },
    {
      title: "Locations",
      url: "/maintenance/location",
      icon: MapPin,
      isActive: pathname === "/maintenance/location",
    },
    {
      title: "Users",
      url: "/maintenance/user",
      icon: UserCog,
      isActive: pathname === "/maintenance/user",
    },
    {
      title: "Roles & Permissions",
      url: "/maintenance/roles",
      icon: ShieldCheck,
      isActive: pathname === "/maintenance/roles",
    },
  ];

  const adminMenu = [...superAdminMenu];

  const managerMenu = [
    {
      title: "Tickets",
      url: "/maintenance/tickets",
      icon: Ticket,
      isActive:
        pathname === "/maintenance/tickets" ||
        pathname.startsWith("/maintenance/tickets/"),
    },
    {
      title: "My Complaints",
      url: "/maintenance/my-complaints",
      icon: Scroll,
      isActive: pathname === "/maintenance/my-complaints",
    },
  ];

  const userMenu = [
    {
      title: "Tickets",
      url: "/maintenance/tickets",
      icon: Ticket,
      isActive:
        pathname === "/maintenance/tickets" ||
        pathname.startsWith("/maintenance/tickets/"),
    },
    {
      title: "My Complaints",
      url: "/maintenance/my-complaints",
      icon: Scroll,
      isActive: pathname === "/maintenance/my-complaints",
    },
  ];

  let navItems = userMenu;
  if (normalizedRole === "superadmin") navItems = superAdminMenu;
  else if (normalizedRole === "admin") navItems = adminMenu;
  else if (normalizedRole === "manager") navItems = managerMenu;

  const roleLabel = ROLE_LABELS[normalizedRole] ?? normalizedRole;
  const roleColor =
    ROLE_COLORS[normalizedRole] ??
    "bg-sky-100 text-sky-700 border border-sky-200";

  const userData = {
    name: user.name || "",
    email: user.email || "",
    avatar: "",
    role: roleLabel,
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* -- Header -- */}
      <SidebarHeader className="p-0 bg-white" style={{boxShadow: "0 1px 0 0 oklch(0.92 0.008 240)"}}>
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="/dashboard" className="block">
              {/* Brand accent stripe */}
              <div className="h-[3px] w-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
              <div className="flex flex-col px-4 pt-4 pb-4 gap-3">
                <img
                  src="/Ecole2.png"
                  alt="Ecole ERP"
                  width={155}
                  className="object-contain"
                />
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    School Management
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${roleColor}`}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <NavMain items={navItems} role={normalizedRole} />
      </SidebarContent>
      <SidebarFooter className="bg-white" style={{boxShadow: "0 -2px 10px 0 rgba(14,116,235,0.06)"}}>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
