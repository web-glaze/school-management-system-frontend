"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface NavbarProps {
  role: "superadmin" | "admin" | "manager" | "user";
}

interface Notification {
  title: string;
  message: string;
}

export default function Navbar({ role }: NavbarProps) {
  const [userName, setUserName] = useState("User");

  const [mounted, setMounted] = useState(false);

  const [notifications] = useState<Notification[]>([
    {
      title: "New Complaint Raised",
      message: "AC Repair • Block A",
    },
    {
      title: "Complaint Resolved",
      message: "Water Leakage Fixed",
    },
    {
      title: "Technician Assigned",
      message: "WiFi Issue • Library",
    },
  ]);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      queueMicrotask(() => {
        setUserName(user.email || "User");
      });
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

        <p className="text-sm text-gray-500 mt-1">Welcome back, {userName}</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        {/* User */}
        <div className="flex items-center gap-4 bg-[#f5f7fb] px-4 py-3 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="hidden md:block">
            <p className="font-semibold text-gray-800">{userName}</p>

            <p className="text-sm text-gray-500 capitalize">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
