import apiClient from "./api";

/* =========================
   MOVEMENT
========================= */

export interface CreateMovementRequestPayload {
  requestTypeId: string;
  subjectType: "STUDENT" | "STAFF";
  subjectId: string;
  slotId?: string;
  requestedFrom: string;
  requestedTo: string;
  pickupId?: string;
  purpose?: string;
  destination?: string;
}

export interface ApprovalActionPayload {
  action: "APPROVED" | "REJECTED";
  remarks?: string;
}

export interface IssuePermanentPassPayload {
  holderType: "STUDENT" | "STAFF";
  holderId: string;
  validFrom: string;
  validTo: string;
}

/* =========================
   VISITOR
========================= */

export interface CreateVisitorPayload {
  fullName: string;
  phone: string;
  email?: string;
  idProofType?: string;
  idProofNumber?: string;
  photoUrl?: string;
  company?: string;
}

export interface CreateVisitorRequestPayload {
  visitorId: string;
  hostType: "STUDENT" | "STAFF";
  hostId: string;
  slotId?: string;
  purpose?: string;
  timeFrom: string;
  timeTo: string;
}

export interface VisitorScanPayload {
  deviceToken: string;
  qrToken: string;
  gateId: string;
  direction: "IN" | "OUT";
  badgeNo?: string;
}

/* =========================
   GATE SCAN
========================= */

export interface GoodsItemPayload {
  direction: "IN" | "OUT";
  description: string;
  quantity?: number;
  unit?: string;
  approxValue?: number;
}

export interface GateScanPayload {
  deviceToken: string;
  qrToken: string;
  direction: "IN" | "OUT";
  gateId: string;
  capturedPhotoUrl?: string;
  pickupId?: string;
  goods?: GoodsItemPayload[];
  scanTime?: string;
  isOfflineSync?: boolean;
}

/* =========================
   GATEPASS SERVICE
========================= */

export const gatepassService = {
  movement: {
    getAll: () =>
      apiClient.get("/gatepass/movement/requests"),

    getMine: () =>
      apiClient.get("/gatepass/movement/requests/mine"),

    getById: (id: string) =>
      apiClient.get(`/gatepass/movement/requests/${id}`),

    create: (data: CreateMovementRequestPayload) =>
      apiClient.post("/gatepass/movement/requests", data),

    cancel: (id: string) =>
      apiClient.post(`/gatepass/movement/requests/${id}/cancel`),

    getPendingApprovals: () =>
      apiClient.get(
        "/gatepass/movement/requests/pending-approvals",
      ),

    decision: (
      id: string,
      data: ApprovalActionPayload,
    ) =>
      apiClient.post(
        `/gatepass/movement/requests/${id}/decision`,
        data,
      ),
  },

  passes: {
    issuePermanent: (
      data: IssuePermanentPassPayload,
    ) =>
      apiClient.post(
        "/gatepass/passes/permanent",
        data,
      ),

    getQr: (id: string) =>
      apiClient.get(`/gatepass/passes/${id}/qr`),

    revoke: (id: string) =>
      apiClient.post(`/gatepass/passes/${id}/revoke`),

    getByHolder: (holderId: string) =>
      apiClient.get(
        `/gatepass/passes/holder/${holderId}`,
      ),
  },

  visitors: {
    getAll: () =>
      apiClient.get("/gatepass/visitors"),

    create: (data: CreateVisitorPayload) =>
      apiClient.post(
        "/gatepass/visitors",
        data,
      ),

    getRequests: () =>
      apiClient.get(
        "/gatepass/visitors/requests",
      ),

    createRequest: (
      data: CreateVisitorRequestPayload,
    ) =>
      apiClient.post(
        "/gatepass/visitors/requests",
        data,
      ),

    approveRequest: (id: string) =>
      apiClient.post(
        `/gatepass/visitors/requests/${id}/approve`,
      ),

    rejectRequest: (id: string) =>
      apiClient.post(
        `/gatepass/visitors/requests/${id}/reject`,
      ),

    scan: (data: VisitorScanPayload) =>
      apiClient.post(
        "/gatepass/visitors/scan",
        data,
      ),
  },

  gateScan: {
    scan: (data: GateScanPayload) =>
      apiClient.post("/gate/scan", data),

    dashboard: () =>
      apiClient.get("/gate/dashboard"),

    logsForHolder: (holderId: string) =>
      apiClient.get(
        `/gate/logs/holder/${holderId}`,
      ),
  },

  configuration: {
    requestTypes: {
      create: (data: unknown) =>
        apiClient.post(
          "/gatepass/configuration/request-types",
          data,
        ),

      getAll: () =>
        apiClient.get(
          "/gatepass/configuration/request-types",
        ),
    },

    gates: {
      create: (data: unknown) =>
        apiClient.post(
          "/gatepass/configuration/gates",
          data,
        ),

      getAll: () =>
        apiClient.get(
          "/gatepass/configuration/gates",
        ),
    },

    devices: {
      create: (data: unknown) =>
        apiClient.post(
          "/gatepass/configuration/devices",
          data,
        ),

      getAll: () =>
        apiClient.get(
          "/gatepass/configuration/devices",
        ),
    },

    slots: {
      create: (data: unknown) =>
        apiClient.post(
          "/gatepass/configuration/slots",
          data,
        ),

      getAll: () =>
        apiClient.get(
          "/gatepass/configuration/slots",
        ),
    },

    blacklist: {
      create: (data: unknown) =>
        apiClient.post(
          "/gatepass/configuration/blacklist",
          data,
        ),

      getAll: () =>
        apiClient.get(
          "/gatepass/configuration/blacklist",
        ),

      remove: (id: string) =>
        apiClient.delete(
          `/gatepass/configuration/blacklist/${id}`,
        ),
    },
  },

  pickup: {
    create: (data: unknown) =>
      apiClient.post(
        "/authorized-pickups",
        data,
      ),

    getByStudent: (studentId: string) =>
      apiClient.get(
        `/authorized-pickups/student/${studentId}`,
      ),

    remove: (id: string) =>
      apiClient.delete(
        `/authorized-pickups/${id}`,
      ),
  },
};