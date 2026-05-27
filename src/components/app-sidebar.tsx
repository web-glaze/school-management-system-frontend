"use client";

import * as React from "react";

import {
  ChartColumnBig,
  Hammer,
  LifeBuoy,
  MapPin,
  Send,
  Ticket,
  VectorSquare,
} from "lucide-react";

import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";

import { NavSecondary } from "@/components/nav-secondary";

import { NavUser } from "@/components/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps
  extends React.ComponentProps<
    typeof Sidebar
  > {
  role?:
    | "superadmin"
    | "admin"
    | "manager"
    | "user";
}

export function AppSidebar({
  role = "admin",
  ...props
}: AppSidebarProps) {

  const pathname =
    usePathname();

  /* SUPER ADMIN */
  const superAdminMenu = [
    {
      title: "Dashboard",

      url: "/dashboard",

      icon:
        ChartColumnBig,

      isActive:
        pathname ===
        "/dashboard",
    },

    {
      title: "Maintenance",

      url: "/maintenance",

      icon: Ticket,

      isActive:
        pathname ===
          "/maintenance" ||
        pathname.startsWith(
          "/maintenance/",
        ),
    },
  ];

  /* ADMIN */
  const adminMenu = [
    {
      title: "Dashboard",

      url: "/maintenance",

      icon: Ticket,

      isActive:
        pathname ===
          "/maintenance" ||
        pathname ===
          "/maintenance/",
    },

    {
      title: "Complaints",

      url: "/maintenance/complaints",

      icon: Ticket,

      isActive:
        pathname ===
        "/maintenance/complaints",
    },

    {
      title: "Departments",

      url: "/maintenance/departments",

      icon:
        VectorSquare,

      isActive:
        pathname ===
        "/maintenance/departments",
    },

    {
      title: "Technicians",

      url: "/maintenance/technician",

      icon: Hammer,

      isActive:
        pathname ===
        "/maintenance/technician",
    },

    {
      title: "Locations",

      url: "/maintenance/location",

      icon: MapPin,

      isActive:
        pathname ===
        "/maintenance/location",
    },
  ];

  /* MANAGER */
  const managerMenu = [
    {
      title: "Maintenance",

      url: "/maintenance",

      icon: Ticket,

      isActive:
        pathname ===
          "/maintenance" ||
        pathname ===
          "/maintenance/",
    },

    {
      title: "Complaints",

      url: "/maintenance/complaints",

      icon: Ticket,

      isActive:
        pathname ===
        "/maintenance/complaints",
    },
  ];

  /* USER */
  const userMenu = [
    {
      title: "Maintenance",

      url: "/maintenance",

      icon: Ticket,

      isActive:
        pathname ===
          "/maintenance" ||
        pathname ===
          "/maintenance/",
    },
  ];

  let navItems =
    userMenu;

  if (
    role ===
    "superadmin"
  ) {

    navItems =
      superAdminMenu;

  } else if (
    role === "admin"
  ) {

    navItems =
      adminMenu;

  } else if (
    role ===
    "manager"
  ) {

    navItems =
      managerMenu;
  }

  const data = {
    user: {
      name: "Ecole ERP",

      email:
        "admin@ecole.com",

      avatar:
        "/ui/shadcn.jpg",
    },

    navSingle:
      navItems,

    navSecondary: [
      {
        title:
          "Support",

        url: "#",

        icon:
          LifeBuoy,
      },

      {
        title:
          "Feedback",

        url: "#",

        icon: Send,
      },
    ],
  };

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >

      {/* Header */}
      <SidebarHeader className="h-20 border-b border-sidebar-border">

        <SidebarMenu>

          <SidebarMenuItem>

            <a href="/dashboard">

              <div className="flex items-center px-2">

                <img
                  src="/Ecole2.png"
                  alt="Ecole"
                  width={180}
                  className="object-contain"
                />
              </div>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>

        <NavMain
          items={
            data.navSingle
          }
        />

        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>

        <NavUser
          user={data.user}
        />
      </SidebarFooter>
    </Sidebar>
  );
}