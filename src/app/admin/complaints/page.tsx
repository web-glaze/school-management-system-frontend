"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { PhotoGallery, type UploadedFile } from "@/components/PhotoUpload";
import { useEffect, useMemo, useState } from "react";
import { useComplaintsStore } from "@/store/complaints-store";

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

  // ── Zustand-backed data + actions ─────────────────────────
  const complaints = useComplaintsStore((s) => s.complaints);
  const technicians = useComplaintsStore((s) => s.technicians);
  const loading = useComplaintsStore((s) => s.loading);
  const fetchAll = useComplaintsStore((s) => s.fetchAll);
  const storeUpdateStatus = useComplaintsStore((s) => s.updateStatus);
  const storeUpdatePriority = useComplaintsStore((s) => s.updatePriority);
  const storeAssignTechnician = useComplaintsStore((s) => s.assignTechnician);
  const storeSaveManagerRemark = useComplaintsStore(
    (s) => s.saveManagerRemark,
  );
  const storeDeleteComplaint = useComplaintsStore((s) => s.deleteComplaint);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | Priority>(
    "ALL",
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) fetchAll();
  }, [authLoading, user, fetchAll]);

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

  // ── Thin wrappers around store actions ──────────────────
  const updateStatus = (id: string, status: Status) =>
    storeUpdateStatus(id, status);

  const updatePriority = (id: string, priority: Priority) =>
    storeUpdatePriority(id, priority);

  const assignTech = (id: string, technicianId: string) =>
    storeAssignTechnician(id, technicianId);

  const saveManagerRemark = (id: string, remark: string) =>
    storeSaveManagerRemark(id, remark);

  const deleteComplaint = async (id: string) => {
    if (!confirm("Soft-delete this complaint?")) return;
    await storeDeleteComplaint(id);
    setActiveId(null);
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
      <div className="space-y-5 sm:space-y-6 lg:space-y-8">
        <PageHeader
          kicker="Maintenance"
          title="Complaint Control Center"
          subtitle="Assign technicians, change priority, add remarks, track status."
          accent="indigo"
        />

        {/* Stats — responsive grid (2 mobile / 3 tablet / 5 desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
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

        {/* Filters — stack on mobile */}
        <div className="card-premium p-4 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between">
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm outline-none focus:border-indigo-400 w-full lg:w-96"
          />
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | Status)
              }
              className="border border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 text-sm outline-none focus:border-indigo-400"
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
              className="border border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 text-sm outline-none focus:border-indigo-400"
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
        <div className="card-premium overflow-hidden">
          <div className="p-3 sm:p-4 lg:p-5 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">
              All Complaints{" "}
              <span className="text-xs sm:text-sm font-normal text-gray-500">
                ({filtered.length})
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[#f5f7fb]">
                <tr className="text-left text-xs sm:text-sm">
                  <th className="p-3 sm:p-5">Complaint</th>
                  <th className="p-3 sm:p-5 hidden md:table-cell">By</th>
                  <th className="p-3 sm:p-5 hidden lg:table-cell">Location</th>
                  <th className="p-3 sm:p-5">Priority</th>
                  <th className="p-3 sm:p-5">Status</th>
                  <th className="p-3 sm:p-5 hidden lg:table-cell">Assigned</th>
                  <th className="p-3 sm:p-5">Action</th>
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
                      <td className="p-3 sm:p-5">
                        <p className="font-semibold text-sm sm:text-base text-gray-800 flex items-center gap-2">
                          <span className="truncate max-w-[180px] sm:max-w-none">
                            {c.title}
                          </span>
                          {c.attachments && c.attachments.length > 0 && (
                            <span
                              className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                              title={`${c.attachments.length} photo(s)`}
                            >
                              📷 {c.attachments.length}
                            </span>
                          )}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                          {c.description}
                        </p>
                      </td>
                      <td className="p-3 sm:p-5 text-gray-600 text-xs sm:text-sm hidden md:table-cell">
                        {c.user?.email || "—"}
                      </td>
                      <td className="p-3 sm:p-5 text-gray-500 text-xs sm:text-sm hidden lg:table-cell">
                        {c.locationType} • {c.subLocation}
                      </td>
                      <td className="p-3 sm:p-5">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="p-3 sm:p-5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="p-3 sm:p-5 text-xs sm:text-sm hidden lg:table-cell">
                        {c.assignedTechnician ? (
                          <span className="text-gray-700 font-medium">
                            {c.assignedTechnician.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td
                        className="p-3 sm:p-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setActiveId(c.id)}
                          className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
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
    <div className="card-premium p-3 sm:p-4 lg:p-5">
      <p className="text-gray-500 text-[11px] sm:text-xs font-medium truncate">
        {label}
      </p>
      <h2
        className={`text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1 tracking-tight ${color}`}
      >
        {value}
      </h2>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, { bg: string; text: string; dot: string }> = {
    LOW: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    MEDIUM: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    HIGH: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
    URGENT: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500 dot-glow" },
  };
  const s = map[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${priority === "URGENT" ? "text-red-500" : ""}`} />
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; text: string }> = {
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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex sm:justify-end animate-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-xl lg:max-w-2xl h-full overflow-y-auto shadow-2xl animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-6 flex justify-between items-center z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Manage Complaint
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
              {complaint.title}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {complaint.description}
            </p>
            <div className="flex gap-2 mt-3 sm:mt-4 flex-wrap">
              <span className="px-2.5 sm:px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs sm:text-sm">
                {complaint.locationType} • {complaint.subLocation}
              </span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 mt-3">
              Raised by {complaint.user?.email} ·{" "}
              {new Date(complaint.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Photos */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Attached Photos ({complaint.attachments.length})
              </label>
              <PhotoGallery files={complaint.attachments} />
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Change Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatus(s)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border transition ${
                    complaint.status === s
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white border-gray-200 hover:border-indigo-400"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Change Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => onPriority(p)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border transition ${
                    complaint.priority === p
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white border-gray-200 hover:border-indigo-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Assign Technician
            </label>
            <div className="flex gap-3">
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="flex-1 h-14 rounded-2xl border border-gray-200 bg-[#f8fafc] px-5 outline-none focus:border-indigo-400"
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
                className="px-6 h-14 rounded-2xl bg-indigo-600 text-white font-semibold disabled:opacity-50"
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
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Manager Remark
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add notes / instructions..."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-[#f8fafc] p-5 outline-none focus:border-indigo-400 resize-none"
            />
            <button
              onClick={() => onSaveRemark(remark)}
              className="mt-3 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold"
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
