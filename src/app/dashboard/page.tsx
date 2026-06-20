"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { useComplaintStore, useDepartmentStore, useTechnicianStore } from "@/store/maintenanceStore";
import Link from "next/link";
import { Ticket, Clock, Activity, CheckCircle2, XCircle, ArrowRight, Hammer, MapPin, VectorSquare, Plus, Users, GraduationCap, ShoppingCart, Car, Wrench, ChevronRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api";
import { toast } from "sonner";

interface StoredUser {
  name?: string;
  email: string;
  role: string;
  permissions?: string[];
}

const STATUS_CFG: Record<string, { label: string; badgeClass: string }> = {
  PENDING: { label: "Pending", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  ASSIGNED: { label: "Assigned", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" },
  RESOLVED: { label: "Resolved", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CLOSED: { label: "Closed", badgeClass: "bg-slate-50 text-slate-600 border-slate-200" },
};

export default function DashboardPage() {
  const { complaints, loading: cLoading, fetchComplaints } = useComplaintStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { technicians, fetchTechnicians } = useTechnicianStore();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored) as StoredUser;
      setUser(u);
      const r = (u.role || "").toLowerCase();
      const perms = u.permissions || [];

      if (perms.includes("department.read")) {
        fetchDepartments();
      }
      if (perms.includes("technician.read")) {
        fetchTechnicians();
      }

      if (r === "admin" || r === "superadmin") {
        setUsersLoading(true);
        apiClient
          .get("/users")
          .then((res) => {
            const d = res.data?.data ?? res.data ?? [];
            setTotalUsers(Array.isArray(d) ? d.length : 0);
          })
          .catch(() => setTotalUsers(0))
          .finally(() => setUsersLoading(false));
      }
    }
    fetchComplaints();
  }, []);

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "PENDING").length;
  const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
  const closed = complaints.filter((c) => c.status === "CLOSED").length;
  const activeRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;

  const recent = [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const role = (user?.role ?? "user").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";
  const isManager = role === "manager";

  // Role-based stats checking permissions
  const hasUsersRead = role === "admin" || role === "superadmin";
  const hasDeptsRead = user?.permissions?.includes("department.read") || isAdmin;
  const hasTechsRead = user?.permissions?.includes("technician.read") || isAdmin;
  const showSecondaryStats = hasUsersRead || hasDeptsRead || hasTechsRead;

  let quickLinks = [{ title: "Create Ticket", href: "/maintenance/tickets/create", icon: Plus, desc: "Raise a new request" }];

  if (isAdmin) {
    quickLinks = [
      { title: "Create Ticket", href: "/maintenance/tickets/create", icon: Plus, desc: "Raise a new request" },
      { title: "All Tickets", href: "/maintenance/tickets", icon: Ticket, desc: "View & manage tickets" },
      { title: "Technicians", href: "/maintenance/technician", icon: Hammer, desc: "Manage assignments" },
      { title: "Departments", href: "/maintenance/departments", icon: VectorSquare, desc: "Manage departments" },
      { title: "Locations", href: "/maintenance/location", icon: MapPin, desc: "Campus locations" },
      { title: "Users", href: "/user", icon: Users, desc: "User accounts" },
    ];
  } else {
    quickLinks = [
      { title: "Create Ticket", href: "/maintenance/tickets/create", icon: Plus, desc: "Raise a new request" },
      { title: "All Tickets", href: "/maintenance/tickets", icon: Ticket, desc: "View & manage tickets" },
    ];
  }

  const statusStats = [
    {
      label: "Total Tickets",
      value: total,
      icon: ClipboardList,
      colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100",
      numClass: "text-indigo-600",
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock,
      colorClass: "text-amber-600 bg-amber-50 border-amber-100",
      numClass: "text-amber-600",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Activity,
      colorClass: "text-sky-600 bg-sky-50 border-sky-100",
      numClass: "text-sky-600",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: CheckCircle2,
      colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
      numClass: "text-emerald-600",
    },
    {
      label: "Closed",
      value: closed,
      icon: XCircle,
      colorClass: "text-slate-600 bg-slate-100 border-slate-200",
      numClass: "text-slate-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-sky-600">Welcome back, {user?.name || user?.email.split("@")[0]}!</h1>
            <p className="mt-1.5 text-base md:text-lg">Here is a summary of the school management and maintenance status.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-bold uppercase tracking-wider px-3 py-1 border shadow-sm ",
                role === "superadmin" && "border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400",
                role === "admin" && "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400",
                role === "manager" && "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400",
                role === "user" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
              )}
            >
              {role}
            </Badge>
          </div>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statusStats.map((stat) => {
            const Icon = stat.icon;
            const isTotal = stat.label === "Total Tickets";
            const pct = total > 0 ? Math.round((stat.value / total) * 100) : 0;
            return (
              <Card key={stat.label} className="group relative  bg-card rounded-md p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden">
                <CardContent className="p-0 flex flex-col justify-between h-full min-h-22.5">
                  <div className="flex justify-between items-start">
                    <p className="text-muted-foreground text-sm font-bold uppercase">{stat.label}</p>
                    <div className={cn("p-2 rounded-md border transition-transform duration-300 group-hover:scale-110 shrink-0", stat.colorClass)}>
                      <Icon className="size-4" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h2 className={cn("text-3xl font-extrabold tracking-tight leading-none", stat.numClass)}>{cLoading ? <span className="inline-block w-12 h-8 rounded bg-muted animate-pulse" /> : stat.value}</h2>
                    <p className="text-[11px] text-muted-foreground mt-2 font-medium">{isTotal ? <span>{activeRate}% resolution rate</span> : <span>{pct}% of total tickets</span>}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Access & Recent Tickets split section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Access Card */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="">Quick Access</CardTitle>
              <CardDescription className="">Access primary system management shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.title} href={link.href} className="group flex items-center gap-3 rounded-md border border-border/50 p-3 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
                      <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                        <Icon className="size-4 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{link.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{link.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tickets Card */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="">Recent Tickets</CardTitle>
                <CardDescription className="">Latest maintenance and support requests</CardDescription>
              </div>
              <Link href="/maintenance/tickets">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-primary font-bold gap-1 hover:bg-primary/8 px-3 rounded-md">
                  View all <ArrowRight className="size-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {cLoading ? (
                <div className="space-y-2 w-full">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 items-center py-2 border-b border-border/10 last:border-b-0">
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                      </div>
                      <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <Ticket className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-base text-muted-foreground font-semibold">No tickets found</p>
                  <Link href="/maintenance/tickets/create" className="mt-3">
                    <Button size="sm" className="text-xs" variant="outline">
                      Create first ticket
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/20 w-full">
                  {recent.map((c) => {
                    const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.PENDING;
                    return (
                      <Link key={c.id} href={`/maintenance/tickets/${c.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40 px-2 rounded-md transition-all duration-200 -mx-2">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-foreground truncate leading-snug hover:text-primary transition-colors">{c.title || c.description?.slice(0, 40)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                            {c.ticketCode} · {c.locationType}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("font-bold rounded-md border px-2.5 py-0.5", cfg.badgeClass)}>
                          {cfg.label}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ERP Modules grid section */}
        <div>
          <div className="mb-4">
            <p className="font-bold uppercase tracking-wider">ERP Modules</p>
            <p className="mt-0.5">Explore available school management platform modules</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Maintenance Module */}
            <Link href="/maintenance/tickets" className="block">
              <Card className="group border p-5 transition-all duration-200 relative overflow-hidden h-full">
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0 text-primary">
                    <Wrench className="size-5" />
                  </div>
                  <Badge variant="outline" className="text-[12px] font-bold uppercase tracking-widest text-white bg-primary border-primary/20 px-3 py-3">
                    Active
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-foreground relative z-10 group-hover:text-primary transition-colors">Maintenance</h3>
                <p className="text-muted-foreground leading-normal relative z-10">Department assignments, ticket tracking & resolution workflow</p>
                <div className="mt-4 flex items-center gap-1 text-primary text-base font-bold relative z-10">
                  Open module <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Card>
            </Link>
            {/* Gate Pass Module */}
            <Card
              onClick={() => toast.info("Gate Pass — Coming Soon", { description: "This module is under development." })}
              className="group cursor-pointer border-2 border-dashed border-gray-300 ring-0 bg-transparent p-5 transition-all duration-200 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center transition-colors shrink-0">
                  <Car className="size-5" />
                </div>
                <Badge variant="outline" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground bg-muted border-border/40 px-3 py-3">
                  Soon
                </Badge>
              </div>
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Gate Pass</h3>
              <p className="text-muted-foreground leading-normal">Visitor tracking, passes & entry/exit logs</p>
            </Card>

            {/* Academics Module */}
            <Card
              onClick={() => toast.info("Academics — Coming Soon", { description: "This module is under development." })}
              className="group cursor-pointer border-2 border-dashed border-gray-300 ring-0 bg-transparent p-5 transition-all duration-200 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center transition-colors shrink-0">
                  <GraduationCap className="size-5" />
                </div>
                <Badge variant="outline" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground bg-muted border-border/40 px-3 py-3">
                  Soon
                </Badge>
              </div>
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Academics</h3>
              <p className="text-muted-foreground leading-normal">Student databases, class rosters & attendance</p>
            </Card>

            {/* Tuck Shop / POS Module */}
            <Card
              onClick={() => toast.info("Tuck Shop / Inventory & POS — Coming Soon", { description: "This module is under development." })}
              className="group cursor-pointer border-2 border-dashed border-gray-300 ring-0 bg-transparent p-5 transition-all duration-200 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center transition-colors shrink-0">
                  <ShoppingCart className="size-5" />
                </div>
                <Badge variant="outline" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground bg-muted border-border/40 px-3 py-3">
                  Soon
                </Badge>
              </div>
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Tuck Shop / POS</h3>
              <p className="text-muted-foreground leading-normal">Inventory tracking, sales records & POS systems</p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}