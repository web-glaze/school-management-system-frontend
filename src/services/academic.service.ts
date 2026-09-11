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

export interface CreateEventPayload {
  title: string;
  description?: string;
  sessionId: string;
  eventType: "HOLIDAY" | "EVENT" | "EXAM" | "PTM" | "SPORTS" | "CULTURAL" | "STAFF_MEETING" | "OTHER";
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
  scope?: "WHOLE_SCHOOL" | "SPECIFIC_CLASSES" | "SPECIFIC_SECTIONS";
  classIds?: string[];
  sectionIds?: string[];
  isPublished?: boolean;
  isActive?: boolean;
}

export interface UpdateEventPayload {
  title: string;
  description?: string;
  sessionId: string;
  eventType: "HOLIDAY" | "EVENT" | "EXAM" | "PTM" | "SPORTS" | "CULTURAL" | "STAFF_MEETING" | "OTHER";
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
  scope?: "WHOLE_SCHOOL" | "SPECIFIC_CLASSES" | "SPECIFIC_SECTIONS";
  classIds?: string[];
  sectionIds?: string[];
  isPublished?: boolean;
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
  userName: string;
  password: string;
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

export interface TransferTeacherPayload {
  fromTeacherId: string;
  effectiveDate: string;

  subjectTransfers?: {
    subjectAllocationId: string;
    toTeacherId: string;
  }[];

  classTransfers?: {
    classTeacherAssignmentId: string;
    toTeacherId: string;
  }[];

  timetableResolutions?: {
    timetableId: string;
    dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    periodNo: number;
  }[];

  remarks?: string;
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

export interface CreateAssignmentPayload {
  subjectAllocationId: string;
  type: "HOMEWORK" | "HOLIDAY_HOMEWORK" | "ASSIGNMENT";
  title: string;
  description?: string;
  givenDate: string;
  dueDate?: string;
  attachmentUrl?: string;
  status?: "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
}

export interface UpdateAssignmentPayload {
  type?: "HOMEWORK" | "HOLIDAY_HOMEWORK" | "ASSIGNMENT";
  title?: string;
  description?: string;
  givenDate?: string;
  dueDate?: string;
  attachmentUrl?: string;
  status?: "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
}

export interface UpdateAssignmentStudentPayload {
  status: "IN_PROGRESS" | "COMPLETED" | "NOT_SUBMITTED";
  remarks?: string | null;
}

export interface CreateSubjectAttendancePayload {
  enrollmentId: string;
  subjectAllocationId: string;
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  remarks?: string;
}

export interface UpdateSubjectAttendancePayload {
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

export interface CreateExamPayload {
  sessionId: string;
  name: string;
  type: "UNIT_TEST" | "MID_TERM" | "ANNUAL" | "PRACTICAL";
  startDate: string;
  endDate: string;
  description?: string;
  status?: "DRAFT" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
}

export interface UpdateExamPayload {
  name?: string;
  type?: "UNIT_TEST" | "MID_TERM" | "ANNUAL" | "PRACTICAL";
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: "DRAFT" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
}

export interface CreateExamSchedulePayload {
  subjectAllocationId: string;
  examDate: string;
  startTime?: string;
  endTime?: string;
  shift: "MORNING" | "AFTERNOON";
  room?: string;
}

export interface UpdateExamSchedulePayload {
  subjectAllocationId?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  shift?: "MORNING" | "AFTERNOON";
  room?: string;
}

export interface CreateExamMarkPayload {
  examScheduleId: string;
  examComponentId: string;
  studentId: string;
  marksObtained: number;
  remarks?: string;
}

export interface UpdateExamMarkPayload {
  examScheduleId?: string;
  examComponentId?: string;
  studentId?: string;
  marksObtained?: number;
  remarks?: string;
}

export interface CreateExamComponentPayload {
  examScheduleId: string;
  name: string;
  code?: string;
  maximumMarks: number;
  passingMarks?: number;
  weightage?: number;
  displayOrder?: number;
}

export interface UpdateExamComponentPayload {
  name?: string;
  code?: string;
  maximumMarks?: number;
  passingMarks?: number;
  weightage?: number;
  displayOrder?: number;
}

export interface CreateReportCardPayload {
  sessionId: string;
  studentId: string;
  enrollmentId: string;
  examId?: string;
  type: "EXAM" | "ANNUAL";
  teacherRemarks?: Record<string, unknown>;
  reportData?: Record<string, unknown>;
  pdfUrl?: string;
  status?: "DRAFT" | "GENERATED" | "PUBLISHED";
}

export interface UpdateReportCardPayload {
  sessionId?: string;
  studentId?: string;
  enrollmentId?: string;
  examId?: string;
  type?: "EXAM" | "ANNUAL";
  teacherRemarks?: Record<string, unknown>;
  reportData?: Record<string, unknown>;
  pdfUrl?: string;
  status?: "DRAFT" | "GENERATED" | "PUBLISHED";
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

    generateUsername: (name: string, email?: string, phone?: string) =>
      apiClient.get("/academic/teachers/generate-username", {
        params: {
          name,
          email,
          phone,
        },
      }),

    create: (data: CreateTeacherPayload) => apiClient.post("/academic/teachers", data),

