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

interface Technician {
  id: string;
  name: string;
  department?: { name: string } | null;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: Priority;
  status: Status;
  managerRemark?: string | null;
  technicianRemark?: string | null;
  assignedTechnicianId?: string | null;
  createdAt: string;
  user?: { id: string; email: string };
  assignedTechnician?: Technician | null;
  attachments?: UploadedFile[];
}

const STATUSES: Status[] = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function AdminComplaintsPage() {
  const { user, loading: authLoading } = useAuth({
    allowedRoles: ["admin", "superadmin", "manager"],
  });

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | Priority>(
    "ALL",
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        api.get("/api/complaints"),
        api.get("/api/technicians"),
      ]);
      const cData = cRes.data?.data ?? cRes.data;
      const tData = tRes.data?.data ?? tRes.data;
      setComplaints(Array.isArray(cData) ? cData : []);
      setTechnicians(Array.isArray(tData) ? tData : []);
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Failed to load data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user]);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.subLocation.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || c.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" || c.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [complaints, search, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "PENDING").length,
      urgent: complaints.filter((c) => c.priority === "URGENT").length,
      inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: complaints.filter(
        (c) => c.status === "RESOLVED" || c.status === "CLOSED",
      ).length,
    };
  }, [complaints]);

  const updateStatus = async (id: string, status: Status) => {
    try {
      await api.patch(`/api/complaints/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to update status",
      );
    }
  };

  const updatePriority = async (id: string, priority: Priority) => {
    try {
      await api.patch(`/api/complaints/${id}/priority`, { priority });
      toast.success(`Priority set to ${priority}`);
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to update priority",
      );
    }
  };

  const assignTech = async (id: string, technicianId: string) => {
    if (!technicianId) return;
    try {
      await api.patch(`/api/complaints/${id}/assign`, { technicianId });
      toast.success("Technician assigned");
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to assign technician",
      );
    }
  };

  const saveManagerRemark = async (id: string, remark: string) => {
    try {
      await api.patch(`/api/complaints/${id}/remark`, {
        managerRemark: remark,
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

  const deleteComplaint = async (id: string) => {
    if (!confirm("Soft-delete this complaint?")) return;
    try {
      await api.delete(`/api/complaints/${id}`);
      toast.success("Complaint deleted");
      setActiveId(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { displayMessage?: string })?.displayMessage ||
          "Failed to delete",
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
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="uppercase tracking-[0.3em] text-sm text-white/80">
              MAINTENANCE · COMPLAINT MANAGEMENT
            </p>
            <h1 className="text-5xl font-bold mt-4">
              Complaints Control Center
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-2xl">
              Assign technicians, change priority, add remarks, track status —
              all from one console.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid xl:grid-cols-5 md:grid-cols-2 gap-5">
          <Stat label="Total" value={stats.total} color="text-gray-800" />
          <Stat
            label="Pending"
            value={stats.pending}
            color="text-yellow-500"
          />
          <Stat label="Urgent" value={stats.urgent} color="text-red-500" />
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

        {/* Filters */}
        <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 flex flex-col lg:flex-row gap-4 justify-between">
          <input
            type="text"
            placeholder="Search title, description, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 w-full lg:w-96"
          />
          <div className="flex gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | Status)
              }
              className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400"
            >
              <option value="ALL">All Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as "ALL" | Priority)
              }
              className="border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-400"
            >
              <option value="ALL">All Priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">
              All Complaints{" "}
              <span className="text-base font-normal text-gray-500">
                ({filtered.length})
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f5f7fb]">
                <tr className="text-left text-sm">
                  <th className="p-5">Complaint</th>
                  <th className="p-5">By</th>
                  <th className="p-5">Location</th>
                  <th className="p-5">Priority</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Assigned</th>
                  <th className="p-5">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      Loading complaints...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">
                      No complaints match these filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setActiveId(c.id)}
                    >
                      <td className="p-5">
                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                          {c.title}
                          {c.attachments && c.attachments.length > 0 && (
                            <span
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium"
                              title={`${c.attachments.length} photo(s)`}
                            >
                              📷 {c.attachments.length}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {c.description}
                        </p>
                      </td>
                      <td className="p-5 text-gray-600 text-sm">
                        {c.user?.email || "—"}
                      </td>
                      <td className="p-5 text-gray-500 text-sm">
                        {c.locationType} • {c.subLocation}
                      </td>
                      <td className="p-5">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="p-5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="p-5 text-sm">
                        {c.assignedTechnician ? (
                          <span className="text-gray-700 font-medium">
                            {c.assignedTechnician.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td
                        className="p-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setActiveId(c.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail / Action panel */}
      {active && (
        <DetailPanel
          complaint={active}
          technicians={technicians}
          onClose={() => setActiveId(null)}
          onStatus={(s) => updateStatus(active.id, s)}
          onPriority={(p) => updatePriority(active.id, p)}
          onAssign={(t) => assignTech(active.id, t)}
          onSaveRemark={(r) => saveManagerRemark(active.id, r)}
          onDelete={() => deleteComplaint(active.id)}
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

function DetailPanel({
  complaint,
  technicians,
  onClose,
  onStatus,
  onPriority,
  onAssign,
  onSaveRemark,
  onDelete,
}: {
  complaint: Complaint;
  technicians: Technician[];
  onClose: () => void;
  onStatus: (s: Status) => void;
  onPriority: (p: Priority) => void;
  onAssign: (t: string) => void;
  onSaveRemark: (r: string) => void;
  onDelete: () => void;
}) {
  const [remark, setRemark] = useState(complaint.managerRemark ?? "");
  const [selectedTech, setSelectedTech] = useState(
    complaint.assignedTechnicianId ?? "",
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Manage Complaint</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              {complaint.title}
            </h3>
            <p className="text-gray-600 mt-2">{complaint.description}</p>
            <div className="flex gap-3 mt-4 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                {complaint.locationType} • {complaint.subLocation}
              </span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Raised by {complaint.user?.email} ·{" "}
              {new Date(complaint.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Photos */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Attached Photos ({complaint.attachments.length})
              </label>
              <PhotoGallery files={complaint.attachments} />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Change Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                    complaint.status === s
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Change Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => onPriority(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                    complaint.priority === p
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Assign Technician
            </label>
            <div className="flex gap-3">
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="flex-1 h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-blue-400"
              >
                <option value="">— Select technician —</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.department ? ` (${t.department.name})` : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onAssign(selectedTech)}
                disabled={!selectedTech}
                className="px-6 h-14 rounded-2xl bg-blue-600 text-white font-semibold disabled:opacity-50"
              >
                Assign
              </button>
            </div>
            {technicians.length === 0 && (
              <p className="text-amber-600 text-sm mt-2">
                No technicians yet. Add some in the Technicians page first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Manager Remark
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add notes / instructions..."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-[#f8fafc] p-5 outline-none focus:border-blue-400 resize-none"
            />
            <button
              onClick={() => onSaveRemark(remark)}
              className="mt-3 px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold"
            >
              Save Remark
            </button>
          </div>

          {complaint.technicianRemark && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5">
              <h4 className="font-bold text-cyan-700 text-sm uppercase tracking-wide">
                Technician Remark
              </h4>
              <p className="text-gray-700 mt-2">
                {complaint.technicianRemark}
              </p>
            </div>
          )}

          <div className="border-t pt-6">
            <button
              onClick={onDelete}
              className="text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-xl"
            >
              🗑 Delete Complaint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
