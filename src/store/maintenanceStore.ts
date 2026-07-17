import { create } from "zustand";
import {
  departmentService,
  technicianService,
  locationService,
  complaintService,
  reportService,
  generatorService,
  type CreateGeneratorPayload,
  type UpdateGeneratorPayload,
  type CreateRunningLogPayload,
  type CreateDieselLogPayload,
  type CreateCoolantLogPayload,
} from "@/services/maintenance.service";
// ====================== Department ======================

export interface Department {
  id: string;
  name: string;
  departmentCode?: string;
  createdAt: string;
}
interface DepartmentState {
  departments: Department[];
  loading: boolean;

  fetchDepartments: () => Promise<void>;
  createDepartment: (name: string) => Promise<void>;
  updateDepartment: (id: string, name: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
}

export const useDepartmentStore = create<DepartmentState>((set) => ({
  departments: [],
  loading: false,

  fetchDepartments: async () => {
    try {
      set({ loading: true });
      const response = await departmentService.getAll();

      if (!response) return;

      set({
        departments: response.data?.data || response.data || [],
      });
    } catch {
      // interceptor handles redirect
    } finally {
      set({ loading: false });
    }
  },

  createDepartment: async (name) => {
    try {
      set({ loading: true });
      await departmentService.create(name);
      await useDepartmentStore.getState().fetchDepartments();
    } finally {
      set({ loading: false });
    }
  },

  updateDepartment: async (id, name) => {
    try {
      set({ loading: true });
      await departmentService.update(id, name);
      await useDepartmentStore.getState().fetchDepartments();
    } finally {
      set({ loading: false });
    }
  },

  deleteDepartment: async (id) => {
    try {
      set({ loading: true });
      await departmentService.delete(id);
      await useDepartmentStore.getState().fetchDepartments();
    } finally {
      set({ loading: false });
    }
  },
}));

// ====================== Technician ======================

export interface Technician {
  id: string;
  technicianCode: string;
  email: string;
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  department?: {
    id: string;
    name: string;
    departmentCode?: string;
  };
}

interface TechnicianState {
  technicians: Technician[];
  loading: boolean;

  fetchTechnicians: () => Promise<void>;
  createTechnician: (name: string, phone: string, email: string, departmentId: string) => Promise<void>;
  updateTechnician: (id: string, name: string, phone: string, email: string, departmentId: string) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
}

export const useTechnicianStore = create<TechnicianState>((set) => ({
  technicians: [],
  loading: false,

  fetchTechnicians: async () => {
    try {
      set({ loading: true });
      const response = await technicianService.getAll();

      if (!response) return;

      set({
        technicians: response.data?.data || response.data || [],
      });
    } catch {
      // interceptor handles redirect
    } finally {
      set({ loading: false });
    }
  },

  createTechnician: async (name, phone, email, departmentId) => {
    try {
      set({ loading: true });
      await technicianService.create(name, phone, email, departmentId);
      await useTechnicianStore.getState().fetchTechnicians();
    } finally {
      set({ loading: false });
    }
  },

  updateTechnician: async (id, name, phone, email, departmentId) => {
    try {
      set({ loading: true });
      await technicianService.update(id, name, phone, email, departmentId);
      await useTechnicianStore.getState().fetchTechnicians();
    } finally {
      set({ loading: false });
    }
  },

  deleteTechnician: async (id) => {
    try {
      set({ loading: true });
      await technicianService.delete(id);
      await useTechnicianStore.getState().fetchTechnicians();
    } finally {
      set({ loading: false });
    }
  },
}));

// ====================== Location ======================

export interface Location {
  id: string;
  name: string;
  parentId?: string | null;
}

interface LocationState {
  locations: Location[];
  loading: boolean;

  fetchLocations: () => Promise<void>;
  createLocation: (name: string, parentId?: string | null) => Promise<void>;
  updateLocation: (id: string, name: string, parentId?: string | null) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  locations: [],
  loading: false,

  fetchLocations: async () => {
    try {
      set({ loading: true });
      const response = await locationService.getAll();

      if (!response) return;

      set({
        locations: response.data?.data || response.data || [],
      });
    } catch {
      // interceptor handles redirect
    } finally {
      set({ loading: false });
    }
  },

  createLocation: async (name, parentId) => {
    try {
      set({ loading: true });
      await locationService.create(name, parentId);
      await useLocationStore.getState().fetchLocations();
    } finally {
      set({ loading: false });
    }
  },

  updateLocation: async (id, name, parentId) => {
    try {
      set({ loading: true });
      await locationService.update(id, name, parentId);
      await useLocationStore.getState().fetchLocations();
    } finally {
      set({ loading: false });
    }
  },