    update: (id: string, data: UpdateTeacherPayload) => apiClient.patch(`/academic/teachers/${id}`, data),

    updateStatus: (id: string, isActive: boolean) => apiClient.put(`/academic/teachers/${id}/status/${isActive ? "active" : "inactive"}`),

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

  teacherTransfers: {
    getAll: () => apiClient.get("/academic/teacher-transfer"),

    getById: (id: string) => apiClient.get(`/academic/teacher-transfer/${id}`),

    create: (data: TransferTeacherPayload) => apiClient.post("/academic/teacher-transfer", data),
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

  assignments: {
    getAll: () => apiClient.get("/academic/assignments"),

    getById: (id: string) => apiClient.get(`/academic/assignments/${id}`),

    create: (data: CreateAssignmentPayload) => apiClient.post("/academic/assignments", data),

    update: (id: string, data: UpdateAssignmentPayload) => apiClient.patch(`/academic/assignments/${id}`, data),

    updateStudentStatus: (assignmentId: string, studentId: string, data: UpdateAssignmentStudentPayload) => apiClient.patch(`/academic/assignments/${assignmentId}/students/${studentId}`, data),

    delete: (id: string) => apiClient.delete(`/academic/assignments/${id}`),
  },

  exams: {
    getAll: () => apiClient.get("/academic/exams"),

    getById: (id: string) => apiClient.get(`/academic/exams/${id}`),

    create: (data: CreateExamPayload) => apiClient.post("/academic/exams", data),

    update: (id: string, data: UpdateExamPayload) => apiClient.patch(`/academic/exams/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/exams/${id}`),

    getSchedules: (examId: string) => apiClient.get(`/academic/exams/${examId}/schedules`),

    createSchedule: (examId: string, data: CreateExamSchedulePayload) => apiClient.post(`/academic/exams/${examId}/schedules`, data),

    updateSchedule: (scheduleId: string, data: UpdateExamSchedulePayload) => apiClient.patch(`/academic/exams/schedules/${scheduleId}`, data),

    deleteSchedule: (scheduleId: string) => apiClient.delete(`/academic/exams/schedules/${scheduleId}`),

    getComponents: (examId: string, scheduleId: string) => apiClient.get(`/academic/exams/${examId}/schedules/${scheduleId}/components`),

    createComponent: (examId: string, scheduleId: string, data: CreateExamComponentPayload) => apiClient.post(`/academic/exams/${examId}/schedules/${scheduleId}/components`, data),

    updateComponent: (componentId: string, data: UpdateExamComponentPayload) => apiClient.patch(`/academic/exams/components/${componentId}`, data),

    deleteComponent: (componentId: string) => apiClient.delete(`/academic/exams/components/${componentId}`),
  },

  examMarks: {
    getAll: () => apiClient.get("/academic/exam-marks"),

    getById: (id: string) => apiClient.get(`/academic/exam-marks/${id}`),

    getBySchedule: (examScheduleId: string) => apiClient.get(`/academic/exam-marks/schedule/${examScheduleId}`),

    create: (data: CreateExamMarkPayload) => apiClient.post("/academic/exam-marks", data),

    update: (id: string, data: UpdateExamMarkPayload) => apiClient.patch(`/academic/exam-marks/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/exam-marks/${id}`),
  },

  reportCards: {
    getAll: () => apiClient.get("/academic/report-cards"),

    getById: (id: string) => apiClient.get(`/academic/report-cards/${id}`),

    getByStudent: (studentId: string) => apiClient.get(`/academic/report-cards/student/${studentId}`),

    getByExam: (examId: string) => apiClient.get(`/academic/report-cards/exam/${examId}`),

    create: (data: CreateReportCardPayload) => apiClient.post("/academic/report-cards", data),

    update: (id: string, data: UpdateReportCardPayload) => apiClient.patch(`/academic/report-cards/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/report-cards/${id}`),

    generateExam: (studentId: string, examId: string, data?: { teacherRemarks?: Record<string, unknown>; reportData?: Record<string, unknown>;}) => apiClient.post(`/academic/report-cards/student/${studentId}/exam/${examId}/generate`, data),

    generateAnnual: (studentId: string, sessionId: string, data?: { teacherRemarks?: Record<string, unknown>; reportData?: Record<string, unknown>;}) => apiClient.post(`/academic/report-cards/student/${studentId}/session/${sessionId}/generate-annual`, data),

    publish: (id: string) => apiClient.patch(`/academic/report-cards/${id}/publish`),
  },

  subjectAttendances: {
    getAll: () => apiClient.get("/academic/subject-attendance"),

    getById: (id: string) => apiClient.get(`/academic/subject-attendance/${id}`),

    create: (data: CreateSubjectAttendancePayload) => apiClient.post("/academic/subject-attendance", data),

    update: (id: string, data: UpdateSubjectAttendancePayload) => apiClient.patch(`/academic/subject-attendance/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/subject-attendance/${id}`),
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

  schedule: {
    getAll: () => apiClient.get("/academic/schedule"),

    getById: (id: string) => apiClient.get(`/academic/schedule/${id}`),

    create: (data: CreateEventPayload) => apiClient.post("/academic/schedule", data),

    update: (id: string, data: UpdateEventPayload) => apiClient.patch(`/academic/schedule/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/schedule/${id}`),
  },
};
