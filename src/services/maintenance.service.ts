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
