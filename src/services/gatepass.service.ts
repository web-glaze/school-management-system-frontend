import type { AxiosResponse } from "axios";
import apiClient from "./api";

/* =========================
   HELPERS
========================= */

/** The API wraps responses as { data }, so this returns the inner payload. */
const unwrap = <T>(request: Promise<AxiosResponse>) => request.then((res) => (res.data?.data ?? res.data) as T);

/* =========================
   TYPES
========================= */

export type MovementType = "OUTPASS" | "EVENT_TRIP";

export type MovementStatus = "PENDING_HOUSEMOTHER" | "PENDING_PCH" | "APPROVED" | "REJECTED" | "CANCELLED" | "OUT" | "RETURNED" | "OVERDUE" | "EXPIRED";

export interface Option {
  id: string;
  name: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
}

/** What the raise-request screen shows after the admission number is entered. */
export interface StudentCard {
  id: string;
  admissionNo: string;
  name: string;
  photoUrl: string | null;
  className: string | null;
  sectionName: string | null;
  hostelName: string | null;
  roomNo: string | null;
  housemotherName: string | null;
}

export interface StudentLookupParams {
  admissionNo?: string;
  q?: string;
  classId?: string;
  sectionId?: string;
}

export interface PickupPersonPayload {
  name: string;
  relation: string;
  phone?: string;
  idProofType: string;
  idProofNumber?: string;
  idProofUrl: string;
}

export interface CreateMovementRequestPayload {
  type: MovementType;
  studentIds: string[];
  requestedFrom: string;
  requestedTo: string;
  purpose?: string;
  destination?: string;
  accompanyingPerson?: string;
  pickupPersons?: PickupPersonPayload[];
}

export interface DecisionPayload {
  action: "APPROVED" | "REJECTED";
  remarks?: string;
}

export interface RequestStudent {
  id: string;
  studentId: string;
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
    hostel?: {
      id: string;
      name: string;
      warden?: { firstName: string; lastName: string } | null;
    } | null;
    room?: { roomNo: string } | null;
    enrollments?: {
      class: { name: string };
      section: { name: string };
    }[];
  };
}

export interface PickupPerson {
  id: string;
  name: string;
  relation: string;
  phone?: string | null;
  idProofType: string;
  idProofNumber?: string | null;
  idProofUrl: string;
}

export interface RequestApproval {
  id: string;
  stage: "HOUSEMOTHER" | "PCH";
  action: "PENDING" | "APPROVED" | "REJECTED";
  remarks?: string | null;
  actedAt?: string | null;
  housemotherUser?: { id: string; name: string | null } | null;
  approver?: { id: string; name: string | null } | null;
}

export interface MovementRequest {
  id: string;
  requestNo: string;
  type: MovementType;
  status: MovementStatus;
  requestedFrom: string;
  requestedTo: string;
  purpose?: string | null;
  destination?: string | null;
  accompanyingPerson?: string | null;
  approvedAt?: string | null;
  actualExitAt?: string | null;
  actualReturnAt?: string | null;
  createdAt: string;
  raisedBy?: { id: string; name: string | null };
  students: RequestStudent[];
  pickupPersons?: PickupPerson[];
  approvals?: RequestApproval[];
  pass?: {
    id: string;
    status: string;
    validFrom?: string;
    validTo?: string;
  } | null;
}

export interface QrResponse {
  requestId: string;
  requestNo: string;
  passId: string;
  qrToken: string;
  validFrom: string;
  validTo: string;
  status: string;
}

export interface DecisionResult {
  requestId: string;
  status: MovementStatus;
}

/* gate */

export interface Gate {
  id: string;
  name: string;
  location?: string | null;
  type: "MAIN" | "HOSTEL" | "SERVICE";
  isActive?: boolean;
}

export interface GateRequestSummary {
  requestId: string;
  requestNo: string;
  type: MovementType;
  status: MovementStatus;
  purpose?: string | null;
  destination?: string | null;
  accompanyingPerson?: string | null;
  requestedFrom: string;
  requestedTo: string;
  actualExitAt?: string | null;
  students: StudentCard[];
  pickupPersons: PickupPerson[];
}

export interface GateLookupResult {
  valid: boolean;
  action: "EXIT" | "RETURN" | null;
  result?: string;
  message: string;
  request: GateRequestSummary | null;
}

