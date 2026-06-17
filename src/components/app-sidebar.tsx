"use client";

import * as React from "react";
import { Hammer, LifeBuoy, MapPin, Send, Ticket, VectorSquare, Users, Scroll, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  const permissions = user.permissions || [];

  const maintenanceItems = [
    permissions.includes("ticket.read") && {
      title: "Tickets",
      url: "/maintenance/tickets",
      icon: Ticket,
      isActive: pathname.startsWith("/maintenance/tickets"),
    },

    permissions.includes("department.read") && {
      title: "Departments",
      url: "/maintenance/departments",
      icon: VectorSquare,
      isActive: pathname === "/maintenance/departments",
    },

    permissions.includes("technician.read") && {
      title: "Technicians",
      url: "/maintenance/technician",
      icon: Hammer,
      isActive: pathname === "/maintenance/technician",
    },

    permissions.includes("location.read") && {
      title: "Locations",
      url: "/maintenance/location",
      icon: MapPin,
      isActive: pathname === "/maintenance/location",
    },
  ].filter(Boolean);

  const settingItems = [
    {
      title: "My Profile",
      url: "/My-Profile",
      icon: User,
      isActive: pathname === "/My-Profile",
    },

    permissions.includes("user.read") && {
      title: "Users",
      url: "/user",
      icon: Scroll,
      isActive: pathname === "/user",
    },

    permissions.includes("role.read") && {
      title: "Roles",
      url: "/roles",
      icon: Users,
      isActive: pathname === "/roles",
    },
  ].filter(Boolean);

  const data = {
    user: {
      name: user.name || "",
      email: user.email || "",
      avatar: "",
    },

    navSingle: maintenanceItems,

    navSecondary: [
      {
        title: "Support",
        url: "#",
        icon: LifeBuoy,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Header */}
      <SidebarHeader className="h-20 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="/dashboard">
              <div className="flex items-center px-2">
                <img src="/Ecole2.png" alt="Ecole" width={180} className="object-contain" />
              </div>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <NavMain maintenanceItems={maintenanceItems} settingItems={settingItems} />
      </SidebarContent>
    </Sidebar>
  );
}
