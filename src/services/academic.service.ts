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
  isActive?: boolean;
}

export interface UpdateClassPayload {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ReorderClassPayload {
  id: string;
  sortOrder: number;
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
export interface CreateStudentPayload {
  admissionNo: string;
  firstName: string;
  lastName: string;
  dob: string;
  fatherName: string;
  motherName: string;
  phone?: string;
  email?: string;
  admissionDate: string;
}

export interface UpdateStudentPayload {
  admissionNo?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  email?: string;
  admissionDate?: string;
  status?: "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";
}

export interface CreateStudentEnrollmentPayload {
  studentId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
}

export interface UpdateStudentEnrollmentPayload {
  sessionId: string;
  classId: string;
  sectionId: string;
  enrollmentStatus: "ACTIVE" | "PROMOTED" | "TRANSFERRED" | "GRADUATED" | "DROPPED";
}

export interface CreateSubjectAllocationPayload {
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
}

export interface UpdateSubjectAllocationPayload {
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
}

export interface CreateTeacherAssignmentPayload {
  sessionId: string;
  classId: string;
  sectionId: string;
  teacherId: string;
}

export interface UpdateTeacherAssignmentPayload {
  sessionId: string;
  classId: string;
  sectionId: string;
  teacherId: string;
}

export interface CreateTimetablePayload {
  sessionId: string;
  classId: string;
  sectionId: string;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  periodNo: number;
  subjectAllocationId: string;
}

export interface UpdateTimetablePayload {
  sessionId: string;
  classId: string;
  sectionId: string;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  periodNo: number;
  subjectAllocationId: string;
}

export interface CreateStudentAttendancePayload {
  enrollmentId: string;
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  remarks?: string;
}

export interface UpdateStudentAttendancePayload {
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  remarks?: string;
}

export interface CreateFacultyAttendancePayload {
  sessionId: string;
  teacherId: string;
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE" | "HOLIDAY";
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

export interface UpdateFacultyAttendancePayload {
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE" | "HOLIDAY";
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

export interface CreateStudentSubjectAllocationPayload {
  studentId: string;
  subjectAllocationId: string;
}

export interface UpdateStudentSubjectAllocationPayload {
  studentId: string;
  subjectAllocationId: string;
}

export const academicService = {
  sessions: {
    getAll: () => apiClient.get("/academic/sessions"),

    getById: (id: string) => apiClient.get(`/academic/sessions/${id}`),

    create: (data: CreateAcademicSessionPayload) => apiClient.post("/academic/sessions", data),

    update: (id: string, data: UpdateAcademicSessionPayload) => apiClient.patch(`/academic/sessions/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/sessions/${id}`),
  },

  classes: {
    getAll: () => apiClient.get("/academic/classes"),

    getById: (id: string) => apiClient.get(`/academic/classes/${id}`),

    create: (data: CreateClassPayload) => apiClient.post("/academic/classes", data),

    update: (id: string, data: UpdateClassPayload) => apiClient.patch(`/academic/classes/${id}`, data),

    reorder: (data: ReorderClassPayload[]) => apiClient.patch("/academic/classes/reorder", data),

    delete: (id: string) => apiClient.delete(`/academic/classes/${id}`),
  },

  sections: {
    getAll: () => apiClient.get("/academic/sections"),

    getById: (id: string) => apiClient.get(`/academic/sections/${id}`),

    create: (data: CreateSectionPayload) => apiClient.post("/academic/sections", data),

    update: (id: string, data: UpdateSectionPayload) => apiClient.patch(`/academic/sections/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/sections/${id}`),
  },

  subjects: {
    getAll: () => apiClient.get("/academic/subjects"),

    getById: (id: string) => apiClient.get(`/academic/subjects/${id}`),

    create: (data: CreateSubjectPayload) => apiClient.post("/academic/subjects", data),

    update: (id: string, data: UpdateSubjectPayload) => apiClient.patch(`/academic/subjects/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/subjects/${id}`),
  },

  teachers: {
    getAll: () => apiClient.get("/academic/teachers"),

    getById: (id: string) => apiClient.get(`/academic/teachers/${id}`),

    create: (data: CreateTeacherPayload) => apiClient.post("/academic/teachers", data),

    update: (id: string, data: UpdateTeacherPayload) => apiClient.patch(`/academic/teachers/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/teachers/${id}`),
  },
  students: {
    getAll: () => apiClient.get("/academic/students"),

    getById: (id: string) => apiClient.get(`/academic/students/${id}`),

    create: (data: CreateStudentPayload) => apiClient.post("/academic/students", data),

    update: (id: string, data: UpdateStudentPayload) => apiClient.patch(`/academic/students/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/students/${id}`),
  },

  studentEnrollments: {
    getAll: () => apiClient.get("/academic/enrollment"),

    getById: (id: string) => apiClient.get(`/academic/enrollment/${id}`),

    create: (data: CreateStudentEnrollmentPayload) => apiClient.post("/academic/enrollment", data),

    update: (id: string, data: UpdateStudentEnrollmentPayload) => apiClient.patch(`/academic/enrollment/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/enrollment/${id}`),
  },

  subjectAllocations: {
    getAll: () => apiClient.get("/academic/subject-allocation"),

    getById: (id: string) => apiClient.get(`/academic/subject-allocation/${id}`),

    create: (data: CreateSubjectAllocationPayload) => apiClient.post("/academic/subject-allocation", data),

    update: (id: string, data: UpdateSubjectAllocationPayload) => apiClient.patch(`/academic/subject-allocation/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/subject-allocation/${id}`),
  },

  teacherAssignments: {
    getAll: () => apiClient.get("/academic/teacher-assignment"),

    getById: (id: string) => apiClient.get(`/academic/teacher-assignment/${id}`),

    create: (data: CreateTeacherAssignmentPayload) => apiClient.post("/academic/teacher-assignment", data),

    update: (id: string, data: UpdateTeacherAssignmentPayload) => apiClient.patch(`/academic/teacher-assignment/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/teacher-assignment/${id}`),
  },

  timetables: {
    getAll: () => apiClient.get("/academic/timetable"),

    getById: (id: string) => apiClient.get(`/academic/timetable/${id}`),

    create: (data: CreateTimetablePayload) => apiClient.post("/academic/timetable", data),

    update: (id: string, data: UpdateTimetablePayload) => apiClient.patch(`/academic/timetable/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/timetable/${id}`),
  },

  studentAttendances: {
    getAll: () => apiClient.get("/academic/student-attendance"),

    getById: (id: string) => apiClient.get(`/academic/student-attendance/${id}`),

    create: (data: CreateStudentAttendancePayload) => apiClient.post("/academic/student-attendance", data),

    update: (id: string, data: UpdateStudentAttendancePayload) => apiClient.patch(`/academic/student-attendance/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/student-attendance/${id}`),
  },

  facultyAttendances: {
    getAll: () => apiClient.get("/academic/faculty-attendance"),

    getById: (id: string) => apiClient.get(`/academic/faculty-attendance/${id}`),

    create: (data: CreateFacultyAttendancePayload) => apiClient.post("/academic/faculty-attendance", data),

    update: (id: string, data: UpdateFacultyAttendancePayload) => apiClient.patch(`/academic/faculty-attendance/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/faculty-attendance/${id}`),
  },

  studentSubjectAllocations: {
    getAll: () => apiClient.get("/academic/student-subject-allocation"),

    getById: (id: string) => apiClient.get(`/academic/student-subject-allocation/${id}`),

    create: (data: CreateStudentSubjectAllocationPayload) => apiClient.post("/academic/student-subject-allocation", data),

    update: (id: string, data: UpdateStudentSubjectAllocationPayload) => apiClient.patch(`/academic/student-subject-allocation/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/student-subject-allocation/${id}`),
  },
};