export interface GateScanPayload {
  qrToken: string;
  gateId: string;
  pickupPersonId?: string;
}

export interface GateScanResult {
  allowed: boolean;
  result: string;
  message: string;
  action?: "EXIT" | "RETURN";
  direction?: "IN" | "OUT";
  late?: boolean;
  logId: string | null;
  requestNo?: string;
  students?: StudentCard[];
  request?: GateRequestSummary | null;
}

export interface GateDashboard {
  outNow: {
    id: string;
    requestNo: string;
    type: MovementType;
    status: MovementStatus;
    destination?: string | null;
    accompanyingPerson?: string | null;
    requestedTo: string;
    actualExitAt?: string | null;
    students: {
      student: {
        id: string;
        admissionNo: string;
        firstName: string;
        lastName: string;
        photoUrl?: string | null;
      };
    }[];
  }[];
  overdueCount: number;
  todayExits: number;
  todayReturns: number;
  todayDenied: number;
  recent: {
    id: string;
    direction: "IN" | "OUT";
    scanTime: string;
    result: string;
    gate?: { name: string };
    scannedBy?: { name: string | null };
    pickupPerson?: { name: string; relation: string } | null;
    pass?: {
      movementRequest: {
        requestNo: string;
        type: MovementType;
        students: {
          student: {
            admissionNo: string;
            firstName: string;
            lastName: string;
          };
        }[];
      };
    };
  }[];
}

/* hostel */

export interface Hostel {
  id: string;
  name: string;
  type: "BOYS" | "GIRLS" | "JUNIOR";
  capacity: number;
  studentCount: number;
  housemother: { id: string; name: string; phone?: string | null } | null;
}

export interface Housemother {
  id: string;
  userId: string;
  employeeNo: string;
  name: string;
  phone?: string | null;
  status: "ACTIVE" | "ON_LEAVE" | "RESIGNED";
  user: {
    id: string;
    userCode: string;
    userName: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    mustResetPassword: boolean;
  };
  hostels: { id: string; name: string }[];
}

export interface HostelStudent {
  id: string;
  admissionNo: string;
  name: string;
  photoUrl: string | null;
  className: string | null;
  sectionName: string | null;
  hostelId: string | null;
  hostelName: string | null;
}

export interface CreateHostelPayload {
  name: string;
  type?: "BOYS" | "GIRLS" | "JUNIOR";
  capacity?: number;
  housemotherId?: string;
}

export interface UpdateHostelPayload {
  name?: string;
  type?: "BOYS" | "GIRLS" | "JUNIOR";
  capacity?: number;
}

export interface CreateHousemotherPayload {
  name: string;
  email: string;
  phone: string;
  userName: string;
  password: string;
}

export interface UpdateHousemotherPayload {
  name: string;
  email: string;
  phone: string;
}

export interface HostelStudentParams {
  hostelId?: string;
  unassigned?: boolean;
  classId?: string;
  sectionId?: string;
  q?: string;
}

/* =========================
   SERVICE
========================= */

