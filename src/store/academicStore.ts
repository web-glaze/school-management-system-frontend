import { create } from "zustand";
import {
  academicService,
  CreateAcademicSessionPayload,
  UpdateAcademicSessionPayload,
  CreateClassPayload,
  UpdateClassPayload,
  ReorderClassPayload,
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
  CreateStudentAttendancePayload,
  UpdateStudentAttendancePayload,
  CreateSubjectAttendancePayload,
  UpdateSubjectAttendancePayload,
  CreateFacultyAttendancePayload,
  UpdateFacultyAttendancePayload,
  CreateStudentSubjectAllocationPayload,
  UpdateStudentSubjectAllocationPayload,
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
export interface StudentAttendance {
  id: string;
  enrollmentId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  remarks?: string;
  createdAt: string;
  updatedAt: string;

  enrollment: StudentEnrollment;
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

export interface StudentSubjectAllocation {
  id: string;
  studentId: string;
  subjectAllocationId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  student: Student;
  subjectAllocation: SubjectAllocation;
}

export interface SubjectAttendance {
  id: string;
  enrollmentId: string;
  subjectAllocationId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  remarks?: string;
  createdAt: string;
  updatedAt: string;

  enrollment: StudentEnrollment;
  subjectAllocation: SubjectAllocation;
}

export interface FacultyAttendance {
  id: string;
  sessionId: string;
  teacherId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE" | "HOLIDAY";
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;

  session: AcademicSession;
  teacher: Teacher;
}

interface AcademicStore {
  sessions: AcademicSession[];
  classes: AcademicClass[];
  sections: Section[];
  subjects: Subject[];
  teachers: Teacher[];
  students: Student[];
  studentEnrollments: StudentEnrollment[];
  studentAttendances: StudentAttendance[];
  subjectAttendances: SubjectAttendance[];
  subjectAllocations: SubjectAllocation[];
  teacherAssignments: TeacherAssignment[];
  facultyAttendances: FacultyAttendance[];
  timetables: Timetable[];
  studentSubjectAllocations: StudentSubjectAllocation[];

  loading: boolean;

  fetchSessions: () => Promise<void>;
  createSession: (data: CreateAcademicSessionPayload) => Promise<void>;
  updateSession: (id: string, data: UpdateAcademicSessionPayload) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  fetchClasses: () => Promise<void>;
  createClass: (data: CreateClassPayload) => Promise<void>;
  updateClass: (id: string, data: UpdateClassPayload) => Promise<void>;
  reorderClasses: (data: ReorderClassPayload[]) => Promise<void>;
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

  fetchStudentAttendances: () => Promise<void>;
  createStudentAttendance: (data: CreateStudentAttendancePayload) => Promise<void>;
  updateStudentAttendance: (id: string, data: UpdateStudentAttendancePayload) => Promise<void>;
  deleteStudentAttendance: (id: string) => Promise<void>;

  fetchSubjectAttendances: () => Promise<void>;
  createSubjectAttendance: (data: CreateSubjectAttendancePayload) => Promise<void>;
  updateSubjectAttendance: (id: string, data: UpdateSubjectAttendancePayload) => Promise<void>;
  deleteSubjectAttendance: (id: string) => Promise<void>;

  fetchSubjectAllocations: () => Promise<void>;
  createSubjectAllocation: (data: CreateSubjectAllocationPayload) => Promise<void>;
  updateSubjectAllocation: (id: string, data: UpdateSubjectAllocationPayload) => Promise<void>;
  deleteSubjectAllocation: (id: string) => Promise<void>;

  fetchStudentSubjectAllocations: () => Promise<void>;
  createStudentSubjectAllocation: (data: CreateStudentSubjectAllocationPayload) => Promise<void>;
  updateStudentSubjectAllocation: (id: string, data: UpdateStudentSubjectAllocationPayload) => Promise<void>;
  deleteStudentSubjectAllocation: (id: string) => Promise<void>;

  fetchTeacherAssignments: () => Promise<void>;
  createTeacherAssignment: (data: CreateTeacherAssignmentPayload) => Promise<void>;
  updateTeacherAssignment: (id: string, data: UpdateTeacherAssignmentPayload) => Promise<void>;
  deleteTeacherAssignment: (id: string) => Promise<void>;

  fetchFacultyAttendances: () => Promise<void>;
  createFacultyAttendance: (data: CreateFacultyAttendancePayload) => Promise<void>;
  updateFacultyAttendance: (id: string, data: UpdateFacultyAttendancePayload) => Promise<void>;
  deleteFacultyAttendance: (id: string) => Promise<void>;

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
  clearStudentAttendances: () => void;
  clearSubjectAttendances: () => void;
  clearSubjectAllocations: () => void;
  clearStudentSubjectAllocations: () => void;
  clearTeacherAssignments: () => void;
  clearFacultyAttendances: () => void;
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
  studentAttendances: [],
  subjectAttendances: [],
  subjectAllocations: [],
  studentSubjectAllocations: [],
  teacherAssignments: [],
  facultyAttendances: [],
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

  reorderClasses: async (data) => {
    const previous = get().classes;

    const optimistic = previous.map((c) => {
      const match = data.find((d) => d.id === c.id);
      return match ? { ...c, sortOrder: match.sortOrder } : c;
    });

    optimistic.sort((a, b) => (a.isActive === b.isActive ? a.sortOrder - b.sortOrder : a.isActive ? -1 : 1));

    set({ classes: optimistic });

    try {
      await academicService.classes.reorder(data);
      await get().fetchClasses();
    } catch (error) {
      set({ classes: previous });
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

  clearStudentAttendances: () =>
    set({
      studentAttendances: [],
    }),

  clearSubjectAttendances: () =>
    set({
      subjectAttendances: [],
    }),

  clearSubjectAllocations: () =>
    set({
      subjectAllocations: [],
    }),

  clearStudentSubjectAllocations: () =>
    set({
      studentSubjectAllocations: [],
    }),

  clearTeacherAssignments: () =>
    set({
      teacherAssignments: [],
    }),

  clearFacultyAttendances: () =>
    set({
      facultyAttendances: [],
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
  // Student Attendance
  // ======================

  fetchStudentAttendances: async () => {
    try {
      set({ loading: true });

      const response = await academicService.studentAttendances.getAll();

      set({
        studentAttendances: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch student attendance", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createStudentAttendance: async (data) => {
    try {
      await academicService.studentAttendances.create(data);
      await get().fetchStudentAttendances();
    } catch (error) {
      throw error;
    }
  },

  updateStudentAttendance: async (id, data) => {
    try {
      await academicService.studentAttendances.update(id, data);
      await get().fetchStudentAttendances();
    } catch (error) {
      throw error;
    }
  },

  deleteStudentAttendance: async (id) => {
    try {
      await academicService.studentAttendances.delete(id);
      await get().fetchStudentAttendances();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Subject Attendance
  // ======================

  fetchSubjectAttendances: async () => {
    try {
      set({ loading: true });

      const response = await academicService.subjectAttendances.getAll();

      set({
        subjectAttendances: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch subject attendance", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createSubjectAttendance: async (data) => {
    try {
      await academicService.subjectAttendances.create(data);
      await get().fetchSubjectAttendances();
    } catch (error) {
      throw error;
    }
  },

  updateSubjectAttendance: async (id, data) => {
    try {
      await academicService.subjectAttendances.update(id, data);
      await get().fetchSubjectAttendances();
    } catch (error) {
      throw error;
    }
  },

  deleteSubjectAttendance: async (id) => {
    try {
      await academicService.subjectAttendances.delete(id);
      await get().fetchSubjectAttendances();
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
  // Student Subject Allocations
  // ======================

  fetchStudentSubjectAllocations: async () => {
    try {
      set({ loading: true });

      const response = await academicService.studentSubjectAllocations.getAll();

      set({
        studentSubjectAllocations: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch student subject allocations", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createStudentSubjectAllocation: async (data) => {
    try {
      await academicService.studentSubjectAllocations.create(data);
      await get().fetchStudentSubjectAllocations();
    } catch (error) {
      throw error;
    }
  },

  updateStudentSubjectAllocation: async (id, data) => {
    try {
      await academicService.studentSubjectAllocations.update(id, data);
      await get().fetchStudentSubjectAllocations();
    } catch (error) {
      throw error;
    }
  },

  deleteStudentSubjectAllocation: async (id) => {
    try {
      await academicService.studentSubjectAllocations.delete(id);
      await get().fetchStudentSubjectAllocations();
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
  // Faculty Attendance
  // ======================

  fetchFacultyAttendances: async () => {
    try {
      set({ loading: true });

      const response = await academicService.facultyAttendances.getAll();

      set({
        facultyAttendances: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch faculty attendance", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createFacultyAttendance: async (data) => {
    try {
      await academicService.facultyAttendances.create(data);
      await get().fetchFacultyAttendances();
    } catch (error) {
      throw error;
    }
  },

  updateFacultyAttendance: async (id, data) => {
    try {
      await academicService.facultyAttendances.update(id, data);
      await get().fetchFacultyAttendances();
    } catch (error) {
      throw error;
    }
  },

  deleteFacultyAttendance: async (id) => {
    try {
      await academicService.facultyAttendances.delete(id);
      await get().fetchFacultyAttendances();
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
