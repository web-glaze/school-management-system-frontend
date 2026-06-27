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

export interface CreateSubjectPayload {
  name: string;
  isOptional?: boolean;
}

export interface UpdateSubjectPayload {
  name?: string;
  isOptional?: boolean;
}

export interface CreateTeacherPayload {
  name: string;
  email: string;
  phone: string;
  designation: string;
  joiningDate: string;
  isActive: boolean;
}

export interface UpdateTeacherPayload {
  name: string;
  email: string;
  phone: string;
  designation: string;
  joiningDate: string;
  isActive: boolean;
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

  subjects: {
  getAll: () =>
    apiClient.get("/academic/subjects"),

  getById: (id: string) =>
    apiClient.get(`/academic/subjects/${id}`),

  create: (
    data: CreateSubjectPayload,
  ) =>
    apiClient.post(
      "/academic/subjects",
      data,
    ),

  update: (
    id: string,
    data: UpdateSubjectPayload,
  ) =>
    apiClient.patch(
      `/academic/subjects/${id}`,
      data,
    ),

  delete: (id: string) =>
    apiClient.delete(
      `/academic/subjects/${id}`,
    ),
},

teachers: {
  getAll: () =>
    apiClient.get("/academic/teachers"),

  getById: (id: string) =>
    apiClient.get(`/academic/teachers/${id}`),

  create: (
    data: CreateTeacherPayload,
  ) =>
    apiClient.post(
      "/academic/teachers",
      data,
    ),

  update: (
    id: string,
    data: UpdateTeacherPayload,
  ) =>
    apiClient.patch(
      `/academic/teachers/${id}`,
      data,
    ),

  delete: (id: string) =>
    apiClient.delete(
      `/academic/teachers/${id}`,
    ),
},
};