/** Local storage returns a relative URL, so it needs the backend host in front. */
export const mediaUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${url}`;
};

/** Uploads ID proof photos and returns their URLs, in the same order as the files. */
export async function uploadIdProofs(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await apiClient.post("/uploads/media", formData, {
    params: { folder: "gatepass" },
    headers: { "Content-Type": "multipart/form-data" },
  });

  const uploaded = (response.data?.data?.files ?? []) as { url: string }[];

  if (uploaded.length !== files.length) {
    throw new Error("Upload failed");
  }

  return uploaded.map((file) => file.url);
}

export const gatepassService = {
  movement: {
    options: () => unwrap<{ classes: Option[]; sections: Option[] }>(apiClient.get("/gatepass/movement/options")),

    students: (params: StudentLookupParams) => unwrap<StudentCard[]>(apiClient.get("/gatepass/movement/students", { params })),

    create: (data: CreateMovementRequestPayload) => unwrap<MovementRequest>(apiClient.post("/gatepass/movement/requests", data)),

    mine: (params?: ListParams) => unwrap<Paginated<MovementRequest>>(apiClient.get("/gatepass/movement/requests/mine", { params })),

    /** Everything, for the final approvers. */
    all: (params?: ListParams) => unwrap<Paginated<MovementRequest>>(apiClient.get("/gatepass/movement/requests", { params })),

    pendingHousemother: () => unwrap<MovementRequest[]>(apiClient.get("/gatepass/movement/requests/pending-housemother")),

    pendingFinal: () => unwrap<MovementRequest[]>(apiClient.get("/gatepass/movement/requests/pending-final")),

    getById: (id: string) => unwrap<MovementRequest>(apiClient.get(`/gatepass/movement/requests/${id}`)),

    getQr: (id: string) => unwrap<QrResponse>(apiClient.get(`/gatepass/movement/requests/${id}/qr`)),

    cancel: (id: string) => unwrap<MovementRequest>(apiClient.post(`/gatepass/movement/requests/${id}/cancel`)),

    housemotherDecision: (id: string, data: DecisionPayload) => unwrap<DecisionResult>(apiClient.post(`/gatepass/movement/requests/${id}/housemother-decision`, data)),

    finalDecision: (id: string, data: DecisionPayload) => unwrap<DecisionResult>(apiClient.post(`/gatepass/movement/requests/${id}/final-decision`, data)),

    revoke: (id: string) => unwrap<MovementRequest>(apiClient.post(`/gatepass/movement/requests/${id}/revoke`)),
  },

  gate: {
    gates: () => unwrap<Gate[]>(apiClient.get("/gate/gates")),

    lookup: (qrToken: string) => unwrap<GateLookupResult>(apiClient.post("/gate/lookup", { qrToken })),

    scan: (data: GateScanPayload) => unwrap<GateScanResult>(apiClient.post("/gate/scan", data)),

    dashboard: () => unwrap<GateDashboard>(apiClient.get("/gate/dashboard")),

    logsForStudent: (studentId: string) => unwrap<GateDashboard["recent"]>(apiClient.get(`/gate/logs/student/${studentId}`)),
  },

  gates: {
    getAll: () => unwrap<Gate[]>(apiClient.get("/gatepass/configuration/gates")),

    create: (data: { name: string; location?: string; type: Gate["type"] }) => unwrap<Gate>(apiClient.post("/gatepass/configuration/gates", data)),

    update: (
      id: string,
      data: {
        name?: string;
        location?: string;
        type?: Gate["type"];
        isActive?: boolean;
      }
    ) => unwrap<Gate>(apiClient.patch(`/gatepass/configuration/gates/${id}`, data)),
  },

  hostel: {
    hostels: {
      getAll: () => unwrap<Hostel[]>(apiClient.get("/gatepass/hostel/hostels")),

      create: (data: CreateHostelPayload) => unwrap<Hostel>(apiClient.post("/gatepass/hostel/hostels", data)),

      update: (id: string, data: UpdateHostelPayload) => unwrap<Hostel>(apiClient.patch(`/gatepass/hostel/hostels/${id}`, data)),

      setHousemother: (id: string, housemotherId: string) =>
        unwrap<Hostel>(
          apiClient.put(`/gatepass/hostel/hostels/${id}/housemother`, {
            housemotherId,
          })
        ),

      remove: (id: string) => unwrap<{ message: string }>(apiClient.delete(`/gatepass/hostel/hostels/${id}`)),
    },

    students: {
      getAll: (params: HostelStudentParams) => unwrap<HostelStudent[]>(apiClient.get("/gatepass/hostel/students", { params })),

      /** hostelId = null takes the students out of their hostel. */
      assign: (data: { hostelId: string | null; studentIds: string[] }) => unwrap<{ moved: number }>(apiClient.post("/gatepass/hostel/students/assign", data)),
    },

    housemothers: {
      getAll: () => unwrap<Housemother[]>(apiClient.get("/gatepass/hostel/housemothers")),

      create: (data: CreateHousemotherPayload) =>
        unwrap<{
          message: string;
          housemother: Housemother;
          credentials: { userCode: string; userName: string };
        }>(apiClient.post("/gatepass/hostel/housemothers", data)),

      update: (id: string, data: UpdateHousemotherPayload) => unwrap<Housemother>(apiClient.patch(`/gatepass/hostel/housemothers/${id}`, data)),

      setStatus: (id: string, active: boolean) => unwrap<{ message: string }>(apiClient.put(`/gatepass/hostel/housemothers/${id}/status/${active ? "active" : "inactive"}`)),

      generateUserName: (name: string) =>
        unwrap<string>(
          apiClient.get("/gatepass/hostel/housemothers/generate-username", {
            params: { name },
          })
        ),
    },
  },
};
