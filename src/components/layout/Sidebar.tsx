"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
    },
    {
      name: "Complaints",
      href: "/complaints",
    },
    {
      name: "Technicians",
      href: "/technician",
    },
    {
      name: "Managers",
      href: "/manager",
    },
    {
      name: "Users",
      href: "/user",
    },
    {
      name: "Admin",
      href: "/admin",
    },
  ];

  return (
    <div className="w-72 min-h-screen bg-white border-r border-gray-200 flex flex-col justify-between p-6 shadow-sm">
      {/* Top */}
      <div>
        {/* Logo */}
        <div className="mb-14">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              E
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-800">ECOLE</h1>

              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`p-4 rounded-2xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-400 text-white shadow-lg"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
      {/* Logout */}
      <div className="mt-10">
        <button
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-4 rounded-2xl font-semibold transition duration-200"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
