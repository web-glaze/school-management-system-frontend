"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Building2,
  Hammer,
  LayoutDashboard,
  LogOut,
  MapPin,
  Shield,
  Ticket,
  Wrench,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SidebarProps {
  role: "superadmin" | "admin" | "manager" | "user";
}

export default function AppSidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const superAdminMenu = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Wrench,
    },
  ];

  const adminMenu = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Wrench,
    },

    {
      title: "Complaints",
      url: "/maintenance/complaints",
      icon: Ticket,
    },

    {
      title: "Departments",
      url: "/maintenance/departments",
      icon: Building2,
    },

    {
      title: "Technicians",
      url: "/maintenance/technician",
      icon: Hammer,
    },

    {
      title: "Locations",
      url: "/maintenance/location",
      icon: MapPin,
    },
  ];

  const managerMenu = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Wrench,
    },

    {
      title: "Complaints",
      url: "/maintenance/complaints",
      icon: Ticket,
    },
  ];

  const userMenu = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Wrench,
    },
  ];

  let menuItems = userMenu;

  if (role === "superadmin") {
    menuItems = superAdminMenu;
  } else if (role === "admin") {
    menuItems = adminMenu;
  } else if (role === "manager") {
    menuItems = managerMenu;
  }

  return (
    <Sidebar
      collapsible="icon"
      className="
      border-r
      bg-background
    "
    >
      {/* Header */}
      <SidebarHeader
        className="
        h-20
        border-b
        px-4
        justify-center
      "
      >
        <div className="flex items-center gap-3">
          <div
            className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-primary
            text-primary-foreground
          "
          >
            <Shield className="h-5 w-5" />
          </div>

          <div className="flex flex-col">
            <span
              className="
              text-sm
              font-semibold
              tracking-tight
            "
            >
              ECOLE ERP
            </span>

            <span
              className="
              text-xs
              text-muted-foreground
              capitalize
            "
            >
              {role} panel
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.url;

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  size="lg"
                  tooltip={item.title}
                  className="
                    h-12
                    rounded-xl
                    text-muted-foreground
                    transition-all
                    duration-200

                    hover:bg-accent
                    hover:text-accent-foreground

                    data-[active=true]:bg-primary
                    data-[active=true]:text-primary-foreground
                    data-[active=true]:shadow-sm
                  "
                >
                  <Link href={item.url}>
                    <item.icon className="h-5 w-5 shrink-0" />

                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter
        className="
        border-t
        p-3
      "
      >
        <button
          onClick={() => {
            localStorage.removeItem("token");

            localStorage.removeItem("user");

            window.location.href = "/login";
          }}
          className="
          flex
          w-full
          items-center
          gap-3
          rounded-xl
          px-3
          py-3
          text-sm
          font-medium
          text-red-500
          transition-colors

          hover:bg-red-50
        "
        >
          <LogOut className="h-5 w-5" />

          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
