"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Complaint {
  id: string;
  title: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status:
    | "PENDING"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "CLOSED";
  createdAt: string;
  user?: { email: string };
  assignedTechnician?: { id: string; name: string } | null;
}

export default function AdminHomePage() {
  const { user, loading: authLoading } = useAuth({
    allowedRoles: ["admin", "superadmin"],
  });

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/api/complaints");
      const data = res.data;
      setComplaints(
        Array.isArray(data) ? data : data?.data || []
      );
    } catch (error: unknown) {
      const msg =
        (error as { displayMessage?: string })?.displayMessage ||
        "Failed to load complaints";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchComplaints();
  }, [authLoading, user]);

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "PENDING").length,
      inProgress: complaints.filter(
        (c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED"
      ).length,
      resolved: complaints.filter(
        (c) => c.status === "RESOLVED" || c.status === "CLOSED"
      ).length,
      urgent: complaints.filter((c) => c.priority === "URGENT").length,
    };
  }, [complaints]);

  const recent = useMemo(
    () => complaints.slice(0, 6),
    [complaints]
  );

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Verifying access...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              {user.role === "superadmin"
                ? "SUPER ADMIN PANEL"
                : "ADMIN PANEL"}
            </p>
            <h1 className="text-5xl font-bold mt-4">
              Welcome back, Admin
            </h1>
            <p className="mt-5 text-lg text-white/90 max-w-2xl">
              {user.email} — full control over school maintenance,
              users, complaints, and operations.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/admin/complaints"
                className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-semibold hover:bg-blue-50 transition shadow-lg"
              >
                Manage Complaints
              </Link>
              <Link
                href="/admin/departments"
                className="bg-white/15 backdrop-blur text-white border border-white/30 px-6 py-3 rounded-2xl font-semibold hover:bg-white/25 transition"
              >
                Add Department
              </Link>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid xl:grid-cols-5 md:grid-cols-2 gap-6">
          <StatCard
            label="Total Complaints"
            value={stats.total}
            color="text-gray-800"
            loading={loading}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            color="text-yellow-500"
            loading={loading}
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            color="text-blue-600"
            loading={loading}
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            color="text-green-500"
            loading={loading}
          />
          <StatCard
            label="Urgent"
            value={stats.urgent}
            color="text-red-500"
            loading={loading}
          />
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <QuickLink
              href="/admin/complaints"
              title="Complaints"
              subtitle="View, assign & resolve"
              tint="bg-blue-50 border-blue-100"
              icon="📋"
            />
            <QuickLink
              href="/admin/departments"
              title="Departments"
              subtitle="Add maintenance teams"
              tint="bg-purple-50 border-purple-100"
              icon="🏛️"
            />
            <QuickLink
              href="/raise-ticket"
              title="Raise Ticket"
              subtitle="Quick complaint entry"
              tint="bg-cyan-50 border-cyan-100"
              icon="✍️"
            />
            <QuickLink
              href="/my-complaints"
              title="My Complaints"
              subtitle="Tickets you raised"
              tint="bg-amber-50 border-amber-100"
              icon="📂"
            />
          </div>
        </div>

        {/* Recent complaints */}
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Recent Complaints
              </h2>
              <p className="text-gray-500 mt-1">
                Latest 6 tickets across the system
              </p>
            </div>
            <Link
              href="/admin/complaints"
              className="text-blue-600 font-semibold hover:underline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-400 py-8 text-center">
              Loading...
            </p>
          ) : recent.length === 0 ? (
            <p className="text-gray-400 py-12 text-center">
              No complaints yet.
            </p>
          ) : (
            <div className="space-y-4">
              {recent.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {c.title}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 truncate">
                      {c.locationType} • {c.subLocation}
                      {c.user?.email && ` • by ${c.user.email}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2rem] p-7 shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Logged in as
            </h3>
            <div className="space-y-3 text-sm">
              <Row label="Email" value={user.email} />
              <Row label="Role" value={user.role.toUpperCase()} />
              <Row
                label="Permissions"
                value={`${user.roles.length} role(s)`}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-[2rem] p-7 shadow-lg text-white">
            <h3 className="text-xl font-bold mb-4">System Health</h3>
            <div className="space-y-3 text-sm">
              <Row
                label="API"
                value="Connected"
                valueClass="text-green-300"
                dark
              />
              <Row
                label="Database"
                value="PostgreSQL · Prisma"
                dark
              />
              <Row
                label="Build"
                value="Next.js 16 + React 19"
                dark
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function StatCard({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: number;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100">
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <h2 className={`text-4xl font-bold mt-3 ${color}`}>
        {loading ? "—" : value}
      </h2>
    </div>
  );
}

function QuickLink({
  href,
  title,
  subtitle,
  tint,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  tint: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className={`block ${tint} border rounded-2xl p-6 hover:shadow-md transition`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h4 className="font-bold text-gray-800">{title}</h4>
      <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
    </Link>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: Complaint["priority"];
}) {
  const map: Record<Complaint["priority"], string> = {
    LOW: "bg-green-100 text-green-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-red-100 text-red-700",
    URGENT: "bg-purple-100 text-purple-700",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${map[priority]}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: Complaint["status"] }) {
  const map: Record<Complaint["status"], string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    ASSIGNED: "bg-cyan-100 text-cyan-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    RESOLVED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-200 text-gray-700",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}
    >
      {status}
    </span>
  );
}

function Row({
  label,
  value,
  valueClass,
  dark,
}: {
  label: string;
  value: string;
  valueClass?: string;
  dark?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={dark ? "text-white/70" : "text-gray-500"}>
        {label}
      </span>
      <span
        className={`font-semibold ${valueClass ?? (dark ? "text-white" : "text-gray-800")}`}
      >
        {value}
      </span>
    </div>
  );
}
