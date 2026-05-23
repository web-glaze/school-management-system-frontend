"use client";

import { Bell, Search } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [search, setSearch] = useState("");

  return (
    <div className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

        <p className="text-sm text-gray-500 mt-1">Welcome back, Admin</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        
        {/* Notification */}
        <div className="relative group">
          <button className="relative w-14 h-14 rounded-2xl bg-[#f5f7fb] flex items-center justify-center hover:bg-blue-50 transition">
            <Bell size={22} className="text-gray-600" />

            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 top-16 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-50">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Notifications</h2>

              <span className="text-sm text-blue-600 font-medium cursor-pointer">
                Mark all read
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl hover:bg-gray-200 transition cursor-pointer border">
                <p className="font-semibold text-gray-800">
                  New Complaint Raised
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  AC Repair • Block A
                </p>
              </div>

              <div className="p-4 rounded-2xl hover:bg-gray-200 transition cursor-pointer border">
                <p className="font-semibold text-gray-800">
                  Complaint Resolved
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Water Leakage Fixed
                </p>
              </div>

              <div className="p-4 rounded-2xl hover:bg-gray-200 transition cursor-pointer border">
                <p className="font-semibold text-gray-800">
                  Technician Assigned
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  WiFi Issue • Library
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-4 bg-[#f5f7fb] px-4 py-3 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
            A
          </div>

          <div className="hidden md:block">
            <p className="font-semibold text-gray-800">Admin</p>

            <p className="text-sm text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
