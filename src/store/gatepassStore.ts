import { create } from "zustand";

import {
  gatepassService,
  CreateMovementRequestPayload,
  ApprovalActionPayload,
  IssuePermanentPassPayload,
  CreateVisitorPayload,
  CreateVisitorRequestPayload,
  VisitorScanPayload,
  GateScanPayload,
} from "@/services/gatepass.service";

/* =========================
   TYPES
========================= */

export interface MovementRequest {
  id: string;
  requestNo: string;
  requestTypeId: string;
  subjectType: "STUDENT" | "STAFF";
  subjectId: string;
  raisedById: string;
  slotId?: string | null;
  requestedFrom: string;
  requestedTo: string;
  pickupId?: string | null;
  purpose?: string | null;
  destination?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  requestType?: unknown;
  slot?: unknown;
  pickup?: unknown;
  approvals?: unknown[];
  pass?: GatePass | null;
  goods?: unknown[];
}

export interface GatePass {
  id: string;
  schoolId: string;
  movementRequestId?: string | null;
  passType: string;
  holderType: "STUDENT" | "STAFF";
  holderId: string;
  validFrom: string;
  validTo: string;
  version: number;
  signature: string;
  maxUses?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visitor {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  idProofType?: string | null;
  idProofNumber?: string | null;
  photoUrl?: string | null;
  company?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorRequest {
  id: string;
  visitorId: string;
  hostType: "STUDENT" | "STAFF";
  hostId: string;
  slotId?: string | null;
  purpose?: string | null;
  timeFrom: string;
  timeTo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  visitor?: Visitor;
}

export interface QrTokenResponse {
  passId: string;
  qrToken: string;
  passType: string;
  validFrom: string;
  validTo: string;
  status: string;
}

/* =========================
   STORE
========================= */

interface GatepassStore {
  movementRequests: MovementRequest[];
  pendingApprovals: MovementRequest[];
  passes: GatePass[];
  visitors: Visitor[];
  visitorRequests: VisitorRequest[];

  loading: boolean;

  /* Movement */
  fetchMovementRequests: () => Promise<void>;
  fetchMyMovementRequests: () => Promise<void>;
  fetchMovementRequest: (
    id: string,
  ) => Promise<MovementRequest | null>;
  createMovementRequest: (
    data: CreateMovementRequestPayload,
  ) => Promise<void>;
  cancelMovementRequest: (id: string) => Promise<void>;
  fetchPendingApprovals: () => Promise<void>;
  decideMovementRequest: (
    id: string,
    data: ApprovalActionPayload,
  ) => Promise<void>;

  /* Passes */
  issuePermanentPass: (
    data: IssuePermanentPassPayload,
  ) => Promise<void>;
  fetchPassQr: (
    id: string,
  ) => Promise<QrTokenResponse | null>;
  revokePass: (id: string) => Promise<void>;
  fetchPassesByHolder: (
    holderId: string,
  ) => Promise<void>;

  /* Visitors */
  fetchVisitors: () => Promise<void>;
  createVisitor: (
    data: CreateVisitorPayload,
  ) => Promise<void>;
  fetchVisitorRequests: () => Promise<void>;
  createVisitorRequest: (
    data: CreateVisitorRequestPayload,
  ) => Promise<void>;
  approveVisitorRequest: (
    id: string,
  ) => Promise<void>;
  rejectVisitorRequest: (
    id: string,
  ) => Promise<void>;
  scanVisitor: (
    data: VisitorScanPayload,
  ) => Promise<void>;

  /* Gate Scan */
  gateScan: (
    data: GateScanPayload,
  ) => Promise<void>;

  /* Clear */
  clearMovementRequests: () => void;
  clearPendingApprovals: () => void;
  clearPasses: () => void;
  clearVisitors: () => void;
  clearVisitorRequests: () => void;
}

/* =========================
   ZUSTAND STORE
========================= */

export const useGatepassStore =
  create<GatepassStore>((set, get) => ({
    movementRequests: [],
    pendingApprovals: [],
    passes: [],
    visitors: [],
    visitorRequests: [],

    loading: false,

    // ======================
    // Movement Requests
    // ======================

    fetchMovementRequests: async () => {
      try {
        set({ loading: true });

        const response =
          await gatepassService.movement.getAll();

        set({
          movementRequests:
            response.data.data ?? [],
        });
      } catch (error) {
        console.error(
          "Failed to fetch movement requests",
          error,
        );
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    fetchMyMovementRequests: async () => {
      try {
        set({ loading: true });

        const response =
          await gatepassService.movement.getMine();

        set({
          movementRequests:
            response.data.data ?? [],
        });
      } catch (error) {
        console.error(
          "Failed to fetch my movement requests",
          error,
        );
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    fetchMovementRequest: async (id) => {
      try {
        const response =
          await gatepassService.movement.getById(id);

        return response.data.data ?? null;
      } catch (error) {
        console.error(
          "Failed to fetch movement request",
          error,
        );
        throw error;
      }
    },

    createMovementRequest: async (data) => {
      try {
        await gatepassService.movement.create(data);
        await get().fetchMovementRequests();
      } catch (error) {
        throw error;
      }
    },

    cancelMovementRequest: async (id) => {
      try {
        await gatepassService.movement.cancel(id);
        await get().fetchMovementRequests();
      } catch (error) {
        throw error;
      }
    },

    fetchPendingApprovals: async () => {
      try {
        set({ loading: true });

        const response =
          await gatepassService.movement.getPendingApprovals();

        set({
          pendingApprovals:
            response.data.data ?? [],
        });
      } catch (error) {
        console.error(
          "Failed to fetch pending approvals",
          error,
        );
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    decideMovementRequest: async (
      id,
      data,
    ) => {
      try {
        await gatepassService.movement.decision(
          id,
          data,
        );

        await get().fetchMovementRequests();
        await get().fetchPendingApprovals();
      } catch (error) {
        throw error;
      }
    },

    // ======================
    // Passes
    // ======================

    issuePermanentPass: async (data) => {
      try {
        await gatepassService.passes.issuePermanent(
          data,
        );
      } catch (error) {
        throw error;
      }
    },

    fetchPassQr: async (id) => {
      try {
        const response =
          await gatepassService.passes.getQr(id);

        return response.data.data ?? null;
      } catch (error) {
        console.error(
          "Failed to fetch pass QR",
          error,
        );
        throw error;
      }
    },

    revokePass: async (id) => {
      try {
        await gatepassService.passes.revoke(id);
        await get().fetchMovementRequests();
      } catch (error) {
        throw error;
      }
    },

    fetchPassesByHolder: async (
      holderId,
    ) => {
      try {
        set({ loading: true });

        const response =
          await gatepassService.passes.getByHolder(
            holderId,
          );

        set({
          passes:
            response.data.data ?? [],
        });
      } catch (error) {
        console.error(
          "Failed to fetch passes",
          error,
        );
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    // ======================
    // Visitors
    // ======================

    fetchVisitors: async () => {
      try {
        set({ loading: true });

        const response =
          await gatepassService.visitors.getAll();

        set({
          visitors:
            response.data.data ?? [],
        });
      } catch (error) {
        console.error(
          "Failed to fetch visitors",
          error,
        );
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    createVisitor: async (data) => {
      try {
        await gatepassService.visitors.create(data);
        await get().fetchVisitors();
      } catch (error) {
        throw error;
      }
    },

    fetchVisitorRequests: async () => {
      try {
        set({ loading: true });

        const response =
          await gatepassService.visitors.getRequests();

        set({
          visitorRequests:
            response.data.data ?? [],
        });
      } catch (error) {
        console.error(
          "Failed to fetch visitor requests",
          error,
        );
        throw error;
      } finally {
        set({ loading: false });
      }
    },

    createVisitorRequest: async (data) => {
      try {
        await gatepassService.visitors.createRequest(
          data,
        );

        await get().fetchVisitorRequests();
      } catch (error) {
        throw error;
      }
    },

    approveVisitorRequest: async (id) => {
      try {
        await gatepassService.visitors.approveRequest(
          id,
        );

        await get().fetchVisitorRequests();
      } catch (error) {
        throw error;
      }
    },

    rejectVisitorRequest: async (id) => {
      try {
        await gatepassService.visitors.rejectRequest(
          id,
        );

        await get().fetchVisitorRequests();
      } catch (error) {
        throw error;
      }
    },

    scanVisitor: async (data) => {
      try {
        await gatepassService.visitors.scan(data);
      } catch (error) {
        throw error;
      }
    },

    // ======================
    // Gate Scan
    // ======================

    gateScan: async (data) => {
      try {
        await gatepassService.gateScan.scan(data);
      } catch (error) {
        throw error;
      }
    },

    // ======================
    // Clear
    // ======================

    clearMovementRequests: () =>
      set({
        movementRequests: [],
      }),

    clearPendingApprovals: () =>
      set({
        pendingApprovals: [],
      }),

    clearPasses: () =>
      set({
        passes: [],
      }),

    clearVisitors: () =>
      set({
        visitors: [],
      }),

    clearVisitorRequests: () =>
      set({
        visitorRequests: [],
      }),
  }));