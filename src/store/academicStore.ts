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
  CreateStudentPayload,
  UpdateStudentPayload,
  CreateStudentEnrollmentPayload,
  UpdateStudentEnrollmentPayload,
  CreateSubjectAllocationPayload,
  UpdateSubjectAllocationPayload,
  CreateTeacherAssignmentPayload,
  UpdateTeacherAssignmentPayload,
  CreateTimetablePayload,
  UpdateTimetablePayload,
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
export interface Student {
  id: string;
  studentCode: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string;
  fatherName: string;
  motherName: string;
  phone?: string;
  email?: string;
  admissionDate: string;
  status: "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  enrollmentStatus: "ACTIVE" | "PROMOTED" | "TRANSFERRED" | "GRADUATED" | "DROPPED";
  createdAt: string;
  updatedAt: string;

  student: Student;
  session: AcademicSession;
  class: AcademicClass;
  section: Section;
}

export interface SubjectAllocation {
  id: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  session: AcademicSession;
  class: AcademicClass;
  section: Section;
  subject: Subject;
  teacher: Teacher;
}

export interface TeacherAssignment {
  id: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;

  session: AcademicSession;
  class: AcademicClass;
  section: Section;
  teacher: Teacher;
}

export interface Timetable {
  id: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectAllocationId: string;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  periodNo: number;
  createdAt: string;
  updatedAt: string;

  session: AcademicSession;
  class: AcademicClass;
  section: Section;

  subjectAllocation: SubjectAllocation;
}

interface AcademicStore {
  sessions: AcademicSession[];
  classes: AcademicClass[];
  sections: Section[];
  subjects: Subject[];
  teachers: Teacher[];
  students: Student[];
  studentEnrollments: StudentEnrollment[];
  subjectAllocations: SubjectAllocation[];
  teacherAssignments: TeacherAssignment[];
  timetables: Timetable[];

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

  fetchStudents: () => Promise<void>;
  createStudent: (data: CreateStudentPayload) => Promise<void>;
  updateStudent: (id: string, data: UpdateStudentPayload) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  fetchStudentEnrollments: () => Promise<void>;
  createStudentEnrollment: (data: CreateStudentEnrollmentPayload) => Promise<void>;
  updateStudentEnrollment: (id: string, data: UpdateStudentEnrollmentPayload) => Promise<void>;
  deleteStudentEnrollment: (id: string) => Promise<void>;

  fetchSubjectAllocations: () => Promise<void>;
  createSubjectAllocation: (data: CreateSubjectAllocationPayload) => Promise<void>;
  updateSubjectAllocation: (id: string, data: UpdateSubjectAllocationPayload) => Promise<void>;
  deleteSubjectAllocation: (id: string) => Promise<void>;

  fetchTeacherAssignments: () => Promise<void>;
  createTeacherAssignment: (data: CreateTeacherAssignmentPayload) => Promise<void>;
  updateTeacherAssignment: (id: string, data: UpdateTeacherAssignmentPayload) => Promise<void>;
  deleteTeacherAssignment: (id: string) => Promise<void>;

  fetchTimetables: () => Promise<void>;
  createTimetable: (data: CreateTimetablePayload) => Promise<void>;
  updateTimetable: (id: string, data: UpdateTimetablePayload) => Promise<void>;
  deleteTimetable: (id: string) => Promise<void>;

  clearSessions: () => void;
  clearClasses: () => void;
  clearSections: () => void;
  clearSubjects: () => void;
  clearTeachers: () => void;
  clearStudents: () => void;
  clearStudentEnrollments: () => void;
  clearSubjectAllocations: () => void;
  clearTeacherAssignments: () => void;
  clearTimetables: () => void;
}

