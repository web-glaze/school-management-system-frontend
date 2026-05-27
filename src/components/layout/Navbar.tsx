"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

interface NavbarProps {
  role: "superadmin" | "admin" | "manager" | "technician" | "user";
}

interface Notification {
  title: string;
  message: string;
}

/** Page title derived from URL path. */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/admin": "Admin Home",
  "/admin/complaints": "Complaints",
  "/admin/users": "Users & Roles",
  "/admin/roles": "Roles & Permissions",
  "/admin/departments": "Departments",
  "/admin/technicians": "Technicians",
  "/admin/locations": "Locations",
  "/manager": "Manager Home",
  "/technician": "My Tasks",
  "/raise-ticket": "Raise Ticket",
  "/my-complaints": "My Complaints",
};

export default function Navbar({ role }: NavbarProps) {
  const pathname = usePathname();
  // Source of truth: Zustand store
  const user = useAuthStore((s) => s.user);
  const userName = user?.email ?? "User";

  const [notifications] = useState<Notification[]>([
    { title: "New Complaint Raised", message: "AC Repair · Block A" },
    { title: "Complaint Resolved", message: "Water Leakage Fixed" },
    { title: "Technician Assigned", message: "WiFi Issue · Library" },
  ]);

  const title = useMemo(() => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    // Try base path match
    const base = "/" + (pathname.split("/")[1] ?? "");
    return PAGE_TITLES[base] ?? "Dashboard";
  }, [pathname]);

  if (!user) return null;

  return (
    <div className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
      {/* Left — page title */}
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 truncate">
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 truncate">
          Welcome back, {userName}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search (decorative for now) */}
        <button
          className="hidden md:flex w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 items-center justify-center text-gray-500 transition"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notification */}
        <div className="relative group">
          <button
            className="relative w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-soft-lg border border-gray-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-50 origin-top-right">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">
                Notifications
              </h2>
              <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:text-blue-700">
                Mark all read
              </span>
            </div>
            <div className="space-y-1">
              {notifications.map((n, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User chip */}
        <div className="flex items-center gap-3 bg-gray-50 pl-1 pr-4 py-1 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
              {userName}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              {role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
