"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Ticket,
  TrendingUp,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { logError } from "@/lib/api-helpers";
import { canAccess, normaliseRole } from "@/lib/rbac";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Complaint {
  id: string;
  ticketCode?: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

/**
 * Landing page after login. Shows a real "what's happening" summary instead
 * of three blank tiles. For admins/managers we pull /api/complaints; for
 * regular users we pull /api/complaints/my. Technicians see their assigned
 * queue via the same endpoint.
 */
export default function DashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<ReturnType<typeof normaliseRole>>("user");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      if (raw) setRole(normaliseRole(JSON.parse(raw)?.role));
    } catch {
      // ignore — DashboardLayout will redirect if user is missing.
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Pick the right endpoint by role. Users only ever see their own
        // complaints; everyone else sees the full list they're allowed to
        // view (the backend enforces tenant + role filters).
        const url = canAccess(role, "tickets.list")
          ? `${API_URL}/api/complaints`
          : `${API_URL}/api/complaints/my`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setComplaints(data);
      } catch (error) {
        logError("dashboard.page", error);
      } finally {
        setLoading(false);
      }
    };
    setTimeout(load, 0);
  }, [role]);

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "PENDING").length;
  const inProgress = complaints.filter(
    (c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS",
  ).length;
  const resolved = complaints.filter(
    (c) => c.status === "RESOLVED" || c.status === "CLOSED",
  ).length;

  const recent = complaints
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  // Card definitions — same UI design as the rest of the app.
  const stats = [
    {
      label: canAccess(role, "tickets.list") ? "Total Tickets" : "My Tickets",
      value: total,
      icon: Ticket,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: TrendingUp,
      color: "text-cyan-600 bg-cyan-50",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 rounded-[2rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="uppercase tracking-[0.25em] text-[11px] text-white/80">
              ECOLE ERP
            </p>
            <h1 className="text-2xl font-bold mt-2">Welcome back</h1>
            <p className="text-sm text-white/90 mt-1.5 max-w-2xl">
              Your maintenance activity at a glance.
              <span className="capitalize ml-1">Logged in as {role}.</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {label}
                </span>
                <span
                  className={`size-8 rounded-lg flex items-center justify-center ${color}`}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-3">
                {loading ? (
                  <Loader2 className="size-5 animate-spin text-gray-400" />
                ) : (
                  value
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Recent complaints */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                Recent Activity
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Latest tickets that involve you.
              </p>
            </div>
            <Link
              href="/maintenance"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Open maintenance →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center text-gray-400">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Inbox className="size-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                No tickets yet
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Raise your first ticket from the Maintenance module — it'll
                appear here.
              </p>
              <Link
                href="/maintenance/tickets/create"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Raise a ticket →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((c) => (
                <li
                  key={c.id}
                  className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition"
                >
                  <Link
                    href={
                      canAccess(role, "tickets.detail")
                        ? `/maintenance/tickets/${c.id}`
                        : "/maintenance/my-complaints"
                    }
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <span
                      className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                        c.priority === "URGENT"
                          ? "bg-rose-50 text-rose-600"
                          : c.priority === "HIGH"
                            ? "bg-orange-50 text-orange-600"
                            : c.priority === "MEDIUM"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      <AlertCircle className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {c.ticketCode ? `${c.ticketCode} · ` : ""}
                        {c.description.slice(0, 60) || "Complaint"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {new Date(c.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </Link>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      c.status === "RESOLVED" || c.status === "CLOSED"
                        ? "bg-emerald-50 text-emerald-700"
                        : c.status === "IN_PROGRESS" || c.status === "ASSIGNED"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
