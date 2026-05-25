"use client";

import { useEffect, useState } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

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

    if (storedUser) {
      queueMicrotask(() => {
        setUser(JSON.parse(storedUser));
      });
    }
  }, []);

  if (!user) return null;

  return (
    <div className="flex bg-[#f5f7fb]">
      <div className="fixed left-0 top-0 h-screen w-72 z-50">
        <Sidebar role={user.role} />
      </div>

      <div className="flex-1 ml-72">
        <Navbar role={user.role} />

        <main className="p-8 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
