import { create } from "zustand";
import { departmentService, technicianService, locationService, complaintService } from "@/services/maintenance.service";

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
      set({
        departments: response.data?.data || response.data || [],
      });
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
      set({
        technicians: response.data?.data || response.data || [],
      });
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
      set({
        locations: response.data?.data || response.data || [],
      });
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
  createComplaints: (complaints: any[]) => Promise<void>;
  updateComplaint: (id: string, data: any) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;
}

export const useComplaintStore = create<ComplaintState>((set) => ({
  complaints: [],
  loading: false,

  fetchComplaints: async () => {
    try {
      set({ loading: true });
      const response = await complaintService.getAll();
      set({
        complaints: response.data?.data || response.data || [],
      });
    } finally {
      set({ loading: false });
    }
  },

  createComplaints: async (complaints) => {
    try {
      set({ loading: true });
      await complaintService.create(complaints);
      await useComplaintStore.getState().fetchComplaints();
    } finally {
      set({ loading: false });
    }
  },

  updateComplaint: async (id, data) => {
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