export const useAcademicStore = create<AcademicStore>((set, get) => ({
  sessions: [],
  classes: [],
  sections: [],
  subjects: [],
  teachers: [],
  students: [],
  studentEnrollments: [],
  subjectAllocations: [],
  teacherAssignments: [],
  timetables: [],
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

  clearStudents: () =>
    set({
      students: [],
    }),

  clearStudentEnrollments: () =>
    set({
      studentEnrollments: [],
    }),

  clearSubjectAllocations: () =>
    set({
      subjectAllocations: [],
    }),

  clearTeacherAssignments: () =>
    set({
      teacherAssignments: [],
    }),

    clearTimetables: () =>
  set({
    timetables: [],
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

  // ======================
  // Students
  // ======================

  fetchStudents: async () => {
    try {
      set({ loading: true });

      const response = await academicService.students.getAll();

      set({
        students: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch students", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createStudent: async (data) => {
    try {
      await academicService.students.create(data);
      await get().fetchStudents();
    } catch (error) {
      throw error;
    }
  },

  updateStudent: async (id, data) => {
    try {
      await academicService.students.update(id, data);
      await get().fetchStudents();
    } catch (error) {
      throw error;
    }
  },

  deleteStudent: async (id) => {
    try {
      await academicService.students.delete(id);
      await get().fetchStudents();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Student Enrollments
  // ======================

  fetchStudentEnrollments: async () => {
    try {
      set({ loading: true });

      const response = await academicService.studentEnrollments.getAll();

      set({
        studentEnrollments: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch student enrollments", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createStudentEnrollment: async (data) => {
    try {
      await academicService.studentEnrollments.create(data);
      await get().fetchStudentEnrollments();
    } catch (error) {
      throw error;
    }
  },

  updateStudentEnrollment: async (id, data) => {
    try {
      await academicService.studentEnrollments.update(id, data);
      await get().fetchStudentEnrollments();
    } catch (error) {
      throw error;
    }
  },

  deleteStudentEnrollment: async (id) => {
    try {
      await academicService.studentEnrollments.delete(id);
      await get().fetchStudentEnrollments();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Subject Allocations
  // ======================

  fetchSubjectAllocations: async () => {
    try {
      set({ loading: true });

      const response = await academicService.subjectAllocations.getAll();

      set({
        subjectAllocations: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch subject allocations", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createSubjectAllocation: async (data) => {
    try {
      await academicService.subjectAllocations.create(data);
      await get().fetchSubjectAllocations();
    } catch (error) {
      throw error;
    }
  },

  updateSubjectAllocation: async (id, data) => {
    try {
      await academicService.subjectAllocations.update(id, data);
      await get().fetchSubjectAllocations();
    } catch (error) {
      throw error;
    }
  },

  deleteSubjectAllocation: async (id) => {
    try {
      await academicService.subjectAllocations.delete(id);
      await get().fetchSubjectAllocations();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Teacher Assignments
  // ======================

  fetchTeacherAssignments: async () => {
    try {
      set({ loading: true });

      const response = await academicService.teacherAssignments.getAll();

      set({
        teacherAssignments: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch teacher assignments", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createTeacherAssignment: async (data) => {
    try {
      await academicService.teacherAssignments.create(data);
      await get().fetchTeacherAssignments();
    } catch (error) {
      throw error;
    }
  },

  updateTeacherAssignment: async (id, data) => {
    try {
      await academicService.teacherAssignments.update(id, data);
      await get().fetchTeacherAssignments();
    } catch (error) {
      throw error;
    }
  },

  deleteTeacherAssignment: async (id) => {
    try {
      await academicService.teacherAssignments.delete(id);
      await get().fetchTeacherAssignments();
    } catch (error) {
      throw error;
    }
  },

  // ======================
// Timetables
// ======================

fetchTimetables: async () => {
  try {
    set({ loading: true });

    const response = await academicService.timetables.getAll();

    set({
      timetables: response.data.data ?? [],
    });
  } catch (error) {
    console.error("Failed to fetch timetables", error);
    throw error;
  } finally {
    set({ loading: false });
  }
},

createTimetable: async (data) => {
  try {
    await academicService.timetables.create(data);
    await get().fetchTimetables();
  } catch (error) {
    throw error;
  }
},

updateTimetable: async (id, data) => {
  try {
    await academicService.timetables.update(id, data);
    await get().fetchTimetables();
  } catch (error) {
    throw error;
  }
},

deleteTimetable: async (id) => {
  try {
    await academicService.timetables.delete(id);
    await get().fetchTimetables();
  } catch (error) {
    throw error;
  }
},
}));
