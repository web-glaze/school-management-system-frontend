import apiClient from "./api";

export const academicService = {
  sessions: {
    getAll: () => apiClient.get("/academic/sessions"),

    getById: (id: string) =>
      apiClient.get(`/academic/sessions/${id}`),

    create: (data: {
      name: string;
      startDate: string;
      endDate: string;
      isActive?: boolean;
    }) =>
      apiClient.post("/academic/sessions", data),

    update: (
      id: string,
      data: {
        name?: string;
        startDate?: string;
        endDate?: string;
        isActive?: boolean;
      },
    ) =>
      apiClient.patch(
        `/academic/sessions/${id}`,
        data,
      ),

    delete: (id: string) =>
      apiClient.delete(`/academic/sessions/${id}`),
  },
};