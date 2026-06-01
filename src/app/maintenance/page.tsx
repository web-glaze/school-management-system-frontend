"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import Link from "next/link";
import { AccessKey, canAccess, normaliseRole, Role } from "@/lib/rbac";

/**
 * Master list of dashboard cards. Each card declares the AccessKey it
 * belongs to so the page filters by canAccess(role, key) — same RBAC
 * source as the sidebar and the page guards. Add a card here once and
 * every role that has access automatically sees it.
 */
const ALL_CARDS: Array<{
  title: string;
  description: string;
  href: string;
  access: AccessKey;
}> = [
  {
    title: "Raise Ticket",
    description: "Register a new complaint quickly.",
    href: "/maintenance/tickets/create",
    access: "tickets.create",
  },
  {
    title: "Assigned to Me",
    description: "Open tickets a manager assigned to you. Update status here.",
    href: "/maintenance/assigned",
    access: "assigned-tickets",
  },
  {
    title: "My Complaints",
    description: "Track status and progress of your complaints.",
    href: "/maintenance/my-complaints",
    access: "my-complaints",
  },
  {
    title: "Complaint Management",
    description: "Assign technicians and manage complaint workflow.",
    href: "/maintenance/tickets",
    access: "tickets.list",
  },
  {
    title: "Technician Management",
    description: "Add and manage technicians and assignments.",
    href: "/maintenance/technician",
    access: "technicians",
  },
  {
    title: "Location Management",
    description: "Create buildings, blocks, labs and nested campus locations.",
    href: "/maintenance/location",
    access: "locations",
  },
  {
    title: "Department Management",
    description:
      "Manage electrician, carpenter, plumbing and maintenance departments.",
    href: "/maintenance/departments",
    access: "departments",
  },
  {
    title: "User Management",
    description: "Create and manage ERP IDs, roles and passwords.",
    href: "/maintenance/user",
    access: "users",
  },
  {
    title: "Roles & Permissions",
    description: "Decide which role can access which pages and actions.",
    href: "/maintenance/roles",
    access: "roles",
  },
];

export default function MaintenancePage() {
  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;

  const user = storedUser ? JSON.parse(storedUser) : null;
  const role: Role = normaliseRole(user?.role);

  const cards = ALL_CARDS.filter((c) => canAccess(role, c.access));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.25em] text-[11px] text-white/80">
              ECOLE ERP
            </p>

            <h1 className="text-2xl font-bold mt-2">Maintenance Dashboard</h1>

            <p className="mt-2 text-sm text-white/90 max-w-3xl">
              Centralized maintenance management system for complaints,
              technician assignments, tracking and workflow control.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium capitalize">
                Logged in as {role}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Module Status
            </p>
            <h2 className="text-xl font-bold mt-2 text-green-600">Active</h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Role Access
            </p>
            <h2 className="text-xl font-bold mt-2 text-blue-600 capitalize">
              {role}
            </h2>
          </div>

          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Available Actions
            </p>
            <h2 className="text-xl font-bold mt-2 text-cyan-500">
              {cards.length}
            </h2>
          </div>
        </div>

        {/* Action Cards */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Maintenance Controls
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Access maintenance operations based on your role permissions.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 hover:border-blue-200 hover:shadow-2xl transition duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-300" />

                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-base font-bold shadow-md">
                    {card.title.charAt(0)}
                  </div>

                  <h3 className="text-base font-bold text-gray-800 mt-4">
                    {card.title}
                  </h3>

                  <p className="text-gray-500 mt-1.5 text-xs leading-relaxed">
                    {card.description}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 text-blue-600 text-xs font-semibold">
                    Open Module
                    <span className="group-hover:translate-x-1 transition">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
