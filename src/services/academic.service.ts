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

export type Board = "GENERAL" | "CBSE" | "CIE";

export interface CreateClassPayload {
  name: string;
  board?: Board;
  isActive?: boolean;
}

export interface UpdateClassPayload {
  name?: string;
  board?: Board;
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
  sectionIds: string[];
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

export interface CreateExamGroupPayload {
  name: string;
  code?: string;
  sequence?: number;
  isActive?: boolean;
}

export interface UpdateExamGroupPayload {
  name?: string;
  code?: string;
  sequence?: number;
  isActive?: boolean;
}

export interface ReorderExamGroupPayload {
  id: string;
  sequence: number;
}

export interface CreateGradingSchemePayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateGradingSchemePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateGradeBandPayload {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  remark?: string;
  displayOrder?: number;
}

export interface UpdateGradeBandPayload {
  grade?: string;
  minPercentage?: number;
  maxPercentage?: number;
  remark?: string;
  displayOrder?: number;
}

export interface CreateClassExamStructurePayload {
  classId: string;
  gradingSchemeId?: string;
  hasOptionalSubject?: boolean;
  combineExamGroups?: boolean;
  showPerformanceGraph?: boolean;
  notes?: string;
}

export interface UpdateClassExamStructurePayload {
  gradingSchemeId?: string;
  hasOptionalSubject?: boolean;
  combineExamGroups?: boolean;
  showPerformanceGraph?: boolean;
  notes?: string;
  isActive?: boolean;
}

export interface ClassExamGroupWeightItem {
  examGroupId: string;
  weightagePercent?: number;
  includeInFinalResult?: boolean;
  displayOrder?: number;
}

export interface CreateReportCardTemplatePayload {
  classId: string;
  examGroupId?: string;
  gradingSchemeId?: string;
  name: string;
  reportScope: "INDIVIDUAL" | "COMBINED";
  showPerformanceGraph?: boolean;
  showFinalResultWeightage?: boolean;
  isActive?: boolean;
}

export interface UpdateReportCardTemplatePayload {
  name?: string;
  gradingSchemeId?: string;
  showPerformanceGraph?: boolean;
  showFinalResultWeightage?: boolean;
  isActive?: boolean;
}

export interface ReportCardSectionItem {
  key: string;
  label: string;
  isEnabled?: boolean;
  displayOrder?: number;
  config?: Record<string, unknown>;
}

export interface ReportRemarkFieldItem {
  key: string;
  label: string;
  displayOrder?: number;
}

export interface ReportCoScholasticRowItem {
  label: string;
  displayOrder?: number;
}

export type ComponentSource = "FETCHED" | "MANUAL";

export interface CreateClassSubjectComponentTemplatePayload {
  classId: string;
  examGroupId: string;
  subjectId?: string;
}

export interface CopyClassComponentTemplatePayload {
  sourceClassId: string;
  examGroupId: string;
  targetClassIds: string[];
}

export interface ComponentTemplateDefinitionItem {
  name: string;
  source: ComponentSource;
  maximumMarks: number;
  passingMarks?: number;
  displayOrder?: number;
}

export interface CreateExamPayload {
  sessionId: string;
  name: string;
  examGroupId: string;
  startDate: string;
  endDate: string;
  description?: string;
  status?: "DRAFT" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
}

export interface UpdateExamPayload {
  name?: string;
  examGroupId?: string;
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

export interface CreateExamSubjectComponentPayload {
  subjectId: string;
  name: string;
  code?: string;
  maximumMarks: number;
  passingMarks?: number;
  weightage?: number;
  displayOrder?: number;
  isOptionalSubject?: boolean;
}

export interface UpdateExamSubjectComponentPayload {
  name?: string;
  code?: string;
  maximumMarks?: number;
  passingMarks?: number;
  weightage?: number;
  displayOrder?: number;
  isOptionalSubject?: boolean;
}

export interface CreateExamMarkPayload {
  examScheduleId: string;
  examSubjectComponentId: string;
  studentId: string;
  marksObtained?: number;
  isAbsent?: boolean;
  remarks?: string;
}

export interface UpdateExamMarkPayload {
  examScheduleId?: string;
  examSubjectComponentId?: string;
  studentId?: string;
  marksObtained?: number;
  isAbsent?: boolean;
  remarks?: string;
}

export interface CreateReportCardPayload {
  sessionId: string;
  studentId: string;
  enrollmentId: string;
  examGroupId?: string;
  scope: "INDIVIDUAL" | "COMBINED";
  teacherRemarks?: Record<string, unknown>;
  pdfUrl?: string;
  status?: "DRAFT" | "GENERATED" | "PUBLISHED";
}

export interface UpdateReportCardPayload {
  teacherRemarks?: Record<string, unknown>;
  pdfUrl?: string;
  status?: "DRAFT" | "GENERATED" | "PUBLISHED";
}

export interface UpdateManualMarksPayload {
  [subjectId: string]: Record<string, number>;
}

export interface UpdateCoScholasticMarksPayload {
  [rowLabel: string]: string;
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

