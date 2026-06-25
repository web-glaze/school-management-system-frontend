import apiClient from "./api";

export interface CreateAcademicSessionPayload {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateAcademicSessionPayload {
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface CreateClassPayload {
  name: string;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateClassPayload {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateSectionPayload {
  name: string;
  isActive?: boolean;
}

export interface UpdateSectionPayload {
  name?: string;
  isActive?: boolean;
}

export const academicService = {
  sessions: {
    getAll: () =>
      apiClient.get("/academic/sessions"),

    getById: (id: string) =>
      apiClient.get(`/academic/sessions/${id}`),

    create: (
      data: CreateAcademicSessionPayload,
    ) =>
      apiClient.post(
        "/academic/sessions",
        data,
      ),

    update: (
      id: string,
      data: UpdateAcademicSessionPayload,
    ) =>
      apiClient.patch(
        `/academic/sessions/${id}`,
        data,
      ),

    delete: (id: string) =>
      apiClient.delete(
        `/academic/sessions/${id}`,
      ),
  },

  classes: {
    getAll: () =>
      apiClient.get("/academic/classes"),

    getById: (id: string) =>
      apiClient.get(`/academic/classes/${id}`),

    create: (data: CreateClassPayload) =>
      apiClient.post(
        "/academic/classes",
        data,
      ),

    update: (
      id: string,
      data: UpdateClassPayload,
    ) =>
      apiClient.patch(
        `/academic/classes/${id}`,
        data,
      ),

    delete: (id: string) =>
      apiClient.delete(
        `/academic/classes/${id}`,
      ),
  },

  sections: {
    getAll: () =>
      apiClient.get("/academic/sections"),

    getById: (id: string) =>
      apiClient.get(`/academic/sections/${id}`),

    create: (
      data: CreateSectionPayload,
    ) =>
      apiClient.post(
        "/academic/sections",
        data,
      ),

    update: (
      id: string,
      data: UpdateSectionPayload,
    ) =>
      apiClient.patch(
        `/academic/sections/${id}`,
        data,
      ),

    delete: (id: string) =>
      apiClient.delete(
        `/academic/sections/${id}`,
      ),
  },
};