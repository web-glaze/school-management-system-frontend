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
import { usePathname, useRouter } from "next/navigation";
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: "superadmin" | "admin" | "manager" | "technician" | "user";
}

interface StoredUser {
  id?: string;
  email?: string;
  role?: string;
  roles?: string[];
}

export function AppSidebar({ role, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Read user from localStorage inside the component so it is reactive on
  // login/logout — reading at module scope ran only once at JS load and kept
  // a stale user across sessions.
  const [user, setUser] = React.useState<StoredUser>({});

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : {});
    } catch {
      setUser({});
    }
  }, []);

  // If a role was not explicitly passed, fall back to what's stored. We do
  // NOT silently default to "admin" any more — that would leak admin menu to
  // unauthenticated visitors. If we genuinely have nothing, send to /login.
  const effectiveRole: AppSidebarProps["role"] =
    role ?? (user.role as AppSidebarProps["role"]) ?? "user";

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  /* SUPER ADMIN */
  const superAdminMenu = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: ChartColumnBig,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Ticket,
      isActive:
        pathname === "/maintenance" || pathname.startsWith("/maintenance/"),
    },
  ];

  /* ADMIN */
  const adminMenu = [
    {
      title: "Dashboard",
      url: "/maintenance",
      icon: Ticket,
      isActive: pathname === "/maintenance" || pathname === "/maintenance/",
    },

    {
      title: "Tickets",
      url: "/maintenance/tickets",
      icon: Ticket,
      isActive: pathname === "/maintenance/tickets",
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
  ];

  /* MANAGER */
  const managerMenu = [
    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Ticket,
      isActive: pathname === "/maintenance" || pathname === "/maintenance/",
    },
    {
      title: "Tickets",
      url: "/maintenance/tickets",
      icon: Ticket,
      isActive: pathname === "/maintenance/tickets",
    },
  ];

  /* TECHNICIAN */
  const technicianMenu = [
    {
      title: "My Tickets",
      url: "/maintenance/tickets",
      icon: Ticket,
      isActive:
        pathname === "/maintenance/tickets" ||
        pathname.startsWith("/maintenance/tickets/"),
    },
  ];

  /* USER */
  const userMenu = [
    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Ticket,
      isActive: pathname === "/maintenance" || pathname === "/maintenance/",
    },
  ];

  let navItems = userMenu;

  if (effectiveRole === "superadmin") {
    navItems = superAdminMenu;
  } else if (effectiveRole === "admin") {
    navItems = adminMenu;
  } else if (effectiveRole === "manager") {
    navItems = managerMenu;
  } else if (effectiveRole === "technician") {
    navItems = technicianMenu;
  }

  const data = {
    user: {
      name: user.email ? user.email.split("@")[0] : "",
      email: user.email ?? "",
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