  examGroups: {
    getAll: () => apiClient.get("/academic/exam-groups"),

    getById: (id: string) => apiClient.get(`/academic/exam-groups/${id}`),

    create: (data: CreateExamGroupPayload) => apiClient.post("/academic/exam-groups", data),

    update: (id: string, data: UpdateExamGroupPayload) => apiClient.patch(`/academic/exam-groups/${id}`, data),

    reorder: (data: ReorderExamGroupPayload[]) => apiClient.patch("/academic/exam-groups/reorder", data),

    delete: (id: string) => apiClient.delete(`/academic/exam-groups/${id}`),
  },

  gradingSchemes: {
    getAll: () => apiClient.get("/academic/grading-schemes"),

    getById: (id: string) => apiClient.get(`/academic/grading-schemes/${id}`),

    create: (data: CreateGradingSchemePayload) => apiClient.post("/academic/grading-schemes", data),

    update: (id: string, data: UpdateGradingSchemePayload) => apiClient.patch(`/academic/grading-schemes/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/grading-schemes/${id}`),

    addBand: (schemeId: string, data: CreateGradeBandPayload) => apiClient.post(`/academic/grading-schemes/${schemeId}/bands`, data),

    updateBand: (bandId: string, data: UpdateGradeBandPayload) => apiClient.patch(`/academic/grading-schemes/bands/${bandId}`, data),

    deleteBand: (bandId: string) => apiClient.delete(`/academic/grading-schemes/bands/${bandId}`),
  },

  classExamStructures: {
    getAll: () => apiClient.get("/academic/class-exam-structures"),

    getById: (id: string) => apiClient.get(`/academic/class-exam-structures/${id}`),

    getByClass: (classId: string) => apiClient.get(`/academic/class-exam-structures/class/${classId}`),

    create: (data: CreateClassExamStructurePayload) => apiClient.post("/academic/class-exam-structures", data),

    update: (id: string, data: UpdateClassExamStructurePayload) => apiClient.patch(`/academic/class-exam-structures/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/class-exam-structures/${id}`),

    replaceExamGroupWeights: (id: string, items: ClassExamGroupWeightItem[]) => apiClient.put(`/academic/class-exam-structures/${id}/exam-group-weights`, { items }),
  },

  reportCardTemplates: {
    getAll: (classId?: string) => apiClient.get("/academic/report-card-templates", { params: classId ? { classId } : undefined }),

    getById: (id: string) => apiClient.get(`/academic/report-card-templates/${id}`),

    create: (data: CreateReportCardTemplatePayload) => apiClient.post("/academic/report-card-templates", data),

    update: (id: string, data: UpdateReportCardTemplatePayload) => apiClient.patch(`/academic/report-card-templates/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/report-card-templates/${id}`),

    replaceSections: (id: string, items: ReportCardSectionItem[]) => apiClient.put(`/academic/report-card-templates/${id}/sections`, { items }),

    replaceRemarkFields: (id: string, items: ReportRemarkFieldItem[]) => apiClient.put(`/academic/report-card-templates/${id}/remark-fields`, { items }),

    replaceCoScholasticRows: (id: string, items: ReportCoScholasticRowItem[]) => apiClient.put(`/academic/report-card-templates/${id}/co-scholastic-rows`, { items }),
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

    getSubjectComponents: (examId: string, subjectId?: string) => apiClient.get(`/academic/exams/${examId}/subject-components`, { params: subjectId ? { subjectId } : undefined }),

    createSubjectComponent: (examId: string, data: CreateExamSubjectComponentPayload) => apiClient.post(`/academic/exams/${examId}/subject-components`, data),

    updateSubjectComponent: (componentId: string, data: UpdateExamSubjectComponentPayload) => apiClient.patch(`/academic/exams/subject-components/${componentId}`, data),

    deleteSubjectComponent: (componentId: string) => apiClient.delete(`/academic/exams/subject-components/${componentId}`),

    syncComponents: (classId: string, examGroupId: string) => apiClient.post(`/academic/exams/class/${classId}/exam-group/${examGroupId}/sync-components`),
  },

