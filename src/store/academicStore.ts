import { create } from "zustand";
import {
  academicService,
  CreateAcademicSessionPayload,
  UpdateAcademicSessionPayload,
  Board,
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
  TransferTeacherPayload,
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
  CreateEventPayload,
  UpdateEventPayload,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
  UpdateAssignmentStudentPayload,
  CreateExamGroupPayload,
  UpdateExamGroupPayload,
  ReorderExamGroupPayload,
  CreateGradingSchemePayload,
  UpdateGradingSchemePayload,
  CreateGradeBandPayload,
  UpdateGradeBandPayload,
  CreateClassExamStructurePayload,
  UpdateClassExamStructurePayload,
  ClassExamGroupWeightItem,
  CreateReportCardTemplatePayload,
  UpdateReportCardTemplatePayload,
  ReportCardSectionItem,
  CreateExamPayload,
  UpdateExamPayload,
  CreateExamSchedulePayload,
  UpdateExamSchedulePayload,
  CreateExamSubjectComponentPayload,
  UpdateExamSubjectComponentPayload,
  CreateExamMarkPayload,
  UpdateExamMarkPayload,
  CreateReportCardPayload,
  UpdateReportCardPayload,
  ComponentSource,
  CreateClassSubjectComponentTemplatePayload,
  ComponentTemplateDefinitionItem,
  UpdateManualMarksPayload,
  UpdateCoScholasticMarksPayload,
  ReportRemarkFieldItem,
  ReportCoScholasticRowItem,
} from "@/services/academic.service";
import { AxiosError } from "axios";

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

export interface CalendarEventClassRef {
  id: string;
  classId: string;
  class: AcademicClass;
}

export interface CalendarEventSectionRef {
  id: string;
  sectionId: string;
  section: Section;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  sessionId: string;
  eventType: "HOLIDAY" | "EVENT" | "EXAM" | "PTM" | "SPORTS" | "CULTURAL" | "STAFF_MEETING" | "OTHER";
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  scope: "WHOLE_SCHOOL" | "SPECIFIC_CLASSES" | "SPECIFIC_SECTIONS";
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  session: AcademicSession;
  classes: CalendarEventClassRef[];
  sections: CalendarEventSectionRef[];
}

export interface AcademicClass {
  id: string;
  classCode: string;
  name: string;
  board: Board;
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
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  session: AcademicSession;
  class: AcademicClass;
  section: Section;
  teacher: Teacher;
}

export interface TeacherTransferHistory {
  id: string;
  schoolId: string;
  fromTeacherId: string;
  transferredById?: string;
  effectiveDate: string;
  remarks?: string;
  createdAt: string;

  fromTeacher: Teacher;
  transferredBy?: Teacher;

  subjectTransfers?: {
    id: string;
    toTeacher: Teacher;
    subjectAllocation: SubjectAllocation;
  }[];

