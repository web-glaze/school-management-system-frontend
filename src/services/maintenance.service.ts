// department.service.ts

import apiClient from "./api";

// ====================== DEPARTMENT ======================

export const departmentService = {
  getAll: () => apiClient.get("/departments"),

  create: (name: string) => apiClient.post("/departments", { name }),

  update: (id: string, name: string) => apiClient.patch(`/departments/${id}`, { name }),

  delete: (id: string) => apiClient.delete(`/departments/${id}`),
};

// ====================== Technicians ======================

export const technicianService = {
  getAll: () => apiClient.get("/technicians"),

  create: (name: string, phone: string, email: string, departmentId: string) => apiClient.post("/technicians", { name, phone, email, departmentId }),

  update: (id: string, name: string, phone: string, email: string, departmentId: string) => apiClient.patch(`/technicians/${id}`, { name, phone, email, departmentId }),

  delete: (id: string) => apiClient.delete(`/technicians/${id}`),
};

// ====================== Location ======================

export const locationService = {
  getAll: () => apiClient.get("/locations"),

  getDropdown: () => apiClient.get("/locations/dropdown"),

  create: (name: string, parentId?: string | null) =>
    apiClient.post("/locations", {
      name,
      parentId: parentId || null,
    }),

  update: (id: string, name: string, parentId?: string | null) =>
    apiClient.patch(`/locations/${id}`, {
      name,
      parentId,
    }),

  delete: (id: string) => apiClient.delete(`/locations/${id}`),
};

// ====================== Complaint / Ticket ======================

type ComplaintPayload = Record<string, unknown>;
export const complaintService = {
  getAll: () => apiClient.get("/complaints"),

  getById: (id: string) => apiClient.get(`/complaints/${id}`),

  getAssignOptions: () => apiClient.get("/complaints/assign-options"),

  create: (complaints: ComplaintPayload[]) => apiClient.post("/complaints", { complaints }),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/complaints/${id}`, data),
  delete: (id: string) => apiClient.delete(`/complaints/${id}`),
};

// ====================== Reports ======================

export const reportService = {
  getDashboard: (params?: Record<string, string>) => apiClient.get("/reports", { params }),

  getFilterOptions: () => apiClient.get("/reports/filter-options"),
};

// ====================== Generator ======================

export interface CreateGeneratorPayload {
  name: string;
  generatorNo: string;
  location?: string;
  capacity?: string;
  manufacturer?: string;
  isActive?: boolean;
}

export type UpdateGeneratorPayload = Partial<CreateGeneratorPayload>;

export interface CreateRunningLogPayload {
  date: string;
  startTime: string;
  stopTime: string;
  totalRunningHours: number;
  remarks?: string;
}

export interface CreateDieselLogPayload {
  date: string;
  dieselRefilled: number;
  remarks?: string;
}

export interface CreateCoolantLogPayload {
  date: string;
  coolantLevel: "FULL" | "LOW" | "REFILLED";
  quantityAdded?: number;
  remarks?: string;
}

export interface CreateFuelStockPayload {
  date: string;
  quantity: number;
  remarks?: string;
}

export interface CreateCoolantLogPayload {
  date: string;
  coolantLevel: "FULL" | "LOW" | "REFILLED";
  quantityAdded?: number;
  remarks?: string;
}

export const generatorService = {
  getAll: () => apiClient.get("/generator"),

  getById: (id: string) => apiClient.get(`/generator/${id}`),

  create: (payload: CreateGeneratorPayload) => apiClient.post("/generator", payload),

  update: (id: string, payload: UpdateGeneratorPayload) => apiClient.patch(`/generator/${id}`, payload),

  delete: (id: string) => apiClient.delete(`/generator/${id}`),

  // Running Log
  getRunningLogs: (generatorId: string) => apiClient.get(`/generator/${generatorId}/running-logs`),
  addRunningLog: (generatorId: string, payload: CreateRunningLogPayload) => apiClient.post(`/generator/${generatorId}/running-logs`, payload),
  deleteRunningLog: (logId: string) => apiClient.delete(`/generator/running-logs/${logId}`),

  // Diesel Log
  getDieselLogs: (generatorId: string) => apiClient.get(`/generator/${generatorId}/diesel-logs`),
  addDieselLog: (generatorId: string, payload: CreateDieselLogPayload) => apiClient.post(`/generator/${generatorId}/diesel-logs`, payload),
  deleteDieselLog: (logId: string) => apiClient.delete(`/generator/diesel-logs/${logId}`),

  // Coolant Log
  getCoolantLogs: (generatorId: string) => apiClient.get(`/generator/${generatorId}/coolant-logs`),
  addCoolantLog: (generatorId: string, payload: CreateCoolantLogPayload) => apiClient.post(`/generator/${generatorId}/coolant-logs`, payload),
  deleteCoolantLog: (logId: string) => apiClient.delete(`/generator/coolant-logs/${logId}`),

  // Fuel Stock (site-wide)
  getFuelStock: () => apiClient.get("/generator/fuel-stock/current"),
  getFuelStockTimeline: () => apiClient.get("/generator/fuel-stock/timeline"),
  addFuelStock: (payload: CreateFuelStockPayload) => apiClient.post("/generator/fuel-stock", payload),
};