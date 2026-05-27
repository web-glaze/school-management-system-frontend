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

export default function ManagerDashboardPage() {
  const { user, loading: authLoading } = useAuth({
    allowedRoles: ["manager", "admin", "superadmin"],
  });

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get("/api/complaints");
      const data = res.data?.data ?? res.data;
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to load complaints";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user]);

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

  const recent = useMemo(() => complaints.slice(0, 8), [complaints]);

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
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              ECOLE MAINTENANCE PORTAL
            </p>
            <h1 className="text-5xl font-bold mt-4">Manager Dashboard</h1>
            <p className="mt-4 text-lg text-white/90 max-w-2xl">
              Triage complaints, assign technicians, monitor progress in real
              time.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/admin/complaints"
                className="bg-white text-violet-600 px-6 py-3 rounded-2xl font-semibold hover:bg-violet-50 transition shadow-lg"
              >
                Manage All Complaints
              </Link>
              <Link
                href="/admin/technicians"
                className="bg-white/15 backdrop-blur text-white border border-white/30 px-6 py-3 rounded-2xl font-semibold hover:bg-white/25 transition"
              >
                View Technicians
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid xl:grid-cols-5 md:grid-cols-2 gap-5">
          <Stat label="Total" value={stats.total} color="text-gray-800" loading={loading} />
          <Stat
            label="Pending"
            value={stats.pending}
            color="text-yellow-500"
            loading={loading}
          />
          <Stat
            label="In Progress"
            value={stats.inProgress}
            color="text-blue-600"
            loading={loading}
          />
          <Stat
            label="Resolved"
            value={stats.resolved}
            color="text-green-500"
            loading={loading}
          />
          <Stat
            label="Urgent"
            value={stats.urgent}
            color="text-red-500"
            loading={loading}
          />
        </div>

        {/* Recent complaints */}
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Recent Complaints
              </h2>
              <p className="text-gray-500 mt-1">
                Click &quot;Manage&quot; to assign or update
              </p>
            </div>
            <Link
              href="/admin/complaints"
              className="text-violet-600 font-semibold hover:underline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-400 py-8 text-center">Loading...</p>
          ) : recent.length === 0 ? (
            <p className="text-gray-400 py-12 text-center">
              No complaints yet.
            </p>
          ) : (
            <div className="space-y-4">
              {recent.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {c.title}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 truncate">
                      {c.locationType} • {c.subLocation}
                      {c.user?.email && ` • by ${c.user.email}`}
                      {c.assignedTechnician &&
                        ` • assigned to ${c.assignedTechnician.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                    <Link
                      href="/admin/complaints"
                      className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({
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
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <h2 className={`text-4xl font-bold mt-3 ${color}`}>
        {loading ? "—" : value}
      </h2>
    </div>
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
      {status.replace("_", " ")}
    </span>
  );
}
