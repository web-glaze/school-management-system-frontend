"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import { PhotoGallery, type UploadedFile } from "@/components/PhotoUpload";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type Status =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Complaint {
  id: string;
  title: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: Priority;
  status: Status;
  technicianRemark?: string | null;
  managerRemark?: string | null;
  createdAt: string;
  user?: { email: string };
  assignedTechnician?: { id: string; name: string } | null;
  attachments?: UploadedFile[];
}

export default function TechnicianPortalPage() {
  const { user, loading: authLoading } = useAuth({
    allowedRoles: ["technician", "admin", "superadmin"],
  });

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Get all complaints (filtered backend-side later if we improve);
      // for now we filter client-side by assignedTechnicianId === user.id
      // OR we fetch all and show what the technician should see.
      // Backend endpoint /complaints/assigned/me uses user.id.
      const res = await api.get("/api/complaints/assigned/me").catch(() =>
        // Fallback: list all and filter
        api.get("/api/complaints"),
      );
      const data = res.data?.data ?? res.data;
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to load tasks";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return complaints;
    return complaints.filter((c) => c.status === statusFilter);
  }, [complaints, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      assigned: complaints.filter((c) => c.status === "ASSIGNED").length,
      inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: complaints.filter((c) => c.status === "RESOLVED").length,
    };
  }, [complaints]);

  const updateStatus = async (id: string, status: Status) => {
    try {
      await api.patch(`/api/complaints/${id}/status`, { status });
      toast.success(`Marked as ${status.replace("_", " ")}`);
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to update status",
      );
    }
  };

  const saveRemark = async (id: string, remark: string) => {
    try {
      await api.patch(`/api/complaints/${id}/tech-remark`, {
        technicianRemark: remark,
      });
      toast.success("Remark saved");
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to save remark",
      );
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Verifying access...</p>
        </div>
      </DashboardLayout>
    );
  }

  const active = filtered.find((c) => c.id === activeId);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-500 to-lime-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              MAINTENANCE · TECHNICIAN PORTAL
            </p>
            <h1 className="text-5xl font-bold mt-4">My Tasks</h1>
            <p className="mt-4 text-lg text-white/90 max-w-2xl">
              {user.email} — update status, log remarks, mark complete.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-5">
          <Stat label="Total Tasks" value={stats.total} color="text-gray-800" />
          <Stat
            label="Assigned"
            value={stats.assigned}
            color="text-cyan-600"
          />
          <Stat
            label="In Progress"
            value={stats.inProgress}
            color="text-blue-600"
          />
          <Stat
            label="Resolved"
            value={stats.resolved}
            color="text-green-500"
          />
        </div>

        {/* Filter */}
        <div className="bg-white rounded-[2rem] p-5 shadow-lg border border-gray-100 flex gap-3 flex-wrap">
          {(["ALL", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition ${
                  statusFilter === s
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white border-gray-200 hover:border-emerald-400"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ),
          )}
        </div>

        {/* Tasks list */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
              Loading tasks...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center">
              <h3 className="text-2xl font-bold text-gray-800">
                No tasks {statusFilter !== "ALL" && `in "${statusFilter}"`}
              </h3>
              <p className="text-gray-500 mt-3">
                You&apos;re all caught up! New assignments will appear here.
              </p>
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-800">
                        {c.title}
                      </h3>
                      <p className="text-gray-600 mt-2">{c.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                          {c.locationType} • {c.subLocation}
                        </span>
                        <PriorityBadge priority={c.priority} />
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        Raised by {c.user?.email} •{" "}
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {c.status === "ASSIGNED" && (
                        <button
                          onClick={() => updateStatus(c.id, "IN_PROGRESS")}
                          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700"
                        >
                          Start Work
                        </button>
                      )}
                      {c.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => updateStatus(c.id, "RESOLVED")}
                          className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <button
                        onClick={() => setActiveId(c.id)}
                        className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200"
                      >
                        Add Remark
                      </button>
                    </div>
                  </div>

                  {c.attachments && c.attachments.length > 0 && (
                    <div className="mt-5">
                      <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wide mb-3">
                        📷 Photos from user ({c.attachments.length})
                      </h4>
                      <PhotoGallery files={c.attachments} />
                    </div>
                  )}

                  {c.managerRemark && (
                    <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                      <h4 className="font-bold text-yellow-700 text-xs uppercase tracking-wide">
                        Manager Note
                      </h4>
                      <p className="text-gray-700 mt-1 text-sm">
                        {c.managerRemark}
                      </p>
                    </div>
                  )}

                  {c.technicianRemark && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                      <h4 className="font-bold text-emerald-700 text-xs uppercase tracking-wide">
                        My Remark
                      </h4>
                      <p className="text-gray-700 mt-1 text-sm">
                        {c.technicianRemark}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Remark modal */}
      {active && (
        <RemarkModal
          complaint={active}
          onClose={() => setActiveId(null)}
          onSave={(r) => {
            saveRemark(active.id, r);
            setActiveId(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <h2 className={`text-4xl font-bold mt-3 ${color}`}>{value}</h2>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, string> = {
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

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
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

function RemarkModal({
  complaint,
  onClose,
  onSave,
}: {
  complaint: Complaint;
  onClose: () => void;
  onSave: (remark: string) => void;
}) {
  const [remark, setRemark] = useState(complaint.technicianRemark ?? "");

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-gray-800">Add / Update Remark</h3>
        <p className="text-gray-500 mt-2 text-sm">{complaint.title}</p>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Describe what you did, parts used, what's pending..."
          rows={5}
          className="w-full mt-6 rounded-2xl border border-gray-200 bg-[#f8fafc] p-5 outline-none focus:border-emerald-400 resize-none"
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onSave(remark)}
            className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white font-semibold"
          >
            Save Remark
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border border-gray-200 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
