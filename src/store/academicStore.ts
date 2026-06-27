import { create } from "zustand";
import {
  academicService,
  CreateAcademicSessionPayload,
  UpdateAcademicSessionPayload,
  CreateClassPayload,
  UpdateClassPayload,
  CreateSectionPayload,
  UpdateSectionPayload,
  CreateSubjectPayload,
  UpdateSubjectPayload,
  CreateTeacherPayload,
  UpdateTeacherPayload,
} from "@/services/academic.service";

export interface AcademicSession {
  id: string;
  sessionCode: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicClass {
  id: string;
  classCode: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  sectionCode: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  subjectCode: string;
  name: string;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  teacherCode: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  joiningDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AcademicStore {
  sessions: AcademicSession[];
  classes: AcademicClass[];
  sections: Section[];
  subjects: Subject[];
  teachers: Teacher[];

  loading: boolean;

  fetchSessions: () => Promise<void>;
  createSession: (data: CreateAcademicSessionPayload) => Promise<void>;
  updateSession: (id: string, data: UpdateAcademicSessionPayload) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  fetchClasses: () => Promise<void>;
  createClass: (data: CreateClassPayload) => Promise<void>;
  updateClass: (id: string, data: UpdateClassPayload) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  fetchSections: () => Promise<void>;
  createSection: (data: CreateSectionPayload) => Promise<void>;
  updateSection: (id: string, data: UpdateSectionPayload) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;

  fetchSubjects: () => Promise<void>;
  createSubject: (data: CreateSubjectPayload) => Promise<void>;
  updateSubject: (id: string, data: UpdateSubjectPayload) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  fetchTeachers: () => Promise<void>;
  createTeacher: (data: CreateTeacherPayload) => Promise<void>;
  updateTeacher: (id: string, data: UpdateTeacherPayload) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;

  clearSessions: () => void;
  clearClasses: () => void;
  clearSections: () => void;
  clearSubjects: () => void;
  clearTeachers: () => void;
}

export const useAcademicStore = create<AcademicStore>((set, get) => ({
  sessions: [],
  classes: [],
  sections: [],
  subjects: [],
  teachers: [],
  loading: false,

  // ======================
  // Sessions
  // ======================

  fetchSessions: async () => {
    try {
      set({ loading: true });

      const response = await academicService.sessions.getAll();

      set({
        sessions: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch academic sessions", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createSession: async (data) => {
    try {
      await academicService.sessions.create(data);
      await get().fetchSessions();
    } catch (error) {
      throw error;
    }
  },

  updateSession: async (id, data) => {
    try {
      await academicService.sessions.update(id, data);
      await get().fetchSessions();
    } catch (error) {
      throw error;
    }
  },

  deleteSession: async (id) => {
    try {
      await academicService.sessions.delete(id);
      await get().fetchSessions();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Classes
  // ======================

  fetchClasses: async () => {
    try {
      set({ loading: true });

      const response = await academicService.classes.getAll();

      set({
        classes: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch classes", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createClass: async (data) => {
    try {
      await academicService.classes.create(data);
      await get().fetchClasses();
    } catch (error) {
      throw error;
    }
  },

  updateClass: async (id, data) => {
    try {
      await academicService.classes.update(id, data);
      await get().fetchClasses();
    } catch (error) {
      throw error;
    }
  },

  deleteClass: async (id) => {
    try {
      await academicService.classes.delete(id);
      await get().fetchClasses();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Sections
  // ======================

  fetchSections: async () => {
    try {
      set({ loading: true });

      const response = await academicService.sections.getAll();

      set({
        sections: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch sections", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createSection: async (data) => {
    try {
      await academicService.sections.create(data);
      await get().fetchSections();
    } catch (error) {
      throw error;
    }
  },

  updateSection: async (id, data) => {
    try {
      await academicService.sections.update(id, data);
      await get().fetchSections();
    } catch (error) {
      throw error;
    }
  },

  deleteSection: async (id) => {
    try {
      await academicService.sections.delete(id);
      await get().fetchSections();
    } catch (error) {
      throw error;
    }
  },

  clearSessions: () =>
    set({
      sessions: [],
    }),

  clearClasses: () =>
    set({
      classes: [],
    }),

  clearSections: () =>
    set({
      sections: [],
    }),

  clearSubjects: () =>
    set({
      subjects: [],
    }),

  clearTeachers: () =>
    set({
      teachers: [],
    }),

  // ======================
  // Subjects
  // ======================

  fetchSubjects: async () => {
    try {
      set({ loading: true });

      const response = await academicService.subjects.getAll();

      set({
        subjects: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch subjects", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createSubject: async (data) => {
    try {
      await academicService.subjects.create(data);
      await get().fetchSubjects();
    } catch (error) {
      throw error;
    }
  },

  updateSubject: async (id, data) => {
    try {
      await academicService.subjects.update(id, data);
      await get().fetchSubjects();
    } catch (error) {
      throw error;
    }
  },

  deleteSubject: async (id) => {
    try {
      await academicService.subjects.delete(id);
      await get().fetchSubjects();
    } catch (error) {
      throw error;
    }
  },
  // ======================
  // Teachers
  // ======================

  fetchTeachers: async () => {
    try {
      set({ loading: true });

      const response = await academicService.teachers.getAll();

      set({
        teachers: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch teachers data", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createTeacher: async (data) => {
    try {
      await academicService.teachers.create(data);
      await get().fetchTeachers();
    } catch (error) {
      throw error;
    }
  },

  updateTeacher: async (id, data) => {
    try {
      await academicService.teachers.update(id, data);
      await get().fetchTeachers();
    } catch (error) {
      throw error;
    }
  },

  deleteTeacher: async (id) => {
    try {
      await academicService.teachers.delete(id);
      await get().fetchTeachers();
    } catch (error) {
      throw error;
    }
  },
}));
