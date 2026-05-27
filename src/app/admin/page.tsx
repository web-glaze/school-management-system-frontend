"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useComplaintsStore } from "@/store/complaints-store";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Activity,
  Users as UsersIcon,
  ClipboardList,
  HardHat,
  Building2,
  MapPin,
  Sparkles,
} from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  user?: { email: string };
  assignedTechnician?: { id: string; name: string } | null;
}

export default function AdminHomePage() {
  const { user, loading: authLoading } = useAuth({
    allowedRoles: ["admin", "superadmin"],
  });

  // ── Zustand store ──────────────────────────────────────
  const complaints = useComplaintsStore((s) => s.complaints) as Complaint[];
  const loading = useComplaintsStore((s) => s.loading);
  const fetchComplaints = useComplaintsStore((s) => s.fetchComplaints);

  useEffect(() => {
    if (!authLoading && user) fetchComplaints();
  }, [authLoading, user, fetchComplaints]);

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "PENDING").length,
      inProgress: complaints.filter(
        (c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED",
      ).length,
      resolved: complaints.filter(
        (c) => c.status === "RESOLVED" || c.status === "CLOSED",
      ).length,
      urgent: complaints.filter((c) => c.priority === "URGENT").length,
    };
  }, [complaints]);

  // Last 7 days mini chart data
  const last7Days = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split("T")[0];
      const count = complaints.filter((c) =>
        c.createdAt.startsWith(dayKey),
      ).length;
      days.push({
        day: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 1),
        count,
      });
    }
    return days;
  }, [complaints]);

  const maxDay = Math.max(1, ...last7Days.map((d) => d.count));
  const recent = useMemo(() => complaints.slice(0, 5), [complaints]);

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const completionRate = stats.total > 0
    ? Math.round((stats.resolved / stats.total) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ── Hero — ECOLE brand multicolor gradient ────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 p-10 text-white shadow-2xl">
          {/* Decorative blobs in ECOLE logo accent colors */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-400/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-400/25 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-48 h-48 bg-rose-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/3 w-56 h-56 bg-cyan-400/20 rounded-full blur-3xl" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dot-glow text-emerald-400" />
                  Live · {user.role === "superadmin" ? "Super Admin" : "Admin Panel"}
                </span>
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight">
                Good {greeting()}, Admin
              </h1>
              <p className="mt-3 text-lg text-white/70 max-w-xl">
                Here&apos;s what&apos;s happening across your school maintenance
                today.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/admin/complaints"
                className="group inline-flex items-center gap-2 bg-white text-indigo-900 px-5 py-3 rounded-2xl font-semibold hover:bg-indigo-50 transition-all shadow-lg shadow-black/10"
              >
                Manage Complaints
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/raise-ticket"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-5 py-3 rounded-2xl font-semibold hover:bg-white/15 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                New Ticket
              </Link>
            </div>
          </div>
        </section>

        {/* ── KPI cards — ECOLE accent palette ─────────────── */}
        <section className="grid xl:grid-cols-4 md:grid-cols-2 gap-5">
          <KpiCard
            label="Total Complaints"
            value={stats.total}
            icon={<ClipboardList className="w-5 h-5" />}
            accent="indigo"
            sparkline={last7Days.map((d) => d.count)}
            loading={loading}
          />
          <KpiCard
            label="Pending"
            value={stats.pending}
            icon={<Clock className="w-5 h-5" />}
            accent="gold"
            sparkline={last7Days.map((d) => d.count)}
            loading={loading}
            urgent={stats.urgent > 0 ? stats.urgent : undefined}
          />
          <KpiCard
            label="In Progress"
            value={stats.inProgress}
            icon={<Activity className="w-5 h-5" />}
            accent="orange"
            sparkline={last7Days.map((d) => d.count)}
            loading={loading}
          />
          <KpiCard
            label="Resolved"
            value={stats.resolved}
            icon={<CheckCircle2 className="w-5 h-5" />}
            accent="green"
            sparkline={last7Days.map((d) => d.count)}
            loading={loading}
            trend={completionRate}
          />
        </section>

        {/* ── Quick actions row ─────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickLink
              href="/admin/users"
              title="Users"
              desc="Manage accounts & roles"
              Icon={UsersIcon}
              tint="from-rose-500/10 to-pink-500/10"
              iconBg="from-rose-500 to-pink-500"
            />
            <QuickLink
              href="/admin/departments"
              title="Departments"
              desc="Maintenance teams"
              Icon={Building2}
              tint="from-purple-500/10 to-fuchsia-500/10"
              iconBg="from-purple-500 to-fuchsia-500"
            />
            <QuickLink
              href="/admin/technicians"
              title="Technicians"
              desc="Workforce setup"
              Icon={HardHat}
              tint="from-cyan-500/10 to-teal-500/10"
              iconBg="from-cyan-500 to-teal-500"
            />
            <QuickLink
              href="/admin/locations"
              title="Locations"
              desc="Building hierarchy"
              Icon={MapPin}
              tint="from-amber-500/10 to-orange-500/10"
              iconBg="from-amber-500 to-orange-500"
            />
          </div>
        </section>

        {/* ── Activity + completion ─────────────────────── */}
        <section className="grid lg:grid-cols-3 gap-6">
          {/* Recent activity */}
          <div className="lg:col-span-2 card-premium p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Complaints
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Latest 5 tickets across all locations
                </p>
              </div>
              <Link
                href="/admin/complaints"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                View all
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 skeleton bg-gray-100"
                  />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-50 items-center justify-center mb-4">
                  <ClipboardList className="w-7 h-7 text-blue-500" />
                </div>
                <p className="text-gray-500 font-medium">No complaints yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  When tickets are raised, they&apos;ll appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map((c) => (
                  <Link
                    key={c.id}
                    href="/admin/complaints"
                    className="group flex items-center gap-4 p-3.5 rounded-2xl hover:bg-gray-50 transition-all"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        c.priority === "URGENT"
                          ? "bg-red-500 dot-glow text-red-500"
                          : c.priority === "HIGH"
                            ? "bg-orange-500"
                            : c.priority === "MEDIUM"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {c.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {c.locationType} · {c.subLocation}
                        {c.user?.email && ` · ${c.user.email}`}
                      </p>
                    </div>
                    <StatusPill status={c.status} />
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right side: chart + summary */}
          <div className="space-y-6">
            {/* 7-day activity chart */}
            <div className="card-premium p-7">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-900">Last 7 Days</h3>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-gray-500 mb-5">
                New complaints per day
              </p>

              {loading ? (
                <div className="h-32 skeleton bg-gray-100" />
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {last7Days.map((d, i) => {
                    const heightPct = (d.count / maxDay) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400 transition-all duration-700 ease-out hover:from-indigo-700 hover:to-violet-500"
                            style={{
                              height: `${Math.max(heightPct, 3)}%`,
                              opacity: d.count > 0 ? 1 : 0.15,
                            }}
                            title={`${d.count} complaints`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400">
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completion rate */}
            <div className="card-premium p-7">
              <h3 className="font-bold text-gray-900 mb-1">
                Completion Rate
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Resolved vs total
              </p>
              <div className="relative pt-3">
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-extrabold text-brand-gradient">
                    {completionRate}
                  </span>
                  <span className="text-xl font-bold text-gray-400 mb-1">
                    %
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-orange-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between mt-3 text-xs">
                  <span className="text-emerald-600 font-semibold">
                    {stats.resolved} resolved
                  </span>
                  <span className="text-gray-500">{stats.total} total</span>
                </div>
              </div>
            </div>

            {/* Alert card if urgent exists */}
            {stats.urgent > 0 && (
              <div className="rounded-3xl p-6 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">
                      {stats.urgent} Urgent ticket{stats.urgent > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-white/85 mt-1">
                      Needs immediate attention
                    </p>
                    <Link
                      href="/admin/complaints"
                      className="inline-flex items-center gap-1 mt-3 text-sm font-semibold hover:underline"
                    >
                      Review now <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

/* ── KPI Card ─────────────────────────────────────── */
function KpiCard({
  label,
  value,
  icon,
  accent,
  sparkline,
  loading,
  urgent,
  trend,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "indigo" | "gold" | "orange" | "green" | "red";
  sparkline?: number[];
  loading: boolean;
  urgent?: number;
  trend?: number;
}) {
  // ECOLE brand palette — matches logo colors
  const styles = {
    indigo: {
      iconBg: "bg-indigo-50 text-indigo-600",
      ring: "from-indigo-500/40 to-indigo-500/0",
      spark: "from-indigo-600 to-indigo-400",
    },
    gold: {
      iconBg: "bg-amber-50 text-amber-600",
      ring: "from-amber-500/40 to-amber-500/0",
      spark: "from-amber-500 to-yellow-400",
    },
    orange: {
      iconBg: "bg-orange-50 text-orange-600",
      ring: "from-orange-500/40 to-orange-500/0",
      spark: "from-orange-500 to-amber-400",
    },
    green: {
      iconBg: "bg-emerald-50 text-emerald-600",
      ring: "from-emerald-500/40 to-emerald-500/0",
      spark: "from-emerald-500 to-green-400",
    },
    red: {
      iconBg: "bg-red-50 text-red-600",
      ring: "from-red-500/40 to-red-500/0",
      spark: "from-red-500 to-rose-400",
    },
  }[accent];

  const max = Math.max(1, ...(sparkline ?? [1]));

  return (
    <div className="card-premium p-6 relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${styles.ring}`}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center`}
        >
          {icon}
        </div>
        {urgent !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">
            {urgent} urgent
          </span>
        )}
        {trend !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            {trend}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <div className="flex items-end justify-between mt-1">
        {loading ? (
          <div className="h-9 w-16 skeleton bg-gray-100" />
        ) : (
          <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {value}
          </h3>
        )}
        {sparkline && sparkline.length > 0 && (
          <div className="flex items-end gap-0.5 h-10">
            {sparkline.map((v, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-sm bg-gradient-to-t ${styles.spark}`}
                style={{
                  height: `${Math.max((v / max) * 100, 8)}%`,
                  opacity: v > 0 ? 0.85 : 0.2,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Quick link card ───────────────────────────────── */
function QuickLink({
  href,
  title,
  desc,
  Icon,
  tint,
  iconBg,
}: {
  href: string;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint: string;
  iconBg: string;
}) {
  return (
    <Link
      href={href}
      className={`group card-premium p-6 bg-gradient-to-br ${tint} hover:scale-[1.01] transition-transform`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${iconBg} text-white flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-700 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition" />
      </div>
      <h4 className="font-bold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
    </Link>
  );
}

/* ── Status pill ───────────────────────────────────── */
function StatusPill({
  status,
}: {
  status: Complaint["status"];
}) {
  const map: Record<Complaint["status"], { bg: string; text: string }> = {
    PENDING: { bg: "bg-amber-50", text: "text-amber-700" },
    ASSIGNED: { bg: "bg-cyan-50", text: "text-cyan-700" },
    IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700" },
    RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700" },
    CLOSED: { bg: "bg-gray-100", text: "text-gray-700" },
  };
  const s = map[status];
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