  deleteLocation: async (id) => {
    try {
      set({ loading: true });
      await locationService.delete(id);
      await useLocationStore.getState().fetchLocations();
    } finally {
      set({ loading: false });
    }
  },
}));

// ====================== Complaint / Ticket ======================

export interface Complaint {
  id: string;
  title: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: string;
  status: string;
  managerRemark?: string;
  createdAt: string;
  user?: { email: string };
  assignedTechnician?: { id: string; name: string };
  department?: { id: string; name: string };
  ticketCode?: string;
  attachments?: {
    id: string;
    url: string;
    type: "IMAGE" | "VIDEO";
    owner: "USER" | "ADMIN";
    createdAt?: string;
  }[];

  activities?: {
    id: string;
    action: string;
    message?: string;
    oldValue?: string;
    newValue?: string;
    createdAt: string;

    createdBy?: {
      id: string;
      name?: string;
      userCode?: string;
    };

    attachments?: {
      id: string;
      url: string;
      type: "IMAGE" | "VIDEO";
    }[];
  }[];
}

interface ComplaintState {
  complaints: Complaint[];
  loading: boolean;

  fetchComplaints: () => Promise<void>;
  createComplaints: (complaints: Record<string, unknown>[]) => Promise<void>;
  updateComplaint: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;
}

export const useComplaintStore = create<ComplaintState>((set) => ({
  complaints: [],
  loading: false,

  fetchComplaints: async () => {
    try {
      set({ loading: true });
      const response = await complaintService.getAll();

      if (!response) return;

      set({
        complaints: response.data?.data || response.data || [],
      });
    } catch {
      // interceptor handles redirect
    } finally {
      set({ loading: false });
    }
  },

  createComplaints: async (complaints: Record<string, unknown>[]) => {
    try {
      set({ loading: true });
      await complaintService.create(complaints);
      await useComplaintStore.getState().fetchComplaints();
    } finally {
      set({ loading: false });
    }
  },

  updateComplaint: async (id: string, data: Record<string, unknown>) => {
    try {
      set({ loading: true });
      await complaintService.update(id, data);
      await useComplaintStore.getState().fetchComplaints();
    } finally {
      set({ loading: false });
    }
  },

  deleteComplaint: async (id) => {
    try {
      set({ loading: true });
      await complaintService.delete(id);
      await useComplaintStore.getState().fetchComplaints();
    } finally {
      set({ loading: false });
    }
  },
}));

// ====================== Reports ======================
interface FilterOptions {
  departments: {
    id: string;
    name: string;
  }[];

  technicians: {
    id: string;
    name: string;
  }[];

  locations: string[];

  statuses: string[];

  priorities: string[];
}

interface ReportState {
  report: any;
  filters: FilterOptions | null;

  loading: boolean;

  fetchReports: (params?: Record<string, string>) => Promise<void>;

  fetchFilterOptions: () => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  report: null,

  filters: null,

  loading: false,

