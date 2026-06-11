"use client";

import * as React from "react";
import { Hammer, LifeBuoy, MapPin, Send, Ticket, VectorSquare, Users, Scroll } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";


export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

const permissions = user.permissions || [];

  const navItems = [
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

    permissions.includes("location.create") && {
      title: "Locations",
      url: "/maintenance/location",
      icon: MapPin,
      isActive: pathname === "/maintenance/location",
    },

    permissions.includes("user.read") && {
      title: "Users",
      url: "/maintenance/user",
      icon: Scroll,
      isActive: pathname === "/maintenance/user",
    },

    permissions.includes("role.read") && {
      title: "Roles",
      url: "/maintenance/roles",
      icon: Users,
      isActive: pathname === "/maintenance/roles",
    },
  ].filter(Boolean);

  const data = {
    user: {
      name: user.name || "",
      email: user.email || "",
      avatar: "",
    },

    navSingle: navItems,

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
        <NavMain items={data.navSingle} />

        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
