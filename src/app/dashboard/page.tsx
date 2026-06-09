"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { useComplaintStore, useDepartmentStore, useTechnicianStore } from "@/store/maintenanceStore";
import Link from "next/link";
import {
  Ticket, Clock, Activity, CheckCircle2, XCircle,
  ArrowRight, Hammer, MapPin, VectorSquare, UserCog,
  Plus, AlertCircle, Users, GraduationCap, ShoppingCart,
  Car, Wrench, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api";
import { toast } from "sonner";

interface StoredUser { name?: string; email: string; role: string; }

const STATUS_CFG: Record<string, { label: string; badgeClass: string }> = {
  PENDING:     { label: "Pending",     badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  ASSIGNED:    { label: "Assigned",    badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" },
  RESOLVED:    { label: "Resolved",    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CLOSED:      { label: "Closed",      badgeClass: "bg-slate-50 text-slate-600 border-slate-200" },
};

export default function DashboardPage() {
  const { complaints, loading: cLoading, fetchComplaints } = useComplaintStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { technicians, fetchTechnicians } = useTechnicianStore();
  const [user, setUser]           = useState<StoredUser | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      const r = (u.role || "").toLowerCase();
      if (r === "admin" || r === "superadmin") {
        fetchDepartments();
        fetchTechnicians();
        setUsersLoading(true);
        apiClient.get("/users")
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

  const total      = complaints.length;
  const pending    = complaints.filter((c) => c.status === "PENDING").length;
  const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolved   = complaints.filter((c) => c.status === "RESOLVED").length;
  const closed     = complaints.filter((c) => c.status === "CLOSED").length;
  const activeRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;

  const recent = [...complaints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const role    = (user?.role ?? "user").toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";

  const quickLinks = isAdmin
    ? [
        { title: "Create Ticket", href: "/maintenance/tickets/create", icon: Plus,         desc: "Raise a new request" },
        { title: "All Tickets",   href: "/maintenance/tickets",        icon: Ticket,       desc: "View & manage tickets" },
        { title: "Technicians",   href: "/maintenance/technician",     icon: Hammer,       desc: "Manage assignments" },
        { title: "Departments",   href: "/maintenance/departments",    icon: VectorSquare, desc: "Manage departments" },
        { title: "Locations",     href: "/maintenance/location",       icon: MapPin,       desc: "Campus locations" },
        { title: "Users",         href: "/maintenance/user",           icon: UserCog,      desc: "User accounts" },
      ]
    : [
        { title: "Create Ticket",  href: "/maintenance/tickets/create", icon: Plus,        desc: "Raise a new request" },
        { title: "All Tickets",    href: "/maintenance/tickets",        icon: Ticket,      desc: "View all tickets" },
        { title: "My Complaints",  href: "/maintenance/my-complaints",  icon: AlertCircle, desc: "Track your complaints" },
      ];

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Maintenance Overview ── */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm" >
          {/* Header */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-primary/8">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="size-3.5 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">Maintenance Overview</span>
            </div>
            <Link href="/maintenance/tickets">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold gap-1 hover:bg-primary/8">
                View Tickets <ChevronRight className="size-3" />
              </Button>
            </Link>
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-0 divide-x divide-primary/8">
            {/* Total */}
            <div className="sm:col-span-1 p-5 flex flex-col items-center justify-center gap-1.5 bg-white">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-1">
                <Ticket className="size-6 text-primary" />
              </div>
              <p className="text-4xl font-black text-primary leading-none">
                {cLoading ? <span className="inline-block w-10 h-9 rounded-lg bg-muted animate-pulse" /> : total}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
            </div>

            {/* 4 status tiles */}
            {[
              { label: "Pending",     value: pending,    icon: Clock,        num: "text-amber-500"   },
              { label: "In Progress", value: inProgress, icon: Activity,     num: "text-sky-500"     },
              { label: "Resolved",    value: resolved,   icon: CheckCircle2, num: "text-emerald-500" },
              { label: "Closed",      value: closed,     icon: XCircle,      num: "text-slate-400"   },
            ].map((s) => {
              const Icon = s.icon;
              const pct  = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.label} className="sm:col-span-1 p-5 flex flex-col gap-2 bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                    <Icon className={cn("size-3.5", s.num)} />
                  </div>
                  <p className={cn("text-4xl font-black leading-none mt-1", s.num)}>
                    {cLoading ? <span className="inline-block w-8 h-8 rounded bg-muted animate-pulse" /> : s.value}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground mt-auto">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── System Overview (admin only) ── */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ">
            {[
              { label: "Total Users",  value: totalUsers,         loading: usersLoading, icon: Users,        color: "text-violet-600 bg-violet-50 border-violet-200", num: "text-violet-600" },
              { label: "Departments",  value: departments.length, loading: false,        icon: VectorSquare, color: "text-sky-600 bg-sky-50 border-sky-200",         num: "text-sky-600" },
              { label: "Technicians",  value: technicians.length, loading: false,        icon: Hammer,       color: "text-amber-600 bg-amber-50 border-amber-200",   num: "text-amber-600" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-card rounded-xl shadow-sm p-4 md:p-5 flex items-center gap-4">
                  <div className={cn("size-12 rounded-xl border-2 flex items-center justify-center shrink-0", s.color)}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                    <p className={cn("text-3xl font-extrabold leading-none mt-1", s.num)}>
                      {s.loading || s.value === null
                        ? <span className="inline-block w-10 h-8 rounded bg-muted animate-pulse" />
                        : s.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Quick Access + Recent Tickets ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.title} href={link.href}
                    className="group flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="size-4 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/60 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Tickets</h2>
              <Link href="/maintenance/tickets">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold gap-1 hover:bg-primary/8">
                  View all <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>
            {cLoading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex gap-3 items-center py-2.5 border-b border-border/30">
                    <div className="h-4 bg-muted rounded flex-1 animate-pulse" />
                    <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <Ticket className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No tickets yet</p>
                <Link href="/maintenance/tickets/create">
                  <Button size="sm" className="mt-3" variant="outline">Create first ticket</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/40">
                {recent.map((c) => {
                  const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.PENDING;
                  return (
                    <Link key={c.id} href={`/maintenance/tickets/${c.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-muted/30 -mx-1 px-1 rounded transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate leading-tight">
                          {c.title || c.description?.slice(0, 40)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.ticketCode} · {c.locationType}</p>
                      </div>
                      <Badge variant="outline" className={cn("shrink-0 text-[10px] font-bold rounded-full border px-2 py-0.5", cfg.badgeClass)}>
                        {cfg.label}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Modules / Phases ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-foreground">ERP Modules</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your school management platform modules</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Gate Pass - Coming Soon */}
            <button onClick={() => toast.info("Gate Pass — Coming Soon", { description: "This module is under development." })}
              className="group text-left relative bg-card rounded-xl border border-dashed border-border/50 p-4 hover:border-primary/25 hover:bg-muted/30 transition-all duration-200 overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Car className="size-4.5 text-slate-500" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full mt-0.5">Soon</span>
              </div>
              <p className="text-sm font-bold text-foreground">Gate Pass</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Visitor passes &amp; entry logs</p>
            </button>

            {/* Maintenance - Active */}
            <Link href="/maintenance/tickets"
              className="group relative bg-gradient-to-br from-primary/[0.07] via-primary/[0.04] to-transparent rounded-xl border border-primary/25 p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <Wrench className="size-4.5 text-primary" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-0.5">Active</span>
              </div>
              <p className="text-sm font-bold text-foreground relative z-10">Maintenance</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed relative z-10">Tickets &amp; technicians</p>
              <div className="mt-3 flex items-center gap-1 text-primary text-xs font-bold relative z-10">
                Open module <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Academics - Coming Soon */}
            <button onClick={() => toast.info("Academics — Coming Soon", { description: "This module is under development." })}
              className="group text-left relative bg-card rounded-xl border border-dashed border-border/50 p-4 hover:border-primary/25 hover:bg-muted/30 transition-all duration-200 overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <GraduationCap className="size-4.5 text-slate-500" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full mt-0.5">Soon</span>
              </div>
              <p className="text-sm font-bold text-foreground">Academics</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Student records &amp; attendance</p>
            </button>

            {/* Tuck Shop - Coming Soon */}
            <button onClick={() => toast.info("Tuck Shop / Inventory & POS — Coming Soon", { description: "This module is under development." })}
              className="group text-left relative bg-card rounded-xl border border-dashed border-border/50 p-4 hover:border-primary/25 hover:bg-muted/30 transition-all duration-200 overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <ShoppingCart className="size-4.5 text-slate-500" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full mt-0.5">Soon</span>
              </div>
              <p className="text-sm font-bold text-foreground">Tuck Shop / POS</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Inventory &amp; point of sale</p>
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
