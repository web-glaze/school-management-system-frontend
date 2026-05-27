"use client";

import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";

interface NavbarProps {
  role: "superadmin" | "admin" | "manager" | "technician" | "user";
}

interface Notification {
  title: string;
  message: string;
}

export default function Navbar({ role }: NavbarProps) {
  const user = useAuthStore((s) => s.user);
  const userName = user?.email ?? "User";

  const [notifications] = useState<Notification[]>([
    { title: "New Complaint Raised", message: "AC Repair · Block A" },
    { title: "Complaint Resolved", message: "Water Leakage Fixed" },
    { title: "Technician Assigned", message: "WiFi Issue · Library" },
  ]);

  if (!user) return null;

  return (
    <div className="h-14 sm:h-16 bg-white/70 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
      {/* Left — just welcome message; each page has its own header */}
      <div className="min-w-0 ml-14 lg:ml-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-500 truncate">
          Welcome back,{" "}
          <span className="font-semibold text-gray-800">{userName}</span>
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Search — hidden on mobile */}
        <button
          className="hidden md:flex w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 items-center justify-center text-gray-500 transition"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notification */}
        <div className="relative group">
          <button
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-11 sm:top-12 w-72 sm:w-80 bg-white rounded-2xl shadow-soft-lg border border-gray-100 p-3 sm:p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-50 origin-top-right">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">
                Notifications
              </h2>
              <span className="text-xs text-indigo-600 font-semibold cursor-pointer hover:text-indigo-700">
                Mark all read
              </span>
            </div>
            <div className="space-y-1">
              {notifications.map((n, i) => (
                <div
                  key={i}
                  className="p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                >
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    {n.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User chip — avatar only on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 pl-1 pr-1 sm:pr-4 py-1 rounded-xl sm:rounded-2xl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:block min-w-0">
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
