import { create } from "zustand";

import {
  gatepassService,
  type CreateHostelPayload,
  type CreateHousemotherPayload,
  type CreateMovementRequestPayload,
  type DecisionPayload,
  type Gate,
  type GateDashboard,
  type Hostel,
  type Housemother,
  type ListParams,
  type MovementRequest,
  type UpdateHostelPayload,
  type UpdateHousemotherPayload,
} from "@/services/gatepass.service";

/* =========================
   TYPES
========================= */

type LoadKey = "myRequests" | "allRequests" | "approvals" | "dashboard" | "gates" | "hostels" | "housemothers";

interface GatepassStore {
  /* Requests */
  myRequests: MovementRequest[];
  myTotal: number;
  allRequests: MovementRequest[];
  allTotal: number;

  /* Approvals */
  pendingHousemother: MovementRequest[];
  pendingFinal: MovementRequest[];

  /* Gate */
  dashboard: GateDashboard | null;

  /* Setup */
  gates: Gate[];
  hostels: Hostel[];
  housemothers: Housemother[];

  loading: Record<LoadKey, boolean>;

  /* Requests */
  fetchMyRequests: (params?: ListParams) => Promise<void>;
  fetchAllRequests: (params?: ListParams) => Promise<void>;
  createRequest: (data: CreateMovementRequestPayload) => Promise<MovementRequest>;
  cancelRequest: (id: string) => Promise<void>;
  revokeRequest: (id: string) => Promise<void>;

  /* Approvals */
  fetchPendingHousemother: () => Promise<void>;
  fetchPendingFinal: () => Promise<void>;
  housemotherDecision: (id: string, data: DecisionPayload) => Promise<void>;
  finalDecision: (id: string, data: DecisionPayload) => Promise<void>;

  /* Gate */
  fetchDashboard: () => Promise<void>;

  /* Gates setup */
  fetchGates: () => Promise<void>;
  createGate: (data: { name: string; location?: string; type: Gate["type"] }) => Promise<void>;
  updateGate: (id: string, data: { name?: string; location?: string; type?: Gate["type"]; isActive?: boolean }) => Promise<void>;

  /* Hostels */
  fetchHostels: () => Promise<void>;
  createHostel: (data: CreateHostelPayload) => Promise<void>;
  updateHostel: (id: string, data: UpdateHostelPayload) => Promise<void>;
  setHostelHousemother: (id: string, housemotherId: string) => Promise<void>;
  removeHostel: (id: string) => Promise<void>;
  assignStudents: (data: { hostelId: string | null; studentIds: string[] }) => Promise<number>;

  /* Housemothers */
  fetchHousemothers: () => Promise<void>;
  createHousemother: (data: CreateHousemotherPayload) => Promise<{ userCode: string; userName: string }>;
  updateHousemother: (id: string, data: UpdateHousemotherPayload) => Promise<void>;
  setHousemotherStatus: (id: string, active: boolean) => Promise<void>;

  /* Clear */
  reset: () => void;
}

const initialLoading: Record<LoadKey, boolean> = {
  myRequests: false,
  allRequests: false,
  approvals: false,
  dashboard: false,
  gates: false,
  hostels: false,
  housemothers: false,
};

const initialData = {
  myRequests: [] as MovementRequest[],
  myTotal: 0,
  allRequests: [] as MovementRequest[],
  allTotal: 0,
  pendingHousemother: [] as MovementRequest[],
  pendingFinal: [] as MovementRequest[],
  dashboard: null as GateDashboard | null,
  gates: [] as Gate[],
  hostels: [] as Hostel[],
  housemothers: [] as Housemother[],
};

/* =========================
   ZUSTAND STORE
========================= */

