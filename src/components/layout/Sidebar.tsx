"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface SidebarProps {
  role:
    | "superadmin"
    | "admin"
    | "manager"
    | "technician"
    | "user";
}

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  /**
   * Required permission to show this item.
   * If undefined, item is visible to anyone logged in.
   * Special string "*" means superadmin only.
   */
  permission?: string;
}

interface MenuGroup {
  label?: string;
  items: MenuItem[];
}

const MENU: MenuGroup[] = [
  {
    label: "Maintenance",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "🏠" },
      { name: "Admin Home", href: "/admin", icon: "🛡️", permission: "user.read" },
      { name: "Manager Home", href: "/manager", icon: "🎯", permission: "ticket.assign" },
      { name: "My Tasks", href: "/technician", icon: "🛠️", permission: "ticket.resolve" },
      { name: "Complaints", href: "/admin/complaints", icon: "📋", permission: "ticket.read" },
      { name: "Raise Ticket", href: "/raise-ticket", icon: "✍️", permission: "ticket.create" },
      { name: "My Complaints", href: "/my-complaints", icon: "📂" },
    ],
  },
  {
    label: "Setup",
    items: [
      { name: "Users & Roles", href: "/admin/users", icon: "👥", permission: "user.read" },
      { name: "Roles & Permissions", href: "/admin/roles", icon: "🔐", permission: "role.manage" },
      { name: "Departments", href: "/admin/departments", icon: "🏛️", permission: "asset.manage" },
      { name: "Technicians", href: "/admin/technicians", icon: "🔧", permission: "ticket.read" },
      { name: "Locations", href: "/admin/locations", icon: "📍", permission: "asset.manage" },
    ],
  },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        setPermissions(u.permissions ?? []);
      }
    } catch {
      setPermissions([]);
    }
  }, []);

  const canSee = (item: MenuItem): boolean => {
    if (!item.permission) return true;
    if (item.permission === "*") return role === "superadmin";
    return permissions.includes(item.permission);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out");
    window.location.href = "/login";
  };

  return (
    <div className="w-72 min-h-screen bg-white border-r border-gray-200 flex flex-col justify-between p-6 shadow-sm overflow-y-auto">
      {/* Top */}
      <div>
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              E
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ECOLE</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {role === "superadmin" ? "Super Admin" : `${role} Panel`}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation grouped */}
        <div className="space-y-6">
          {MENU.map((group, idx) => {
            const visibleItems = group.items.filter(canSee);
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx}>
                {group.label && (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                    {group.label}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {visibleItems.map((item) => {
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-cyan-400 text-white shadow-md"
                            : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="mt-8">
        <button
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-3 rounded-2xl font-semibold transition duration-200 text-sm"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
