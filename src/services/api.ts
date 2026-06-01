import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ComplaintData {
  description?: string;
  status?: string;
  priority?: string;
  technicianId?: string | null;
  departmentId?: string | null;
  adminImageUrl?: string | null;
  imageUrl?: string | null;
  [key: string]: unknown;
}

export const complaintService = {
  getById: (id: string) => apiClient.get(`/complaints/${id}`),
  update: (id: string, data: ComplaintData) => apiClient.patch(`/complaints/${id}`, data),
};

export const technicianService = {
  getAll: () => apiClient.get('/technicians'),
};

export const departmentService = {
  getAll: () => apiClient.get('/departments'),
};