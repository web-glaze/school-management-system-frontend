"use client";

import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface User {
  email: string;

  role: "superadmin" | "admin" | "manager" | "user";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      window.location.href = "/login";

      return;
    }

    queueMicrotask(() => {
      setUser(JSON.parse(storedUser));
    });
  }, []);

  if (!user) return null;

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />

      <SidebarInset className="bg-[#f5f7fb]">
        {/* Topbar */}
        <div
          className="
          sticky
          top-0
          z-40
          flex
          h-16
          items-center
          gap-4
          border-b
          bg-white/80
          backdrop-blur-md
          px-6
        "
        >
          <SidebarTrigger />

          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-gray-800">ECOLE ERP</h1>

            <p className="text-xs text-gray-500 capitalize">
              {user.role} panel
            </p>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-8 min-h-screen">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