export const useGatepassStore = create<GatepassStore>((set, get) => {
  /** Runs a fetch with its own loading flag. */
  const track = async <T>(key: LoadKey, task: () => Promise<T>): Promise<T> => {
    set((s) => ({ loading: { ...s.loading, [key]: true } }));

    try {
      return await task();
    } finally {
      set((s) => ({ loading: { ...s.loading, [key]: false } }));
    }
  };

  return {
    ...initialData,
    loading: initialLoading,

    // ======================
    // Requests
    // ======================

    fetchMyRequests: (params) =>
      track("myRequests", async () => {
        const res = await gatepassService.movement.mine(params);
        set({ myRequests: res.items ?? [], myTotal: res.total ?? 0 });
      }),

    fetchAllRequests: (params) =>
      track("allRequests", async () => {
        const res = await gatepassService.movement.all(params);
        set({ allRequests: res.items ?? [], allTotal: res.total ?? 0 });
      }),

    createRequest: async (data) => {
      const created = await gatepassService.movement.create(data);
      await get().fetchMyRequests();
      return created;
    },

    cancelRequest: async (id) => {
      await gatepassService.movement.cancel(id);
      await get().fetchMyRequests();
    },

    revokeRequest: async (id) => {
      await gatepassService.movement.revoke(id);
      await get().fetchAllRequests();
    },

    // ======================
    // Approvals
    // ======================

    fetchPendingHousemother: () =>
      track("approvals", async () => {
        set({ pendingHousemother: (await gatepassService.movement.pendingHousemother()) ?? [] });
      }),

    fetchPendingFinal: () =>
      track("approvals", async () => {
        set({ pendingFinal: (await gatepassService.movement.pendingFinal()) ?? [] });
      }),

    housemotherDecision: async (id, data) => {
      await gatepassService.movement.housemotherDecision(id, data);
      await get().fetchPendingHousemother();
    },

    finalDecision: async (id, data) => {
      await gatepassService.movement.finalDecision(id, data);
      await Promise.all([get().fetchPendingFinal(), get().fetchAllRequests()]);
    },

    // ======================
    // Gate
    // ======================

    fetchDashboard: () =>
      track("dashboard", async () => {
        set({ dashboard: await gatepassService.gate.dashboard() });
      }),

    // ======================
    // Gates setup
    // ======================

    fetchGates: () =>
      track("gates", async () => {
        set({ gates: (await gatepassService.gates.getAll()) ?? [] });
      }),

    createGate: async (data) => {
      await gatepassService.gates.create(data);
      await get().fetchGates();
    },

    updateGate: async (id, data) => {
      await gatepassService.gates.update(id, data);
      await get().fetchGates();
    },

    // ======================
    // Hostels
    // ======================

    fetchHostels: () =>
      track("hostels", async () => {
        set({ hostels: (await gatepassService.hostel.hostels.getAll()) ?? [] });
      }),

    createHostel: async (data) => {
      await gatepassService.hostel.hostels.create(data);
      await get().fetchHostels();
    },

    updateHostel: async (id, data) => {
      await gatepassService.hostel.hostels.update(id, data);
      await get().fetchHostels();
    },

    setHostelHousemother: async (id, housemotherId) => {
      await gatepassService.hostel.hostels.setHousemother(id, housemotherId);
      await Promise.all([get().fetchHostels(), get().fetchHousemothers()]);
    },

    removeHostel: async (id) => {
      await gatepassService.hostel.hostels.remove(id);
      await get().fetchHostels();
    },

    assignStudents: async (data) => {
      const res = await gatepassService.hostel.students.assign(data);
      await get().fetchHostels();
      return res.moved;
    },

    // ======================
    // Housemothers
    // ======================

    fetchHousemothers: () =>
      track("housemothers", async () => {
        set({ housemothers: (await gatepassService.hostel.housemothers.getAll()) ?? [] });
      }),

    createHousemother: async (data) => {
      const res = await gatepassService.hostel.housemothers.create(data);
      await get().fetchHousemothers();
      return res.credentials;
    },

    updateHousemother: async (id, data) => {
      await gatepassService.hostel.housemothers.update(id, data);
      await get().fetchHousemothers();
    },

    setHousemotherStatus: async (id, active) => {
      await gatepassService.hostel.housemothers.setStatus(id, active);
      await Promise.all([get().fetchHousemothers(), get().fetchHostels()]);
    },

    // ======================
    // Clear
    // ======================

    reset: () => set({ ...initialData, loading: initialLoading }),
  };
});