  classTransfers?: {
    id: string;
    toTeacher: Teacher;
    classTeacherAssignment: TeacherAssignment;
  }[];
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

export interface AssignmentStudent {
  id: string;
  assignmentId: string;
  studentId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "NOT_SUBMITTED";
  remarks?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  student: Student;
}

export interface Assignment {
  id: string;
  schoolId: string;
  sessionId: string;
  classId: string;
  sectionId: string;
  subjectAllocationId: string;
  teacherId: string;
  type: "HOMEWORK" | "HOLIDAY_HOMEWORK" | "ASSIGNMENT";
  title: string;
  description?: string;
  givenDate: string;
  dueDate?: string;
  attachmentUrl?: string;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  session: AcademicSession;
  class: AcademicClass;
  section: Section;
  subjectAllocation: SubjectAllocation;
  teacher: Teacher;
  students: AssignmentStudent[];
}
export interface ExamGroup {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
  sequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GradeBand {
  id: string;
  gradingSchemeId: string;
  grade: string;
  minPercentage: string;
  maxPercentage: string;
  remark?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GradingScheme {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  isActive: boolean;
  bands: GradeBand[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassExamGroupWeight {
  id: string;
  classExamStructureId: string;
  examGroupId: string;
  weightagePercent?: string;
  includeInFinalResult: boolean;
  displayOrder: number;
  examGroup: ExamGroup;
  createdAt: string;
  updatedAt: string;
}

export interface ClassExamStructure {
  id: string;
  schoolId: string;
  classId: string;
  gradingSchemeId?: string;
  hasOptionalSubject: boolean;
  combineExamGroups: boolean;
  showPerformanceGraph: boolean;
  isActive: boolean;
  notes?: string;
  class: AcademicClass;
  gradingScheme?: GradingScheme;
  examGroupWeights: ClassExamGroupWeight[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportCardSection {
  id: string;
  templateId: string;
  key: string;
  label: string;
  isEnabled: boolean;
  displayOrder: number;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReportRemarkFieldDefinition {
  id: string;
  templateId: string;
  key: string;
  label: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportCoScholasticRowDefinition {
  id: string;
  templateId: string;
  label: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportCardTemplate {
  id: string;
  schoolId: string;
  classId: string;
  examGroupId?: string;
  gradingSchemeId?: string;
  name: string;
  reportScope: "INDIVIDUAL" | "COMBINED";
  showPerformanceGraph: boolean;
  showFinalResultWeightage: boolean;
  isActive: boolean;
  class: AcademicClass;
  examGroup?: ExamGroup;
  gradingScheme?: GradingScheme;
  sections: ReportCardSection[];
  remarkFields: ReportRemarkFieldDefinition[];
  coScholasticRows: ReportCoScholasticRowDefinition[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamSchedule {
  id: string;
  examId: string;
  subjectAllocationId: string;
  examDate: string;
  startTime?: string;
  endTime?: string;
  shift: "MORNING" | "AFTERNOON";
  room?: string;
  createdAt: string;
  updatedAt: string;

  exam: Exam;
  subjectAllocation: SubjectAllocation;
  components: ExamSubjectComponent[];
}

export interface ExamSubjectComponent {
  id: string;
  examId: string;
  subjectId: string;
  subject?: Subject;
  name: string;
  code?: string;
  maximumMarks: string;
  passingMarks?: string;
  weightage?: string;
  displayOrder: number;
  isOptionalSubject: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  schoolId: string;
  sessionId: string;
  examGroupId: string;
  examGroup: ExamGroup;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: "DRAFT" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;

  session: AcademicSession;
  schedules: ExamSchedule[];
  subjectComponents: ExamSubjectComponent[];
}

export interface ExamMark {
  id: string;
  examScheduleId: string;
  examSubjectComponentId: string;
  studentId: string;
  marksObtained?: string;
  isAbsent: boolean;
  remarks?: string;
  createdAt: string;
  updatedAt: string;

  examSchedule: ExamSchedule;
  examSubjectComponent: ExamSubjectComponent;
  student: Student;
}

export interface ReportCardComponentResult {
  id: string;
  name: string;
  maximumMarks: number;
  marksObtained: number | null;
  isAbsent: boolean;
  source: ComponentSource;
}

export interface ReportCardSubjectResult {
  subjectId: string;
  subjectName: string;
  components: ReportCardComponentResult[];
  obtainedTotal: number;
  maxTotal: number;
  percentage: number;
  incomplete: boolean;
}

export interface ReportCardOverallResult {
  obtainedTotal: number;
  maxTotal: number;
  percentage: number;
  grade: string | null;
  remark: string | null;
}

export interface IndividualReportCardResult {
  examGroupId: string;
  examGroupName: string;
  examId: string;
  examName: string;
  subjects: ReportCardSubjectResult[];
  overall: ReportCardOverallResult;
}

export interface CombinedReportCardResult {
  groups: {
    examGroupId: string;
    examGroupName: string;
    weightagePercent: number;
    percentage: number;
  }[];
  subjects: { subjectName: string; weightedPercentage: number }[];
  overall: ReportCardOverallResult;
}

export interface ReportCard {
  id: string;
  schoolId: string;
  sessionId: string;
  studentId: string;
  enrollmentId: string;
  examGroupId?: string;
  templateId?: string;
  scope: "INDIVIDUAL" | "COMBINED";
  reportKey: string;
  teacherRemarks?: Record<string, unknown>;
  reportData?: IndividualReportCardResult | CombinedReportCardResult | Record<string, unknown>;
  manualMarks?: Record<string, Record<string, number>>;
  coScholasticMarks?: Record<string, string>;
  pdfUrl?: string;
  status: "DRAFT" | "GENERATED" | "PUBLISHED";
  generatedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  student: Student;
  session: AcademicSession;
  enrollment: StudentEnrollment;
  examGroup?: ExamGroup;
  template?: ReportCardTemplate;
}

export interface ComponentTemplateDefinition {
  id: string;
  templateId: string;
  name: string;
  source: ComponentSource;
  maximumMarks: string;
  passingMarks?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubjectComponentTemplate {
  id: string;
  schoolId: string;
  classId: string;
  examGroupId: string;
  class: AcademicClass;
  examGroup: ExamGroup;
  definitions: ComponentTemplateDefinition[];
  createdAt: string;
  updatedAt: string;
}

interface AcademicStore {
  sessions: AcademicSession[];
  events: CalendarEvent[];
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
  teacherTransfers: TeacherTransferHistory[];
  facultyAttendances: FacultyAttendance[];
  timetables: Timetable[];
  studentSubjectAllocations: StudentSubjectAllocation[];
  assignments: Assignment[];
  examGroups: ExamGroup[];
  gradingSchemes: GradingScheme[];
  classExamStructures: ClassExamStructure[];
  reportCardTemplates: ReportCardTemplate[];
  exams: Exam[];
  examMarks: ExamMark[];
  examSubjectComponents: ExamSubjectComponent[];
  reportCards: ReportCard[];
  classComponentTemplates: ClassSubjectComponentTemplate[];

  loading: boolean;

  fetchSessions: () => Promise<void>;
  createSession: (data: CreateAcademicSessionPayload) => Promise<void>;
  updateSession: (id: string, data: UpdateAcademicSessionPayload) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  fetchEvents: () => Promise<void>;
  createEvent: (data: CreateEventPayload) => Promise<void>;
  updateEvent: (id: string, data: UpdateEventPayload) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

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

  fetchAssignments: () => Promise<void>;
  createAssignment: (data: CreateAssignmentPayload) => Promise<void>;
  updateAssignment: (id: string, data: UpdateAssignmentPayload) => Promise<void>;
  updateAssignmentStudentStatus: (assignmentId: string, studentId: string, data: UpdateAssignmentStudentPayload) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;

  fetchExamGroups: () => Promise<void>;
  createExamGroup: (data: CreateExamGroupPayload) => Promise<void>;
  updateExamGroup: (id: string, data: UpdateExamGroupPayload) => Promise<void>;
  reorderExamGroups: (data: ReorderExamGroupPayload[]) => Promise<void>;
  deleteExamGroup: (id: string) => Promise<void>;

  fetchGradingSchemes: () => Promise<void>;
  createGradingScheme: (data: CreateGradingSchemePayload) => Promise<void>;
  updateGradingScheme: (id: string, data: UpdateGradingSchemePayload) => Promise<void>;
  deleteGradingScheme: (id: string) => Promise<void>;
  addGradeBand: (schemeId: string, data: CreateGradeBandPayload) => Promise<void>;
  updateGradeBand: (bandId: string, data: UpdateGradeBandPayload) => Promise<void>;
  deleteGradeBand: (bandId: string) => Promise<void>;

  fetchClassExamStructures: () => Promise<void>;
  fetchClassExamStructureByClass: (classId: string) => Promise<void>;
  createClassExamStructure: (data: CreateClassExamStructurePayload) => Promise<void>;
  updateClassExamStructure: (id: string, data: UpdateClassExamStructurePayload) => Promise<void>;
  deleteClassExamStructure: (id: string) => Promise<void>;
  replaceClassExamGroupWeights: (id: string, items: ClassExamGroupWeightItem[]) => Promise<void>;

  fetchReportCardTemplates: (classId?: string) => Promise<void>;
  createReportCardTemplate: (data: CreateReportCardTemplatePayload) => Promise<void>;
  updateReportCardTemplate: (id: string, data: UpdateReportCardTemplatePayload) => Promise<void>;
  deleteReportCardTemplate: (id: string) => Promise<void>;
  replaceReportCardTemplateSections: (id: string, items: ReportCardSectionItem[]) => Promise<void>;
  replaceReportCardTemplateRemarkFields: (id: string, items: ReportRemarkFieldItem[]) => Promise<void>;
  replaceReportCardTemplateCoScholasticRows: (id: string, items: ReportCoScholasticRowItem[]) => Promise<void>;

  fetchClassComponentTemplates: (classId?: string) => Promise<void>;
  fetchClassComponentTemplateByClassAndExamGroup: (classId: string, examGroupId: string) => Promise<void>;
  createClassComponentTemplate: (data: CreateClassSubjectComponentTemplatePayload) => Promise<void>;
  deleteClassComponentTemplate: (id: string) => Promise<void>;
  replaceClassComponentTemplateDefinitions: (id: string, items: ComponentTemplateDefinitionItem[]) => Promise<void>;

  fetchExams: () => Promise<void>;
  createExam: (data: CreateExamPayload) => Promise<void>;
  updateExam: (id: string, data: UpdateExamPayload) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  createExamSchedule: (examId: string, data: CreateExamSchedulePayload) => Promise<void>;
  updateExamSchedule: (scheduleId: string, data: UpdateExamSchedulePayload) => Promise<void>;
  deleteExamSchedule: (scheduleId: string) => Promise<void>;

  fetchExamSubjectComponents: (examId: string, subjectId?: string) => Promise<void>;
  createExamSubjectComponent: (examId: string, data: CreateExamSubjectComponentPayload) => Promise<void>;
  updateExamSubjectComponent: (componentId: string, data: UpdateExamSubjectComponentPayload) => Promise<void>;
  deleteExamSubjectComponent: (componentId: string) => Promise<void>;

  fetchExamMarks: () => Promise<void>;
  createExamMark: (data: CreateExamMarkPayload) => Promise<void>;
  updateExamMark: (id: string, data: UpdateExamMarkPayload) => Promise<void>;
  deleteExamMark: (id: string) => Promise<void>;

  fetchReportCards: () => Promise<void>;
  fetchReportCardsByStudent: (studentId: string) => Promise<void>;
  fetchReportCardsByExamGroup: (examGroupId: string) => Promise<void>;
  createReportCard: (data: CreateReportCardPayload) => Promise<void>;
  updateReportCard: (id: string, data: UpdateReportCardPayload) => Promise<void>;
  deleteReportCard: (id: string) => Promise<void>;
  generateIndividualReportCard: (studentId: string, examGroupId: string, sessionId: string, data?: { teacherRemarks?: Record<string, unknown> }) => Promise<void>;
  generateFinalReportCard: (studentId: string, sessionId: string, data?: { teacherRemarks?: Record<string, unknown> }) => Promise<void>;
  publishReportCard: (id: string) => Promise<void>;
  unpublishReportCard: (id: string) => Promise<void>;
  updateReportCardManualMarks: (id: string, manualMarks: UpdateManualMarksPayload) => Promise<void>;
  updateReportCardCoScholasticMarks: (id: string, coScholasticMarks: UpdateCoScholasticMarksPayload) => Promise<void>;

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

  fetchTeacherTransfers: () => Promise<void>;
  createTeacherTransfer: (data: TransferTeacherPayload) => Promise<void>;

  fetchFacultyAttendances: () => Promise<void>;
  createFacultyAttendance: (data: CreateFacultyAttendancePayload) => Promise<void>;
  updateFacultyAttendance: (id: string, data: UpdateFacultyAttendancePayload) => Promise<void>;
  deleteFacultyAttendance: (id: string) => Promise<void>;

  fetchTimetables: () => Promise<void>;
  createTimetable: (data: CreateTimetablePayload) => Promise<void>;
  updateTimetable: (id: string, data: UpdateTimetablePayload) => Promise<void>;
  deleteTimetable: (id: string) => Promise<void>;

  clearSessions: () => void;
  clearEvents: () => void;
  clearClasses: () => void;
  clearSections: () => void;
  clearSubjects: () => void;
  clearTeachers: () => void;
  clearStudents: () => void;
  clearStudentEnrollments: () => void;
  clearStudentAttendances: () => void;
  clearAssignments: () => void;
  clearExamGroups: () => void;
  clearGradingSchemes: () => void;
  clearClassExamStructures: () => void;
  clearReportCardTemplates: () => void;
  clearClassComponentTemplates: () => void;
  clearExams: () => void;
  clearExamSubjectComponents: () => void;
  clearExamMarks: () => void;
  clearReportCards: () => void;
  clearSubjectAttendances: () => void;
  clearSubjectAllocations: () => void;
  clearStudentSubjectAllocations: () => void;
  clearTeacherAssignments: () => void;
  clearTeacherTransfers: () => void;
  clearFacultyAttendances: () => void;
  clearTimetables: () => void;
}

export const useAcademicStore = create<AcademicStore>((set, get) => ({
  sessions: [],
  events: [],
  classes: [],
  sections: [],
  subjects: [],
  teachers: [],
  students: [],
  studentEnrollments: [],
  studentAttendances: [],
  assignments: [],
  examGroups: [],
  gradingSchemes: [],
  classExamStructures: [],
  reportCardTemplates: [],
  exams: [],
  examMarks: [],
  examSubjectComponents: [],
  reportCards: [],
  classComponentTemplates: [],
  subjectAttendances: [],
  subjectAllocations: [],
  studentSubjectAllocations: [],
  teacherAssignments: [],
  teacherTransfers: [],
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
  // Events
  // ======================

  fetchEvents: async () => {
    try {
      set({ loading: true });

      const response = await academicService.schedule.getAll();

      set({
        events: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch events", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createEvent: async (data) => {
    try {
      await academicService.schedule.create(data);
      await get().fetchEvents();
    } catch (error) {
      throw error;
    }
  },

  updateEvent: async (id, data) => {
    try {
      await academicService.schedule.update(id, data);
      await get().fetchEvents();
    } catch (error) {
      throw error;
    }
  },

  deleteEvent: async (id) => {
    try {
      await academicService.schedule.delete(id);
      await get().fetchEvents();
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
      if (data.isActive !== undefined) {
        await academicService.teachers.updateStatus(id, data.isActive);
      }

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
  // Assignments
  // ======================

  fetchAssignments: async () => {
    try {
      set({ loading: true });
      const response = await academicService.assignments.getAll();
      set({ assignments: response.data.data ?? [] });
    } catch (error) {
      console.error("Failed to fetch assignments", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createAssignment: async (data) => {
    try {
      await academicService.assignments.create(data);
      await get().fetchAssignments();
    } catch (error) {
      throw error;
    }
  },

  updateAssignment: async (id, data) => {
    try {
      await academicService.assignments.update(id, data);
      await get().fetchAssignments();
    } catch (error) {
      throw error;
    }
  },

  updateAssignmentStudentStatus: async (assignmentId, studentId, data) => {
    try {
      await academicService.assignments.updateStudentStatus(assignmentId, studentId, data);
      await get().fetchAssignments();
    } catch (error) {
      throw error;
    }
  },

  deleteAssignment: async (id) => {
    try {
      await academicService.assignments.delete(id);
      await get().fetchAssignments();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Exam Groups
  // ======================

  fetchExamGroups: async () => {
    try {
      set({ loading: true });

      const response = await academicService.examGroups.getAll();

      set({
        examGroups: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch exam groups", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createExamGroup: async (data) => {
    try {
      await academicService.examGroups.create(data);
      await get().fetchExamGroups();
    } catch (error) {
      throw error;
    }
  },

  updateExamGroup: async (id, data) => {
    try {
      await academicService.examGroups.update(id, data);
      await get().fetchExamGroups();
    } catch (error) {
      throw error;
    }
  },

  reorderExamGroups: async (data) => {
    const previous = get().examGroups;

    const optimistic = previous.map((g) => {
      const match = data.find((d) => d.id === g.id);
      return match ? { ...g, sequence: match.sequence } : g;
    });

    optimistic.sort((a, b) => (a.isActive === b.isActive ? a.sequence - b.sequence : a.isActive ? -1 : 1));

    set({ examGroups: optimistic });

    try {
      await academicService.examGroups.reorder(data);
      await get().fetchExamGroups();
    } catch (error) {
      set({ examGroups: previous });
      throw error;
    }
  },

  deleteExamGroup: async (id) => {
    try {
      await academicService.examGroups.delete(id);
      await get().fetchExamGroups();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Grading Schemes
  // ======================

  fetchGradingSchemes: async () => {
    try {
      set({ loading: true });

      const response = await academicService.gradingSchemes.getAll();

      set({
        gradingSchemes: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch grading schemes", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createGradingScheme: async (data) => {
    try {
      await academicService.gradingSchemes.create(data);
      await get().fetchGradingSchemes();
    } catch (error) {
      throw error;
    }
  },

  updateGradingScheme: async (id, data) => {
    try {
      await academicService.gradingSchemes.update(id, data);
      await get().fetchGradingSchemes();
    } catch (error) {
      throw error;
    }
  },

  deleteGradingScheme: async (id) => {
    try {
      await academicService.gradingSchemes.delete(id);
      await get().fetchGradingSchemes();
    } catch (error) {
      throw error;
    }
  },

  addGradeBand: async (schemeId, data) => {
    try {
      await academicService.gradingSchemes.addBand(schemeId, data);
      await get().fetchGradingSchemes();
    } catch (error) {
      throw error;
    }
  },

  updateGradeBand: async (bandId, data) => {
    try {
      await academicService.gradingSchemes.updateBand(bandId, data);
      await get().fetchGradingSchemes();
    } catch (error) {
      throw error;
    }
  },

  deleteGradeBand: async (bandId) => {
    try {
      await academicService.gradingSchemes.deleteBand(bandId);
      await get().fetchGradingSchemes();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Class Exam Structures
  // ======================

  fetchClassExamStructures: async () => {
    try {
      set({ loading: true });

      const response = await academicService.classExamStructures.getAll();

      set({
        classExamStructures: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch class exam structures", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchClassExamStructureByClass: async (classId) => {
    try {
      const response = await academicService.classExamStructures.getByClass(classId);

      const structure = response.data.data;
      const others = get().classExamStructures.filter((s) => s.classId !== classId);

      set({
        classExamStructures: structure ? [...others, structure] : others,
      });
    } catch (error) {
      console.error("Failed to fetch class exam structure", error);
      throw error;
    }
  },

  createClassExamStructure: async (data) => {
    try {
      await academicService.classExamStructures.create(data);
      await get().fetchClassExamStructures();
    } catch (error) {
      throw error;
    }
  },

  updateClassExamStructure: async (id, data) => {
    try {
      await academicService.classExamStructures.update(id, data);
      await get().fetchClassExamStructures();
    } catch (error) {
      throw error;
    }
  },

  deleteClassExamStructure: async (id) => {
    try {
      await academicService.classExamStructures.delete(id);
      await get().fetchClassExamStructures();
    } catch (error) {
      throw error;
    }
  },

  replaceClassExamGroupWeights: async (id, items) => {
    try {
      await academicService.classExamStructures.replaceExamGroupWeights(id, items);
      await get().fetchClassExamStructures();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Report Card Templates
  // ======================

  fetchReportCardTemplates: async (classId) => {
    try {
      set({ loading: true });

      const response = await academicService.reportCardTemplates.getAll(classId);

      set({
        reportCardTemplates: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch report card templates", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createReportCardTemplate: async (data) => {
    try {
      await academicService.reportCardTemplates.create(data);
      await get().fetchReportCardTemplates(data.classId);
    } catch (error) {
      throw error;
    }
  },

  updateReportCardTemplate: async (id, data) => {
    try {
      await academicService.reportCardTemplates.update(id, data);
      await get().fetchReportCardTemplates();
    } catch (error) {
      throw error;
    }
  },

  deleteReportCardTemplate: async (id) => {
    try {
      await academicService.reportCardTemplates.delete(id);
      await get().fetchReportCardTemplates();
    } catch (error) {
      throw error;
    }
  },

  replaceReportCardTemplateSections: async (id, items) => {
    try {
      await academicService.reportCardTemplates.replaceSections(id, items);
      await get().fetchReportCardTemplates();
    } catch (error) {
      throw error;
    }
  },

  replaceReportCardTemplateRemarkFields: async (id, items) => {
    try {
      await academicService.reportCardTemplates.replaceRemarkFields(id, items);
      await get().fetchReportCardTemplates();
    } catch (error) {
      throw error;
    }
  },

  replaceReportCardTemplateCoScholasticRows: async (id, items) => {
    try {
      await academicService.reportCardTemplates.replaceCoScholasticRows(id, items);
      await get().fetchReportCardTemplates();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Class Component Templates (CBSE grade-level marks structure)
  // ======================

  fetchClassComponentTemplates: async (classId) => {
    try {
      set({ loading: true });

      const response = await academicService.classComponentTemplates.getAll(classId);

      set({
        classComponentTemplates: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch class component templates", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchClassComponentTemplateByClassAndExamGroup: async (classId, examGroupId) => {
    try {
      const response = await academicService.classComponentTemplates.getByClassAndExamGroup(classId, examGroupId);

      const template = response.data.data;
      const others = get().classComponentTemplates.filter((t) => !(t.classId === classId && t.examGroupId === examGroupId));

      set({
        classComponentTemplates: template ? [...others, template] : others,
      });
    } catch (error) {
      if ((error as AxiosError)?.response?.status !== 404) {
        console.error("Failed to fetch class component template", error);
      }
      throw error;
    }
  },

  createClassComponentTemplate: async (data) => {
    try {
      await academicService.classComponentTemplates.create(data);
      await get().fetchClassComponentTemplates(data.classId);
    } catch (error) {
      throw error;
    }
  },

  deleteClassComponentTemplate: async (id) => {
    try {
      await academicService.classComponentTemplates.delete(id);
      await get().fetchClassComponentTemplates();
    } catch (error) {
      throw error;
    }
  },

  replaceClassComponentTemplateDefinitions: async (id, items) => {
    try {
      await academicService.classComponentTemplates.replaceDefinitions(id, items);
      await get().fetchClassComponentTemplates();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Exams
  // ======================

  fetchExams: async () => {
    try {
      set({ loading: true });

      const response = await academicService.exams.getAll();

      set({
        exams: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch exams", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createExam: async (data) => {
    try {
      await academicService.exams.create(data);
      await get().fetchExams();
    } catch (error) {
      throw error;
    }
  },

  updateExam: async (id, data) => {
    try {
      await academicService.exams.update(id, data);
      await get().fetchExams();
    } catch (error) {
      throw error;
    }
  },

  deleteExam: async (id) => {
    try {
      await academicService.exams.delete(id);
      await get().fetchExams();
    } catch (error) {
      throw error;
    }
  },

  fetchExamSubjectComponents: async (examId, subjectId) => {
    try {
      const response = await academicService.exams.getSubjectComponents(examId, subjectId);

      set({
        examSubjectComponents: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch exam subject components", error);
      throw error;
    }
  },

  createExamSubjectComponent: async (examId, data) => {
    try {
      await academicService.exams.createSubjectComponent(examId, data);
      await get().fetchExamSubjectComponents(examId);
      await get().fetchExams();
    } catch (error) {
      throw error;
    }
  },

  updateExamSubjectComponent: async (componentId, data) => {
    try {
      await academicService.exams.updateSubjectComponent(componentId, data);
      await get().fetchExams();
    } catch (error) {
      throw error;
    }
  },

  deleteExamSubjectComponent: async (componentId) => {
    try {
      await academicService.exams.deleteSubjectComponent(componentId);
      await get().fetchExams();
    } catch (error) {
      throw error;
    }
  },

  createExamSchedule: async (examId, data) => {
    try {
      await academicService.exams.createSchedule(examId, data);
      await get().fetchExams();
    } catch (error) {
      throw error;
    }
  },

  updateExamSchedule: async (scheduleId, data) => {
    try {
      await academicService.exams.updateSchedule(scheduleId, data);
      await get().fetchExams();
    } catch (error) {
      throw error;
    }
  },

  deleteExamSchedule: async (scheduleId) => {
    try {
      await academicService.exams.deleteSchedule(scheduleId);
      await get().fetchExams();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Exam Marks
  // ======================

  fetchExamMarks: async () => {
    try {
      set({ loading: true });

      const response = await academicService.examMarks.getAll();

      set({
        examMarks: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch exam marks", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createExamMark: async (data) => {
    try {
      await academicService.examMarks.create(data);
      await get().fetchExamMarks();
    } catch (error) {
      throw error;
    }
  },

  updateExamMark: async (id, data) => {
    try {
      await academicService.examMarks.update(id, data);
      await get().fetchExamMarks();
    } catch (error) {
      throw error;
    }
  },

  deleteExamMark: async (id) => {
    try {
      await academicService.examMarks.delete(id);
      await get().fetchExamMarks();
    } catch (error) {
      throw error;
    }
  },

  // ======================
  // Report Cards
  // ======================

  fetchReportCards: async () => {
    try {
      set({ loading: true });

      const response = await academicService.reportCards.getAll();

      set({
        reportCards: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch report cards", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchReportCardsByStudent: async (studentId) => {
    try {
      const response = await academicService.reportCards.getByStudent(studentId);

      set({
        reportCards: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch student report cards", error);
      throw error;
    }
  },

  fetchReportCardsByExamGroup: async (examGroupId) => {
    try {
      const response = await academicService.reportCards.getByExamGroup(examGroupId);

      set({
        reportCards: response.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch exam group report cards", error);
      throw error;
    }
  },

  createReportCard: async (data) => {
    try {
      await academicService.reportCards.create(data);
      await get().fetchReportCards();
    } catch (error) {
      throw error;
    }
  },

  updateReportCard: async (id, data) => {
    try {
      await academicService.reportCards.update(id, data);
      await get().fetchReportCards();
    } catch (error) {
      throw error;
    }
  },

  deleteReportCard: async (id) => {
    try {
      await academicService.reportCards.delete(id);
      await get().fetchReportCards();
    } catch (error) {
      throw error;
    }
  },

  generateIndividualReportCard: async (studentId, examGroupId, sessionId, data) => {
    try {
      await academicService.reportCards.generateIndividual(studentId, examGroupId, sessionId, data);
      await get().fetchReportCards();
    } catch (error) {
      throw error;
    }
  },

  generateFinalReportCard: async (studentId, sessionId, data) => {
    try {
      await academicService.reportCards.generateFinal(studentId, sessionId, data);
      await get().fetchReportCards();
    } catch (error) {
      throw error;
    }
  },

  publishReportCard: async (id) => {
    try {
      await academicService.reportCards.publish(id);
      await get().fetchReportCards();
    } catch (error) {
      throw error;
    }
  },

  unpublishReportCard: async (id) => {
    try {
      await academicService.reportCards.unpublish(id);
      await get().fetchReportCards();
    } catch (error) {
      throw error;
    }
  },

  updateReportCardManualMarks: async (id, manualMarks) => {
    try {
      await academicService.reportCards.updateManualMarks(id, manualMarks);
      await get().fetchReportCards();
    } catch (error) {
      throw error;
    }
  },

  updateReportCardCoScholasticMarks: async (id, coScholasticMarks) => {
    try {
      await academicService.reportCards.updateCoScholasticMarks(id, coScholasticMarks);
      await get().fetchReportCards();
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
  // Teacher Transfers
  // ======================

  fetchTeacherTransfers: async () => {
    try {
      set({ loading: true });
      const response = await academicService.teacherTransfers.getAll();
      set({
        teacherTransfers: response.data.data.data ?? [],
      });
    } catch (error) {
      console.error("Failed to fetch teacher transfers", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createTeacherTransfer: async (data) => {
    try {
      await academicService.teacherTransfers.create(data);
      await get().fetchTeacherTransfers();
      await get().fetchSubjectAllocations();
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

  clearSessions: () =>
    set({
      sessions: [],
    }),

  clearEvents: () =>
    set({
      events: [],
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

  clearAssignments: () =>
    set({
      assignments: [],
    }),

  clearExamGroups: () =>
    set({
      examGroups: [],
    }),

  clearGradingSchemes: () =>
    set({
      gradingSchemes: [],
    }),

  clearClassExamStructures: () =>
    set({
      classExamStructures: [],
    }),

  clearReportCardTemplates: () =>
    set({
      reportCardTemplates: [],
    }),

  clearClassComponentTemplates: () =>
    set({
      classComponentTemplates: [],
    }),

  clearExams: () =>
    set({
      exams: [],
    }),

  clearExamSubjectComponents: () =>
    set({
      examSubjectComponents: [],
    }),

  clearExamMarks: () =>
    set({
      examMarks: [],
    }),

  clearReportCards: () =>
    set({
      reportCards: [],
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

  clearTeacherTransfers: () =>
    set({
      teacherTransfers: [],
    }),

  clearFacultyAttendances: () =>
    set({
      facultyAttendances: [],
    }),

  clearTimetables: () =>
    set({
      timetables: [],
    }),
}));
