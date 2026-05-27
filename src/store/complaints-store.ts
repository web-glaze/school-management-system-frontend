"use client";

import { create } from "zustand";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import type { UploadedFile } from "@/components/PhotoUpload";

export type ComplaintStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Technician {
  id: string;
  name: string;
  phone?: string | null;
  department?: { name: string } | null;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  managerRemark?: string | null;
  technicianRemark?: string | null;
  assignedTechnicianId?: string | null;
  createdAt: string;
  user?: { id: string; email: string };
  assignedTechnician?: Technician | null;
  attachments?: UploadedFile[];
}

interface ComplaintsState {
  // ── Data ─────────────────────────────────────────────────
  complaints: Complaint[];
  technicians: Technician[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  // ── Fetching ─────────────────────────────────────────────
  /** Fetch all complaints + technicians together. */
  fetchAll: () => Promise<void>;
  /** Fetch only complaints (skips technicians). */
  fetchComplaints: () => Promise<void>;
  /** Fetch only technicians. */
  fetchTechnicians: () => Promise<void>;
  /** Fetch tickets assigned to the current technician user. */
  fetchAssignedToMe: () => Promise<void>;
  /** Fetch only the current user's complaints. */
  fetchMyComplaints: () => Promise<void>;

  // ── Mutations ────────────────────────────────────────────
  createComplaint: (payload: {
    title: string;
    description: string;
    locationType: string;
    subLocation: string;
    priority: ComplaintPriority;
    attachments?: UploadedFile[];
  }) => Promise<Complaint | null>;

  updateStatus: (id: string, status: ComplaintStatus) => Promise<void>;
  updatePriority: (
    id: string,
    priority: ComplaintPriority,
  ) => Promise<void>;
  assignTechnician: (id: string, technicianId: string) => Promise<void>;
  saveManagerRemark: (id: string, remark: string) => Promise<void>;
  saveTechnicianRemark: (id: string, remark: string) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;

  // ── Utilities ────────────────────────────────────────────
  /** Clear in-memory data (used on logout). */
  reset: () => void;
}

/** Unwrap the standard backend response: { data: ... } or raw array. */
function unwrap<T>(res: unknown): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = res as any;
  return (r?.data?.data ?? r?.data ?? r) as T;
}

function showErr(err: unknown, fallback: string) {
  const msg =
    (err as { displayMessage?: string })?.displayMessage || fallback;
  toast.error(msg);
}

export const useComplaintsStore = create<ComplaintsState>((set, get) => ({
  complaints: [],
  technicians: [],
  loading: false,
  error: null,
  lastFetchedAt: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [cRes, tRes] = await Promise.all([
        api.get("/api/complaints"),
        api.get("/api/technicians"),
      ]);
      const cData = unwrap<Complaint[]>(cRes);
      const tData = unwrap<Technician[]>(tRes);
      set({
        complaints: Array.isArray(cData) ? cData : [],
        technicians: Array.isArray(tData) ? tData : [],
        lastFetchedAt: Date.now(),
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: (err as Error)?.message ?? "Failed to load data",
      });
      showErr(err, "Failed to load data");
    }
  },

  fetchComplaints: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/api/complaints");
      const data = unwrap<Complaint[]>(res);
      set({
        complaints: Array.isArray(data) ? data : [],
        lastFetchedAt: Date.now(),
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      showErr(err, "Failed to load complaints");
    }
  },

  fetchTechnicians: async () => {
    try {
      const res = await api.get("/api/technicians");
      const data = unwrap<Technician[]>(res);
      set({ technicians: Array.isArray(data) ? data : [] });
    } catch (err) {
      showErr(err, "Failed to load technicians");
    }
  },

  fetchAssignedToMe: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/api/complaints/assigned/me");
      const data = unwrap<Complaint[]>(res);
      set({
        complaints: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      showErr(err, "Failed to load your tasks");
    }
  },

  fetchMyComplaints: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/api/complaints/my");
      const data = unwrap<Complaint[]>(res);
      set({
        complaints: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      showErr(err, "Failed to load complaints");
    }
  },

  createComplaint: async (payload) => {
    try {
      const res = await api.post("/api/complaints", payload);
      const created = unwrap<Complaint>(res);
      // Optimistically prepend
      set((state) => ({
        complaints: [created, ...state.complaints],
      }));
      toast.success("Complaint registered");
      return created;
    } catch (err) {
      showErr(err, "Failed to register complaint");
      return null;
    }
  },

  updateStatus: async (id, status) => {
    // Optimistic update
    const prev = get().complaints;
    set({
      complaints: prev.map((c) => (c.id === id ? { ...c, status } : c)),
    });
    try {
      await api.patch(`/api/complaints/${id}/status`, { status });
      toast.success(`Status → ${status.replace("_", " ")}`);
      // Refresh to get any computed fields (resolvedAt etc.)
      get().fetchComplaints();
    } catch (err) {
      set({ complaints: prev }); // rollback
      showErr(err, "Failed to update status");
    }
  },

  updatePriority: async (id, priority) => {
    const prev = get().complaints;
    set({
      complaints: prev.map((c) =>
        c.id === id ? { ...c, priority } : c,
      ),
    });
    try {
      await api.patch(`/api/complaints/${id}/priority`, { priority });
      toast.success(`Priority → ${priority}`);
    } catch (err) {
      set({ complaints: prev });
      showErr(err, "Failed to update priority");
    }
  },

  assignTechnician: async (id, technicianId) => {
    if (!technicianId) return;
    try {
      await api.patch(`/api/complaints/${id}/assign`, { technicianId });
      toast.success("Technician assigned");
      get().fetchComplaints();
    } catch (err) {
      showErr(err, "Failed to assign technician");
    }
  },

  saveManagerRemark: async (id, remark) => {
    try {
      await api.patch(`/api/complaints/${id}/remark`, {
        managerRemark: remark,
      });
      toast.success("Remark saved");
      set((state) => ({
        complaints: state.complaints.map((c) =>
          c.id === id ? { ...c, managerRemark: remark } : c,
        ),
      }));
    } catch (err) {
      showErr(err, "Failed to save remark");
    }
  },

  saveTechnicianRemark: async (id, remark) => {
    try {
      await api.patch(`/api/complaints/${id}/tech-remark`, {
        technicianRemark: remark,
      });
      toast.success("Remark saved");
      set((state) => ({
        complaints: state.complaints.map((c) =>
          c.id === id ? { ...c, technicianRemark: remark } : c,
        ),
      }));
    } catch (err) {
      showErr(err, "Failed to save remark");
    }
  },

  deleteComplaint: async (id) => {
    const prev = get().complaints;
    set({ complaints: prev.filter((c) => c.id !== id) });
    try {
      await api.delete(`/api/complaints/${id}`);
      toast.success("Complaint deleted");
    } catch (err) {
      set({ complaints: prev });
      showErr(err, "Failed to delete");
    }
  },

  reset: () =>
    set({
      complaints: [],
      technicians: [],
      loading: false,
      error: null,
      lastFetchedAt: null,
    }),
}));

// ── Selector hooks for performance ──────────────────────────
export const useComplaints = () =>
  useComplaintsStore((s) => s.complaints);
export const useTechnicians = () =>
  useComplaintsStore((s) => s.technicians);
export const useComplaintsLoading = () =>
  useComplaintsStore((s) => s.loading);
