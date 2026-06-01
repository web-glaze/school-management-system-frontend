"use client";

import * as React from "react";

import {
  ChartColumnBig,
  Hammer,
  Inbox,
  LifeBuoy,
  MapPin,
  Send,
  ShieldCheck,
  Ticket,
  Users,
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
import { AccessKey, canAccess, normaliseRole, Role } from "@/lib/rbac";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: Role;
}

interface StoredUser {
  id?: string;
  email?: string;
  role?: string;
  roles?: string[];
}

/**
 * Every nav item is paired with the AccessKey it requires. The sidebar
 * filters by `canAccess(role, key)` so menus are always in sync with the
 * RBAC layer in `src/lib/rbac.ts`. Add a new entry once, here, and it
 * appears for every role that has access.
 */
type NavEntry = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  access: AccessKey;
  // pathname matcher; default = exact match.
  match?: (pathname: string) => boolean;
};

const ALL_NAV: NavEntry[] = [
  {
    title: "Overview",
    url: "/maintenance",
    icon: ChartColumnBig,
    access: "overview",
    match: (p) => p === "/maintenance" || p === "/maintenance/",
  },
  {
    title: "Tickets",
    url: "/maintenance/tickets",
    icon: Ticket,
    access: "tickets.list",
    // Match the list AND ticket detail pages, BUT NOT /create — otherwise
    // both "Tickets" and "Raise Ticket" highlight at the same time on the
    // create page.
    match: (p) =>
      p === "/maintenance/tickets" ||
      (p.startsWith("/maintenance/tickets/") &&
        p !== "/maintenance/tickets/create"),
  },
  {
    title: "Raise Ticket",
    url: "/maintenance/tickets/create",
    icon: Send,
    access: "tickets.create",
    match: (p) => p === "/maintenance/tickets/create",
  },
  {
    title: "Assigned to Me",
    url: "/maintenance/assigned",
    icon: Inbox,
    access: "assigned-tickets",
    match: (p) => p === "/maintenance/assigned",
  },
  // "My Complaints" — page still exists at /maintenance/my-complaints but
  // we hide the sidebar entry. Reachable from the dashboard recent-activity
  // rows or by typing the URL. Re-add this block when end-users want a
  // dedicated nav link again.
  // {
  //   title: "My Complaints",
  //   url: "/maintenance/my-complaints",
  //   icon: Inbox,
  //   access: "my-complaints",
  //   match: (p) => p === "/maintenance/my-complaints",
  // },
  {
    title: "Departments",
    url: "/maintenance/departments",
    icon: VectorSquare,
    access: "departments",
    match: (p) => p === "/maintenance/departments",
  },
  {
    title: "Technicians",
    url: "/maintenance/technician",
    icon: Hammer,
    access: "technicians",
    match: (p) => p === "/maintenance/technician",
  },
  {
    title: "Locations",
    url: "/maintenance/location",
    icon: MapPin,
    access: "locations",
    match: (p) => p === "/maintenance/location",
  },
  {
    title: "Users",
    url: "/maintenance/user",
    icon: Users,
    access: "users",
    match: (p) => p === "/maintenance/user",
  },
  {
    title: "Roles & Permissions",
    url: "/maintenance/roles",
    icon: ShieldCheck,
    access: "roles",
    match: (p) => p === "/maintenance/roles",
  },
];

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

  // Prefer the role passed by the layout; fall back to the stored role.
  const effectiveRole: Role = role ?? normaliseRole(user.role);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Build the menu for this role by filtering the central nav list.
  const navItems = ALL_NAV.filter((item) =>
    canAccess(effectiveRole, item.access),
  ).map((item) => ({
    title: item.title,
    url: item.url,
    icon: item.icon as never,
    isActive: item.match
      ? item.match(pathname ?? "")
      : (pathname ?? "") === item.url,
  }));

  const data = {
    user: {
      name: user.email ? user.email.split("@")[0] : "",
      email: user.email ?? "",
      avatar: "",
    },
    navSingle: navItems,
    navSecondary: [
      { title: "Support", url: "#", icon: LifeBuoy },
      { title: "Feedback", url: "#", icon: Send },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Header — slightly shorter, cleaner padding so logo doesn't feel
          like it's floating in a tall void. */}
      <SidebarHeader className="h-16 border-b border-sidebar-border px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="/dashboard">
              <div className="flex items-center h-full px-1">
                <img
                  src="/Ecole2.png"
                  alt="Ecole"
                  width={160}
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
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
