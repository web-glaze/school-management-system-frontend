"use client";

/**
 * Technician inbox — "Tickets assigned to me".
 *
 * The backend's GET /complaints/assigned-to-me matches the logged-in
 * user's email against Technician.email and returns only the tickets
 * pointed at that technician. The technician can open each ticket
 * (their RBAC includes tickets.detail + tickets.update) to change
 * status or add a remark.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  Inbox,
  Loader2,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageHero } from "@/components/ui/PageHero";
import { api, type Complaint } from "@/lib/api";
import { logError } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";

export default function AssignedTicketsPage() {
  const [tickets, setTickets] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.complaints.assignedToMe();
        setTickets(data);
      } catch (error) {
        logError("assigned.page", error);
        notify.error(error, "Failed to load assigned tickets");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Counts for the small status filter row.
  const counts = {
    PENDING: tickets.filter((t) => t.status === "PENDING").length,
    ASSIGNED: tickets.filter((t) => t.status === "ASSIGNED").length,
    IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    RESOLVED: tickets.filter(
      (t) => t.status === "RESOLVED" || t.status === "CLOSED",
    ).length,
  };

  const filtered =
    statusFilter === "ALL"
      ? tickets
      : statusFilter === "RESOLVED"
        ? tickets.filter(
            (t) => t.status === "RESOLVED" || t.status === "CLOSED",
          )
        : tickets.filter((t) => t.status === statusFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHero
          title="Assigned to Me"
          subtitle="Every ticket the admin assigned to you, grouped by status. Click a ticket to update its status or add a remark."
        />

        {/* Status filter strip — also doubles as counts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <FilterTile
            label="All"
            value="ALL"
            count={tickets.length}
            icon={Inbox}
            tone="text-gray-700 bg-gray-100"
            active={statusFilter === "ALL"}
            onClick={() => setStatusFilter("ALL")}
          />
          <FilterTile
            label="Pending"
            value="PENDING"
            count={counts.PENDING}
            icon={Clock}
            tone="text-amber-700 bg-amber-50"
            active={statusFilter === "PENDING"}
            onClick={() => setStatusFilter("PENDING")}
          />
          <FilterTile
            label="Assigned"
            value="ASSIGNED"
            count={counts.ASSIGNED}
            icon={AlertCircle}
            tone="text-cyan-700 bg-cyan-50"
            active={statusFilter === "ASSIGNED"}
            onClick={() => setStatusFilter("ASSIGNED")}
          />
          <FilterTile
            label="In Progress"
            value="IN_PROGRESS"
            count={counts.IN_PROGRESS}
            icon={TrendingUp}
            tone="text-blue-700 bg-blue-50"
            active={statusFilter === "IN_PROGRESS"}
            onClick={() => setStatusFilter("IN_PROGRESS")}
          />
          <FilterTile
            label="Resolved"
            value="RESOLVED"
            count={counts.RESOLVED}
            icon={CheckCircle2}
            tone="text-emerald-700 bg-emerald-50"
            active={statusFilter === "RESOLVED"}
            onClick={() => setStatusFilter("RESOLVED")}
          />
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 flex items-center justify-center text-gray-400">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Inbox className="size-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Nothing assigned to you yet
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                When an admin assigns a ticket to you it will appear here.
                Check back later or ask your manager.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/maintenance/tickets/${t.id}`}
                    className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                          t.priority === "URGENT"
                            ? "bg-rose-50 text-rose-600"
                            : t.priority === "HIGH"
                              ? "bg-orange-50 text-orange-600"
                              : t.priority === "MEDIUM"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        <AlertCircle className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {t.ticketCode ? `${t.ticketCode} · ` : ""}
                          {t.description?.slice(0, 80) || "Complaint"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {t.locationType} · {t.subLocation}
                          {t.user?.email ? ` · raised by ${t.user.email}` : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        t.status === "RESOLVED" || t.status === "CLOSED"
                          ? "bg-emerald-50 text-emerald-700"
                          : t.status === "IN_PROGRESS" ||
                              t.status === "ASSIGNED"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─── local helper ─── */

function FilterTile({
  label,
  value: _value,
  count,
  icon: Icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 border text-left transition-all ${
        active
          ? "border-primary/30 ring-1 ring-primary/15"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`size-8 rounded-lg flex items-center justify-center ${tone}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-3">{count}</p>
    </button>
  );
}