  examMarks: {
    getAll: () => apiClient.get("/academic/exam-marks"),

    getById: (id: string) => apiClient.get(`/academic/exam-marks/${id}`),

    getBySchedule: (examScheduleId: string) => apiClient.get(`/academic/exam-marks/schedule/${examScheduleId}`),

    create: (data: CreateExamMarkPayload) => apiClient.post("/academic/exam-marks", data),

    update: (id: string, data: UpdateExamMarkPayload) => apiClient.patch(`/academic/exam-marks/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/exam-marks/${id}`),
  },

  classComponentTemplates: {
    getAll: (classId?: string) => apiClient.get("/academic/class-component-templates", { params: classId ? { classId } : undefined }),

    getById: (id: string) => apiClient.get(`/academic/class-component-templates/${id}`),

    getByClassAndExamGroup: (classId: string, examGroupId: string, subjectId?: string) =>
      apiClient.get(`/academic/class-component-templates/class/${classId}/exam-group/${examGroupId}`, { params: subjectId ? { subjectId } : undefined }),

    create: (data: CreateClassSubjectComponentTemplatePayload) => apiClient.post("/academic/class-component-templates", data),

    copy: (data: CopyClassComponentTemplatePayload) => apiClient.post("/academic/class-component-templates/copy", data),

    delete: (id: string) => apiClient.delete(`/academic/class-component-templates/${id}`),

    replaceDefinitions: (id: string, items: ComponentTemplateDefinitionItem[]) => apiClient.put(`/academic/class-component-templates/${id}/definitions`, { items }),
  },

  reportCards: {
    getAll: () => apiClient.get("/academic/report-cards"),

    getById: (id: string) => apiClient.get(`/academic/report-cards/${id}`),

    getByStudent: (studentId: string) => apiClient.get(`/academic/report-cards/student/${studentId}`),

    getByExamGroup: (examGroupId: string) => apiClient.get(`/academic/report-cards/exam-group/${examGroupId}`),

    create: (data: CreateReportCardPayload) => apiClient.post("/academic/report-cards", data),

    update: (id: string, data: UpdateReportCardPayload) => apiClient.patch(`/academic/report-cards/${id}`, data),

    delete: (id: string) => apiClient.delete(`/academic/report-cards/${id}`),

    generateIndividual: (studentId: string, examGroupId: string, sessionId: string, data?: { teacherRemarks?: Record<string, unknown> }) =>
      apiClient.post(`/academic/report-cards/student/${studentId}/exam-group/${examGroupId}/session/${sessionId}/generate`, data),

    generateFinal: (studentId: string, sessionId: string, data?: { teacherRemarks?: Record<string, unknown> }) => apiClient.post(`/academic/report-cards/student/${studentId}/session/${sessionId}/generate-final`, data),

    publish: (id: string) => apiClient.patch(`/academic/report-cards/${id}/publish`),

    unpublish: (id: string) => apiClient.patch(`/academic/report-cards/${id}/unpublish`),

    updateManualMarks: (id: string, manualMarks: UpdateManualMarksPayload) => apiClient.patch(`/academic/report-cards/${id}/manual-marks`, manualMarks),

    updateCoScholasticMarks: (id: string, coScholasticMarks: UpdateCoScholasticMarksPayload) => apiClient.patch(`/academic/report-cards/${id}/co-scholastic-marks`, coScholasticMarks),
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
