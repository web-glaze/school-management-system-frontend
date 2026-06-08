"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";

export default function MaintenancePage() {
  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = (user?.role || "user").toLowerCase();

  const userCards = [
    {
      title: "Raise Ticket",
      description: "Register a new maintenance complaint quickly.",
      href: "/maintenance/tickets/create",
    },
    {
      title: "My Complaints",
      description: "Track status and progress of your complaints.",
      href: "/maintenance/my-complaints",
    },
  ];

  const managerCards = [
    {
      title: "All Tickets",
      description: "Assign technicians and manage complaint workflow.",
      href: "/maintenance/tickets",
    },
    {
      title: "Technicians",
      description: "View and manage maintenance technicians.",
      href: "/maintenance/technician",
    },
    {
      title: "Raise Ticket",
      description: "Register complaints on behalf of departments.",
      href: "/maintenance/tickets/create",
    },
    {
      title: "My Complaints",
      description: "Track status and progress of your complaints.",
      href: "/maintenance/my-complaints",
    },
    {
      title: "Locations",
      description: "Create buildings, blocks, labs and campus locations.",
      href: "/maintenance/location",
    },
  ];

  const adminCards = [
    {
      title: "All Tickets",
      description: "Manage all maintenance tickets system-wide.",
      href: "/maintenance/tickets",
    },
    {
      title: "Technicians",
      description: "Add and manage technicians and assignments.",
      href: "/maintenance/technician",
    },
    {
      title: "Raise Ticket",
      description: "Create and manage maintenance requests.",
      href: "/maintenance/tickets/create",
    },
    {
      title: "My Complaints",
      description: "Track your personal maintenance requests.",
      href: "/maintenance/my-complaints",
    },
    {
      title: "Users",
      description: "Create and manage ERP IDs, roles and passwords.",
      href: "/maintenance/user",
    },
    {
      title: "Locations",
      description: "Create buildings, blocks, labs and campus locations.",
      href: "/maintenance/location",
    },
    {
      title: "Departments",
      description: "Manage electrician, carpenter, plumbing and IT departments.",
      href: "/maintenance/departments",
    },
    {
      title: "Roles and Permissions",
      description: "Configure role-based access for all system users.",
      href: "/maintenance/roles",
    },
  ];

  let cards = userCards;
  if (role === "manager") cards = managerCards;
  if (role === "admin" || role === "superadmin") cards = adminCards;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Hero banner */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="uppercase tracking-widest text-xs text-white/70 font-bold">
              ECOLE ERP
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">
              Maintenance Dashboard
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl text-sm leading-relaxed">
              Centralized maintenance management for complaints, technician
              assignments, tracking and workflow control.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold capitalize">
                Logged in as {role}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-5 shadow-sm/60 shadow-sm">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Module Status
            </p>
            <h2 className="text-3xl font-bold mt-2 text-emerald-600">Active</h2>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-sm/60 shadow-sm">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Role Access
            </p>
            <h2 className="text-3xl font-bold mt-2 text-primary capitalize">
              {role}
            </h2>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-sm/60 shadow-sm">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Available Actions
            </p>
            <h2 className="text-3xl font-bold mt-2 text-foreground">
              {cards.length}
            </h2>
          </div>
        </div>

        {/* Action cards */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground">
              Maintenance Controls
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Access operations based on your role permissions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-card rounded-xl p-5 shadow-sm/60 hover:border-primary/40 hover:shadow-md transition-all duration-200 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
                <div className="relative z-10">
                  <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {card.title.charAt(0)}
                  </div>
                  <h3 className="text-sm font-bold text-foreground mt-4">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                    {card.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-primary text-xs font-semibold">
                    Open Module
                    <span className="group-hover:translate-x-1 transition-transform inline-block">
                      {">"}
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