  fetchReports: async (params) => {
    try {
      set({ loading: true });

      const res = await reportService.getDashboard(params);

      set({
        report: res.data.data ?? res.data,
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchFilterOptions: async () => {
    const res = await reportService.getFilterOptions();

    set({
      filters: res.data.data ?? res.data,
    });
  },
}));

// ====================== Generator ======================

export interface Generator {
  id: string;
  name: string;
  generatorCode: string;
  generatorNo: string;
  location?: string;
  capacity?: string;
  manufacturer?: string;
  isActive: boolean;
  createdAt: string;
  latestFuelStock?: number | null;
  latestFuelStockUpdatedAt?: string | null;
}

export interface GeneratorRunningLog {
  id: string;
  date: string;
  startTime: string;
  stopTime: string;
  totalRunningHours: number;
  remarks?: string;
  createdAt: string;
}

export interface DieselConsumptionLog {
  id: string;
  date: string;
  dieselRefilled: number;
  fuelLeftInStock: number;
  remarks?: string;
  createdAt: string;
}

export interface CoolantLevelLog {
  id: string;
  date: string;
  coolantLevel: "FULL" | "LOW" | "REFILLED";
  quantityAdded?: number;
  remarks?: string;
  createdAt: string;
}

interface GeneratorState {
  generators: Generator[];
  loading: boolean;

  runningLogs: GeneratorRunningLog[];
  dieselLogs: DieselConsumptionLog[];
  coolantLogs: CoolantLevelLog[];
  logsLoading: boolean;

  fetchGenerators: () => Promise<void>;
  createGenerator: (payload: CreateGeneratorPayload) => Promise<void>;
  updateGenerator: (id: string, payload: UpdateGeneratorPayload) => Promise<void>;
  deleteGenerator: (id: string) => Promise<void>;

  fetchRunningLogs: (generatorId: string) => Promise<void>;
  addRunningLog: (generatorId: string, payload: CreateRunningLogPayload) => Promise<void>;
  deleteRunningLog: (generatorId: string, logId: string) => Promise<void>;

  fetchDieselLogs: (generatorId: string) => Promise<void>;
  addDieselLog: (generatorId: string, payload: CreateDieselLogPayload) => Promise<void>;
  deleteDieselLog: (generatorId: string, logId: string) => Promise<void>;

  fetchCoolantLogs: (generatorId: string) => Promise<void>;
  addCoolantLog: (generatorId: string, payload: CreateCoolantLogPayload) => Promise<void>;
  deleteCoolantLog: (generatorId: string, logId: string) => Promise<void>;
}

export const useGeneratorStore = create<GeneratorState>((set) => ({
  generators: [],
  loading: false,

  runningLogs: [],
  dieselLogs: [],
  coolantLogs: [],
  logsLoading: false,

  fetchGenerators: async () => {
    try {
      set({ loading: true });
      const response = await generatorService.getAll();
      if (!response) return;
      set({ generators: response.data?.data || response.data || [] });
    } catch {
      // interceptor handles redirect
    } finally {
      set({ loading: false });
    }
  },

  createGenerator: async (payload) => {
    try {
      set({ loading: true });
      await generatorService.create(payload);
      await useGeneratorStore.getState().fetchGenerators();
    } finally {
      set({ loading: false });
    }
  },

  updateGenerator: async (id, payload) => {
    try {
      set({ loading: true });
      await generatorService.update(id, payload);
      await useGeneratorStore.getState().fetchGenerators();
    } finally {
      set({ loading: false });
    }
  },

  deleteGenerator: async (id) => {
    try {
      set({ loading: true });
      await generatorService.delete(id);
      await useGeneratorStore.getState().fetchGenerators();
    } finally {
      set({ loading: false });
    }
  },

  fetchRunningLogs: async (generatorId) => {
    try {
      set({ logsLoading: true });
      const response = await generatorService.getRunningLogs(generatorId);
      set({ runningLogs: response.data?.data || response.data || [] });
    } finally {
      set({ logsLoading: false });
    }
  },

  addRunningLog: async (generatorId, payload) => {
    try {
      set({ logsLoading: true });
      await generatorService.addRunningLog(generatorId, payload);
      await useGeneratorStore.getState().fetchRunningLogs(generatorId);
    } finally {
      set({ logsLoading: false });
    }
  },

  deleteRunningLog: async (generatorId, logId) => {
    try {
      set({ logsLoading: true });
      await generatorService.deleteRunningLog(logId);
      await useGeneratorStore.getState().fetchRunningLogs(generatorId);
    } finally {
      set({ logsLoading: false });
    }
  },

  fetchDieselLogs: async (generatorId) => {
    try {
      set({ logsLoading: true });
      const response = await generatorService.getDieselLogs(generatorId);
      set({ dieselLogs: response.data?.data || response.data || [] });
    } finally {
      set({ logsLoading: false });
    }
  },

  addDieselLog: async (generatorId, payload) => {
    try {
      set({ logsLoading: true });
      await generatorService.addDieselLog(generatorId, payload);
      await useGeneratorStore.getState().fetchDieselLogs(generatorId);
    } finally {
      set({ logsLoading: false });
    }
  },

  deleteDieselLog: async (generatorId, logId) => {
    try {
      set({ logsLoading: true });
      await generatorService.deleteDieselLog(logId);
      await useGeneratorStore.getState().fetchDieselLogs(generatorId);
    } finally {
      set({ logsLoading: false });
    }
  },

  fetchCoolantLogs: async (generatorId) => {
    try {
      set({ logsLoading: true });
      const response = await generatorService.getCoolantLogs(generatorId);
      set({ coolantLogs: response.data?.data || response.data || [] });
    } finally {
      set({ logsLoading: false });
    }
  },

  addCoolantLog: async (generatorId, payload) => {
    try {
      set({ logsLoading: true });
      await generatorService.addCoolantLog(generatorId, payload);
      await useGeneratorStore.getState().fetchCoolantLogs(generatorId);
    } finally {
      set({ logsLoading: false });
    }
  },

  deleteCoolantLog: async (generatorId, logId) => {
    try {
      set({ logsLoading: true });
      await generatorService.deleteCoolantLog(logId);
      await useGeneratorStore.getState().fetchCoolantLogs(generatorId);
    } finally {
      set({ logsLoading: false });
    }
  },
}));
