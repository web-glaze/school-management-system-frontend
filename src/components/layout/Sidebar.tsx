"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { useComplaintsStore } from "@/store/complaints-store";
import {
  LayoutDashboard,
  ShieldCheck,
  Target,
  Wrench,
  ClipboardList,
  PencilLine,
  Folder,
  Users,
  KeyRound,
  Building2,
  HardHat,
  MapPin,
  LogOut,
} from "lucide-react";

type Role =
  | "superadmin"
  | "admin"
  | "manager"
  | "technician"
  | "user";

interface SidebarProps {
  role: Role;
}

interface MenuItem {
  name: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** Required permission to show this item (when used in Setup section). */
  permission?: string;
}

interface MenuGroup {
  label?: string;
  items: MenuItem[];
}

/**
 * Build the menu based on the user's role.
 * The "Home" entry is ROLE-SPECIFIC — exactly one per role, no duplicates.
 * Maintenance + Setup sections use permissions for fine-grained control.
 */
function buildMenu(role: Role, permissions: string[]): MenuGroup[] {
  // ── Pick the ONE home page for this role ─────────────────
  let home: MenuItem;
  if (role === "superadmin" || role === "admin") {
    home = { name: "Admin Home", href: "/admin", Icon: ShieldCheck };
  } else if (role === "manager") {
    home = { name: "Manager Home", href: "/manager", Icon: Target };
  } else if (role === "technician") {
    home = { name: "My Tasks", href: "/technician", Icon: Wrench };
  } else {
    home = { name: "Dashboard", href: "/dashboard", Icon: LayoutDashboard };
  }

  // Maintenance — visible based on permissions
  const maintenanceItems: MenuItem[] = [];
  if (permissions.includes("ticket.read")) {
    maintenanceItems.push({
      name: "Complaints",
      href: "/admin/complaints",
      Icon: ClipboardList,
    });
  }
  if (permissions.includes("ticket.create")) {
    maintenanceItems.push({
      name: "Raise Ticket",
      href: "/raise-ticket",
      Icon: PencilLine,
    });
  }
  // "My Complaints" is always visible — every authenticated user can see their own
  maintenanceItems.push({
    name: "My Complaints",
    href: "/my-complaints",
    Icon: Folder,
  });

  // Setup & Access — admin tools, permission-gated
  const setupItems: MenuItem[] = [];
  if (permissions.includes("user.read")) {
    setupItems.push({ name: "Users", href: "/admin/users", Icon: Users });
  }
  if (permissions.includes("role.manage")) {
    setupItems.push({
      name: "Roles & Permissions",
      href: "/admin/roles",
      Icon: KeyRound,
    });
  }
  if (permissions.includes("asset.manage")) {
    setupItems.push({
      name: "Departments",
      href: "/admin/departments",
      Icon: Building2,
    });
  }
  if (permissions.includes("ticket.read")) {
    setupItems.push({
      name: "Technicians",
      href: "/admin/technicians",
      Icon: HardHat,
    });
  }
  if (permissions.includes("asset.manage")) {
    setupItems.push({
      name: "Locations",
      href: "/admin/locations",
      Icon: MapPin,
    });
  }

  const groups: MenuGroup[] = [
    { label: "Overview", items: [home] },
  ];
  if (maintenanceItems.length > 0) {
    groups.push({ label: "Maintenance", items: maintenanceItems });
  }
  if (setupItems.length > 0) {
    groups.push({ label: "Setup & Access", items: setupItems });
  }
  return groups;
}

const ROLE_COLORS: Record<Role, { bg: string; label: string }> = {
  superadmin: { bg: "from-pink-500 to-orange-400", label: "Super Admin" },
  admin: { bg: "from-rose-500 to-red-500", label: "Admin" },
  manager: { bg: "from-violet-500 to-fuchsia-500", label: "Manager" },
  technician: { bg: "from-emerald-500 to-cyan-500", label: "Technician" },
  user: { bg: "from-slate-500 to-slate-700", label: "User" },
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  // Source of truth: Zustand auth store
  const user = useAuthStore((s) => s.user);
  const storeLogout = useAuthStore((s) => s.logout);
  const resetComplaints = useComplaintsStore((s) => s.reset);

  const permissions = user?.permissions ?? [];
  const email = user?.email ?? "";

  const handleLogout = () => {
    storeLogout();
    resetComplaints();
    toast.success("Logged out");
    window.location.href = "/login";
  };

  const menu = buildMenu(role, permissions);
  const roleStyle = ROLE_COLORS[role] ?? ROLE_COLORS.user;
  const initial = email ? email.charAt(0).toUpperCase() : "?";

  return (
    <div className="w-72 h-screen bg-white border-r border-gray-100 flex flex-col shadow-soft overflow-hidden">
      {/* Brand — uses the real ECOLE logo */}
      <div className="p-5 pb-4 border-b border-gray-50">
        <Link
          href={menu[0].items[0].href}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 shadow-soft flex items-center justify-center overflow-hidden group-hover:shadow-soft-lg transition-shadow">
              <Image
                src="/Ecole3.png"
                alt="ECOLE"
                width={48}
                height={48}
                className="object-contain w-full h-full p-1"
                priority
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900 leading-tight">
              Ecole Globale
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
              School ERP
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
        {menu.map((group, idx) => (
          <div key={idx}>
            {group.label && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2 px-3">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    item.href !== "/manager" &&
                    item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-50 to-violet-50/40 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-r-full shadow-lg shadow-indigo-500/40" />
                    )}
                    <item.Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive
                          ? "text-indigo-600"
                          : "text-gray-400 group-hover:text-gray-700"
                      }`}
                      strokeWidth={2}
                    />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dot-glow text-indigo-500" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User card + logout */}
      <div className="border-t border-gray-50 p-4 space-y-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-white">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleStyle.bg} flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white`}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {email || "User"}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {roleStyle.label}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50/50 hover:bg-red-50 text-red-600 border border-red-100 hover:border-red-200 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm group"
        >
          <LogOut
            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
            strokeWidth={2.5}
          />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
