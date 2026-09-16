"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Award,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  LayoutTemplate,
  Loader2,
  ListChecks,
  MessageSquareText,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  Undo2,
  UserRound,
  Users,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  useAcademicStore,
  type ExamGroup,
  type Student,
  type StudentEnrollment,
  type Exam,
  type GradingScheme,
  type GradeBand,
  type ClassExamStructure,
  type ReportCardTemplate,
  type AcademicClass,
} from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type ReportCardScopeT = "INDIVIDUAL" | "COMBINED";
type ReportCardStatusT = "DRAFT" | "GENERATED" | "PUBLISHED";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

interface ReportCard {
  id: string;
  schoolId: string;
  sessionId: string;
  studentId: string;
  enrollmentId: string;
  examGroupId?: string | null;
  scope: ReportCardScopeT;
  reportKey: string;
  teacherRemarks?: Record<string, unknown>;
  reportData?: Record<string, unknown>;
  manualMarks?: Record<string, Record<string, number>>;
  coScholasticMarks?: Record<string, string>;
  pdfUrl?: string | null;
  status: ReportCardStatusT;
  generatedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  student: Student;
  session: {
    id: string;
    name: string;
  };
  enrollment: StudentEnrollment;
  examGroup?: ExamGroup | null;
  template?: ReportCardTemplate;
}

const REPORT_STATUS_OPTIONS: {
  value: ReportCardStatusT | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "GENERATED", label: "Generated" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

const REPORT_SCOPE_OPTIONS: {
  value: ReportCardScopeT | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "All Types" },
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "COMBINED", label: "Final Report" },
];

const COMMON_SECTION_PRESETS: { key: string; label: string }[] = [
  { key: "MARKS_TABLE", label: "Marks Table" },
  { key: "GRADE_TABLE", label: "Grade Table" },
  { key: "PERFORMANCE_GRAPH", label: "Performance Graph" },
  { key: "ATTENDANCE", label: "Attendance" },
  { key: "REMARKS", label: "Remarks" },
  { key: "CO_SCHOLASTIC", label: "Co-Scholastic" },
];

const COMMON_REMARK_FIELD_PRESETS: { key: string; label: string }[] = [
  { key: "CLASS_TEACHER", label: "Class Teacher's Remark" },
  { key: "DISCIPLINE", label: "Discipline Remark" },
  { key: "PRINCIPAL", label: "Principal's Remark" },
];

const COMMON_COSCHOLASTIC_PRESETS: string[] = ["Work Education", "Art Education", "Health & Physical Education", "Discipline"];

function statusLabel(status: ReportCardStatusT) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function statusClass(status: ReportCardStatusT) {
  switch (status) {
    case "PUBLISHED":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "GENERATED":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "DRAFT":
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

function scopeLabel(scope: ReportCardScopeT) {
  return scope === "COMBINED" ? "Final Report" : "Individual Report";
}

function studentName(student?: Student | null) {
  if (!student) return "Unknown Student";
  return `${student.firstName} ${student.lastName}`.trim();
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function resolveExamGroupName(exam: Exam, examGroups: ExamGroup[]) {
  return exam.examGroup?.name ?? examGroups.find((group) => group.id === exam.examGroupId)?.name ?? "—";
}

export default function ReportCardsPage() {
  const {
    loading,
    sessions,
    exams,
    examGroups,
    classes,
    gradingSchemes,
    classExamStructures,
    reportCardTemplates,
    studentEnrollments,
    reportCards,

    fetchSessions,
    fetchExams,
    fetchExamGroups,
    fetchClasses,
    fetchGradingSchemes,
    fetchClassExamStructures,
    fetchReportCardTemplates,
    fetchStudents,
    fetchStudentEnrollments,
    fetchReportCards,

    generateIndividualReportCard,
    generateFinalReportCard,
    updateReportCard,
    deleteReportCard,
    publishReportCard,
    unpublishReportCard,
    updateReportCardManualMarks,

    createGradingScheme,
    updateGradingScheme,
    deleteGradingScheme,
    addGradeBand,
    updateGradeBand,
    deleteGradeBand,

    createClassExamStructure,
    updateClassExamStructure,
    deleteClassExamStructure,
    replaceClassExamGroupWeights,

    createReportCardTemplate,
    updateReportCardTemplate,
    deleteReportCardTemplate,
    replaceReportCardTemplateSections,
    replaceReportCardTemplateRemarkFields,
    replaceReportCardTemplateCoScholasticRows,
    updateReportCardCoScholasticMarks,
  } = useAcademicStore();

  const authorized = usePermission("reportcard.read");
  const canCreate = usePermission("reportcard.create");
  const canUpdate = usePermission("reportcard.update");
  const canDelete = usePermission("reportcard.delete");
  const canPublish = usePermission("reportcard.publish");
  const canUpdateGrading = usePermission("grading-scheme.update");
  const canCreateGrading = usePermission("grading-scheme.create");
  const canManageGrading = canUpdateGrading || canCreateGrading;

  const canUpdateStructure = usePermission("class-exam-structure.update");
  const canCreateStructure = usePermission("class-exam-structure.create");
  const canManageStructure = canUpdateStructure || canCreateStructure;

  const canUpdateTemplates = usePermission("report-card-template.update");
  const canCreateTemplates = usePermission("report-card-template.create");
  const canManageTemplates = canUpdateTemplates || canCreateTemplates;
  const canDeleteGrading = usePermission("grading-scheme.delete");
  const canDeleteStructure = usePermission("class-exam-structure.delete");
  const canDeleteTemplates = usePermission("report-card-template.delete");

  // ---------------------------------------------------------
  // Reports tab
  // ---------------------------------------------------------

  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState<ReportCardScopeT | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ReportCardStatusT | "ALL">("ALL");
  const [examGroupFilter, setExamGroupFilter] = useState("ALL");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const selectedReport = useMemo(() => {
    return (reportCards as ReportCard[]).find((report) => report.id === selectedReportId) ?? null;
  }, [reportCards, selectedReportId]);

  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarksReport, setRemarksReport] = useState<ReportCard | null>(null);
  const [remarksFields, setRemarksFields] = useState<{ key: string; label: string }[]>([]);
  const [remarksValues, setRemarksValues] = useState<Record<string, string>>({});

  // CBSE co-scholastic grading (grade-only rows, not marks-based) for one
  // report card. The row DEFINITIONS live on the template; this only fills
  // in each row's grade for this specific student.
  const [coScholasticOpen, setCoScholasticOpen] = useState(false);
  const [coScholasticReport, setCoScholasticReport] = useState<ReportCard | null>(null);
  const [coScholasticValues, setCoScholasticValues] = useState<Record<string, string>>({});
  const [savingCoScholastic, setSavingCoScholastic] = useState(false);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishingReport, setPublishingReport] = useState<ReportCard | null>(null);

  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [unpublishingReport, setUnpublishingReport] = useState<ReportCard | null>(null);

  const [deleteReportOpen, setDeleteReportOpen] = useState(false);
  const [deletingReport, setDeletingReport] = useState<ReportCard | null>(null);

  const [refreshingReportId, setRefreshingReportId] = useState<string | null>(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateScope, setGenerateScope] = useState<ReportCardScopeT>("INDIVIDUAL");
  const [generateExamGroupId, setGenerateExamGroupId] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchExams();
    fetchExamGroups();
    fetchClasses();
    fetchGradingSchemes();
    fetchClassExamStructures();
    fetchReportCardTemplates();
    fetchStudents();
    fetchStudentEnrollments();
    fetchReportCards();
  }, []);

  const activeSessionId = useMemo(() => {
    const active = sessions.find((session) => session.isActive);
    return active?.id ?? sessions[0]?.id ?? "";
  }, [sessions]);

  const effectiveSessionId = sessionFilter === "ALL" ? activeSessionId : sessionFilter;

  const sessionExamGroups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sequence: number }>();

    exams
      .filter((exam) => exam.sessionId === effectiveSessionId)
      .forEach((exam) => {
        if (!map.has(exam.examGroupId)) {
          map.set(exam.examGroupId, {
            id: exam.examGroupId,
            name: resolveExamGroupName(exam, examGroups),
            sequence: examGroups.find((group) => group.id === exam.examGroupId)?.sequence ?? 0,
          });
        }
      });

    return Array.from(map.values()).sort((a, b) => a.sequence - b.sequence);
  }, [exams, effectiveSessionId, examGroups]);

  const sessionEnrollments = useMemo(() => {
    return studentEnrollments.filter((enrollment) => enrollment.sessionId === effectiveSessionId && enrollment.enrollmentStatus !== "DROPPED");
  }, [studentEnrollments, effectiveSessionId]);

  const visibleReports = useMemo(() => {
    return (reportCards as ReportCard[])
      .filter((report) => {
        const fullName = studentName(report.student).toLowerCase();
        const admissionNo = report.student.admissionNo.toLowerCase();
        const examGroupName = report.examGroup?.name?.toLowerCase() ?? "";

        const query = search.toLowerCase().trim();

        const matchesSearch = !query || fullName.includes(query) || admissionNo.includes(query) || examGroupName.includes(query);

        const matchesSession = sessionFilter === "ALL" || report.sessionId === sessionFilter;

        const matchesScope = scopeFilter === "ALL" || report.scope === scopeFilter;

        const matchesStatus = statusFilter === "ALL" || report.status === statusFilter;

        const matchesExamGroup = examGroupFilter === "ALL" || (report.scope === "INDIVIDUAL" && report.examGroupId === examGroupFilter);

        return matchesSearch && matchesSession && matchesScope && matchesStatus && matchesExamGroup;
      })
      .sort((a, b) => {
        const first = new Date(a.generatedAt ?? a.createdAt).getTime();
        const second = new Date(b.generatedAt ?? b.createdAt).getTime();

        return second - first;
      });
  }, [reportCards, search, sessionFilter, scopeFilter, statusFilter, examGroupFilter]);

  const generatedCount = useMemo(() => visibleReports.filter((report) => report.status === "GENERATED").length, [visibleReports]);

  const publishedCount = useMemo(() => visibleReports.filter((report) => report.status === "PUBLISHED").length, [visibleReports]);

  const studentCount = useMemo(() => {
    return sessionEnrollments.length;
  }, [sessionEnrollments]);

  const missingCount = useMemo(() => {
    if (!effectiveSessionId) return 0;

    const keySet = new Set((reportCards as ReportCard[]).map((report) => report.reportKey));

    if (generateScope === "COMBINED") {
      return sessionEnrollments.filter((enrollment) => !keySet.has(`${enrollment.studentId}:COMBINED:FINAL:${effectiveSessionId}`)).length;
    }

    if (!generateExamGroupId) return 0;

    return sessionEnrollments.filter((enrollment) => !keySet.has(`${enrollment.studentId}:INDIVIDUAL:${generateExamGroupId}:${effectiveSessionId}`)).length;
  }, [reportCards, sessionEnrollments, effectiveSessionId, generateScope, generateExamGroupId]);

  const resetFilters = () => {
    setSearch("");
    setSessionFilter("ALL");
    setScopeFilter("ALL");
    setStatusFilter("ALL");
    setExamGroupFilter("ALL");
  };

  const openReport = (report: ReportCard) => {
    setSelectedReportId(report.id);
    setDetailOpen(true);
  };

  // Falls back to a single legacy "Class Teacher's Remarks" field when the
  // report's template has no remark fields configured (CIE, or a class that
  // hasn't set any up yet) - keeps old data readable and editable.
  const getRemarkFieldsForReport = (report: ReportCard): { key: string; label: string }[] => {
    const configured = report.template?.remarkFields ?? [];

    if (configured.length > 0) {
      return [...configured].sort((a, b) => a.displayOrder - b.displayOrder).map((f) => ({ key: f.key, label: f.label }));
    }

    return [{ key: "classTeacher", label: "Class Teacher's Remarks" }];
  };

  const openRemarks = (report: ReportCard) => {
    const fields = getRemarkFieldsForReport(report);
    const existing = readObject(report.teacherRemarks);
    const values: Record<string, string> = {};

    fields.forEach((field) => {
      const value = existing[field.key];
      values[field.key] = typeof value === "string" ? value : "";
    });

    setRemarksReport(report);
    setRemarksFields(fields);
    setRemarksValues(values);
    setRemarksOpen(true);
  };

  const handleSaveRemarks = async (event: FormEvent) => {
    event.preventDefault();

    if (!remarksReport || !canUpdate) return;

    try {
      await updateReportCard(remarksReport.id, {
        teacherRemarks: remarksValues,
      });

      toast.success("Teacher remarks updated");

      setRemarksOpen(false);
      setRemarksReport(null);

      await fetchReportCards();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to update remarks");
    }
  };

  const openCoScholasticGrading = (report: ReportCard) => {
    const rows = report.template?.coScholasticRows ?? [];
    const existing = report.coScholasticMarks ?? {};
    const values: Record<string, string> = {};

    rows.forEach((row) => {
      values[row.label] = existing[row.label] ?? "";
    });

    setCoScholasticReport(report);
    setCoScholasticValues(values);
    setCoScholasticOpen(true);
  };

  const handleSaveCoScholastic = async () => {
    if (!coScholasticReport) return;

    setSavingCoScholastic(true);

    try {
      await updateReportCardCoScholasticMarks(coScholasticReport.id, coScholasticValues);

      toast.success("Co-scholastic grades saved");

      setCoScholasticOpen(false);
      setCoScholasticReport(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save co-scholastic grades");
    } finally {
      setSavingCoScholastic(false);
    }
  };

  const openPublish = (report: ReportCard) => {
    setPublishingReport(report);
    setPublishOpen(true);
  };

  const handlePublish = async () => {
    if (!publishingReport || !canPublish) return;

    try {
      await publishReportCard(publishingReport.id);

      toast.success("Report card published");

      setPublishOpen(false);
      setPublishingReport(null);

      await fetchReportCards();

      if (selectedReport?.id === publishingReport.id) {
        setSelectedReportId(null);
        setDetailOpen(false);
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to publish report card");
    }
  };

  const openUnpublish = (report: ReportCard) => {
    setUnpublishingReport(report);
    setUnpublishOpen(true);
  };

  const handleUnpublish = async () => {
    if (!unpublishingReport || !canPublish) return;

    try {
      await unpublishReportCard(unpublishingReport.id);

      toast.success("Report card unpublished — it can now be refreshed or edited");

      setUnpublishOpen(false);
      setUnpublishingReport(null);

      await fetchReportCards();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to unpublish report card");
    }
  };

  const openDeleteReport = (report: ReportCard) => {
    setDeletingReport(report);
    setDeleteReportOpen(true);
  };

  const handleDeleteReport = async () => {
    if (!deletingReport || !canDelete) return;

    try {
      await deleteReportCard(deletingReport.id);

      toast.success("Report card deleted");

      setDeleteReportOpen(false);
      setDeletingReport(null);

      if (selectedReport?.id === deletingReport.id) {
        setSelectedReportId(null);
        setDetailOpen(false);
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to delete report card");
    }
  };

  const handleRefresh = async (report: ReportCard) => {
    if (!canCreate) return;

    setRefreshingReportId(report.id);

    try {
      if (report.scope === "COMBINED") {
        await generateFinalReportCard(report.studentId, report.sessionId, {});
      } else if (report.examGroupId) {
        await generateIndividualReportCard(report.studentId, report.examGroupId, report.sessionId, {});
      }

      toast.success("Report card refreshed with the latest marks");

      await fetchReportCards();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to refresh report card");
    } finally {
      setRefreshingReportId(null);
    }
  };

  const openGenerate = () => {
    setGenerateScope("INDIVIDUAL");
    setGenerateExamGroupId(sessionExamGroups[0]?.id ?? "");
    setGenerateOpen(true);
  };

  const handleGenerate = async () => {
    if (!effectiveSessionId || !canCreate) return;

    if (generateScope === "INDIVIDUAL" && !generateExamGroupId) {
      toast.error("Select an exam group");
      return;
    }

    setGenerating(true);

    try {
      const existingKeys = new Set((reportCards as ReportCard[]).map((report) => report.reportKey));

      const missingStudents = sessionEnrollments.filter((enrollment) => {
        const key = generateScope === "COMBINED" ? `${enrollment.studentId}:COMBINED:FINAL:${effectiveSessionId}` : `${enrollment.studentId}:INDIVIDUAL:${generateExamGroupId}:${effectiveSessionId}`;

        return !existingKeys.has(key);
      });

      if (!missingStudents.length) {
        toast.success("All eligible report cards are already generated");
        setGenerateOpen(false);
        return;
      }

      const tasks = missingStudents.map((enrollment) =>
        generateScope === "COMBINED" ? generateFinalReportCard(enrollment.studentId, effectiveSessionId, {}) : generateIndividualReportCard(enrollment.studentId, generateExamGroupId, effectiveSessionId, {})
      );

      const results = await Promise.allSettled(tasks);
      const succeeded = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.length - succeeded;

      await fetchReportCards();

      if (failed === 0) {
        toast.success(`${succeeded} report card${succeeded === 1 ? "" : "s"} generated`);
      } else if (succeeded === 0) {
        const firstFailure = results.find((result) => result.status === "rejected") as PromiseRejectedResult | undefined;
        const err = firstFailure?.reason as AxiosError<ApiErrorResponse> | undefined;

        toast.error(err?.response?.data?.message || `Failed to generate report cards (${failed} failed)`);
      } else {
        toast.success(`${succeeded} generated, ${failed} skipped (e.g. missing marks or class doesn't combine terms)`);
      }

      setGenerateOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to generate report cards");
    } finally {
      setGenerating(false);
    }
  };

  const data = readObject(selectedReport?.reportData);
  const overall = readObject(data.overall);
  const isCombined = selectedReport?.scope === "COMBINED";
  const subjects = readArray(data.subjects);
  const combinedGroups = isCombined ? readArray(data.groups) : [];

  // ---------------------------------------------------------
  // Manual marks entry (CBSE) - Practical/Assessment/etc. values a
  // teacher types in directly, separate from real exam marks.
  // ---------------------------------------------------------

  const [manualMarksOpen, setManualMarksOpen] = useState(false);
  const [manualMarksReport, setManualMarksReport] = useState<ReportCard | null>(null);
  const [manualMarksRows, setManualMarksRows] = useState<{ subjectId: string; subjectName: string; components: { name: string; maximumMarks: number; value: string }[] }[]>([]);
  const [savingManualMarks, setSavingManualMarks] = useState(false);

  const hasManualComponents = (report: ReportCard) => {
    const reportData = readObject(report.reportData);
    return readArray(reportData.subjects).some((item) => readArray(readObject(item).components).some((c) => readObject(c).source === "MANUAL"));
  };

  const openManualMarks = (report: ReportCard) => {
    const reportData = readObject(report.reportData);
    const existingManual = (report.manualMarks ?? {}) as Record<string, Record<string, number>>;

    const rows = readArray(reportData.subjects)
      .map((item) => readObject(item))
      .map((subject) => {
        const subjectId = String(subject.subjectId ?? "");
        const manualComponents = readArray(subject.components)
          .map((c) => readObject(c))
          .filter((c) => c.source === "MANUAL");

        return {
          subjectId,
          subjectName: String(subject.subjectName ?? ""),
          components: manualComponents.map((c) => {
            const name = String(c.name ?? "");
            const existingValue = existingManual[subjectId]?.[name];

            return {
              name,
              maximumMarks: Number(c.maximumMarks ?? 0),
              value: existingValue != null ? String(existingValue) : "",
            };
          }),
        };
      })
      .filter((row) => row.components.length > 0);

    setManualMarksReport(report);
    setManualMarksRows(rows);
    setManualMarksOpen(true);
  };

  const updateManualMarksValue = (subjectIndex: number, componentIndex: number, value: string) => {
    setManualMarksRows((previous) => previous.map((row, ri) => (ri === subjectIndex ? { ...row, components: row.components.map((c, ci) => (ci === componentIndex ? { ...c, value } : c)) } : row)));
  };

  const handleSaveManualMarks = async () => {
    if (!manualMarksReport) return;

    for (const row of manualMarksRows) {
      for (const component of row.components) {
        if (component.value.trim() && (Number.isNaN(Number(component.value)) || Number(component.value) < 0 || Number(component.value) > component.maximumMarks)) {
          toast.error(`${component.name} for ${row.subjectName} must be between 0 and ${component.maximumMarks}`);
          return;
        }
      }
    }

    const payload: Record<string, Record<string, number>> = {};

    manualMarksRows.forEach((row) => {
      row.components.forEach((component) => {
        if (component.value.trim()) {
          payload[row.subjectId] = payload[row.subjectId] ?? {};
          payload[row.subjectId][component.name] = Number(component.value);
        }
      });
    });

    setSavingManualMarks(true);

    try {
      await updateReportCardManualMarks(manualMarksReport.id, payload);

      toast.success("Manual marks saved");

      setManualMarksOpen(false);
      setManualMarksReport(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save manual marks");
    } finally {
      setSavingManualMarks(false);
    }
  };

  // ---------------------------------------------------------
  // Grading Schemes tab
  // ---------------------------------------------------------

  const [editingScheme, setEditingScheme] = useState<GradingScheme | null>(null);
  const [schemeName, setSchemeName] = useState("");
  const [schemeDescription, setSchemeDescription] = useState("");
  const [schemeIsActive, setSchemeIsActive] = useState(true);
  const [schemeDeleteOpen, setSchemeDeleteOpen] = useState(false);
  const [deletingScheme, setDeletingScheme] = useState<GradingScheme | null>(null);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  const [editingBand, setEditingBand] = useState<GradeBand | null>(null);
  const [bandSchemeId, setBandSchemeId] = useState<string | null>(null);
  const [bandGrade, setBandGrade] = useState("");
  const [bandMin, setBandMin] = useState("");
  const [bandMax, setBandMax] = useState("");
  const [bandRemark, setBandRemark] = useState("");
  const [bandDisplayOrder, setBandDisplayOrder] = useState("1");
  const [bandDeleteOpen, setBandDeleteOpen] = useState(false);
  const [deletingBand, setDeletingBand] = useState<{ schemeId: string; band: GradeBand } | null>(null);

  const resetSchemeForm = () => {
    setEditingScheme(null);
    setSchemeName("");
    setSchemeDescription("");
    setSchemeIsActive(true);
  };

  const openEditScheme = (scheme: GradingScheme) => {
    setEditingScheme(scheme);
    setSchemeName(scheme.name);
    setSchemeDescription(scheme.description ?? "");
    setSchemeIsActive(scheme.isActive);
  };

  const handleSaveScheme = async (event: FormEvent) => {
    event.preventDefault();

    if (!schemeName.trim()) {
      toast.error("Grading scheme name is required");
      return;
    }

    try {
      if (editingScheme) {
        await updateGradingScheme(editingScheme.id, {
          name: schemeName.trim(),
          description: schemeDescription.trim() || undefined,
          isActive: schemeIsActive,
        });
        toast.success("Grading scheme updated");
      } else {
        await createGradingScheme({
          name: schemeName.trim(),
          description: schemeDescription.trim() || undefined,
          isActive: schemeIsActive,
        });
        toast.success("Grading scheme created");
      }
      resetSchemeForm();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save grading scheme");
    }
  };

  const openDeleteScheme = (scheme: GradingScheme) => {
    setDeletingScheme(scheme);
    setSchemeDeleteOpen(true);
  };

  const handleDeleteScheme = async () => {
    if (!deletingScheme) return;
    try {
      await deleteGradingScheme(deletingScheme.id);
      toast.success("Grading scheme deleted");
      setSchemeDeleteOpen(false);
      setDeletingScheme(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to delete grading scheme");
    }
  };

  const resetBandForm = (schemeId: string) => {
    setEditingBand(null);
    setBandSchemeId(schemeId);
    setBandGrade("");
    setBandMin("");
    setBandMax("");
    setBandRemark("");

    const scheme = gradingSchemes.find((item) => item.id === schemeId);
    setBandDisplayOrder(String((scheme?.bands.length ?? 0) + 1));
  };

  const openEditBand = (schemeId: string, band: GradeBand) => {
    setEditingBand(band);
    setBandSchemeId(schemeId);
    setBandGrade(band.grade);
    setBandMin(String(band.minPercentage));
    setBandMax(String(band.maxPercentage));
    setBandRemark(band.remark ?? "");
    setBandDisplayOrder(String(band.displayOrder));
  };

  const handleSaveBand = async (event: FormEvent) => {
    event.preventDefault();

    if (!bandSchemeId) return;

    if (!bandGrade.trim()) {
      toast.error("Grade is required");
      return;
    }

    const min = Number(bandMin);
    const max = Number(bandMax);
    const displayOrder = Number(bandDisplayOrder);

    if (Number.isNaN(min) || min < 0 || min > 100) {
      toast.error("Minimum percentage must be between 0 and 100");
      return;
    }

    if (Number.isNaN(max) || max < 0 || max > 100) {
      toast.error("Maximum percentage must be between 0 and 100");
      return;
    }

    if (min > max) {
      toast.error("Minimum percentage cannot exceed maximum percentage");
      return;
    }

    try {
      if (editingBand) {
        await updateGradeBand(editingBand.id, {
          grade: bandGrade.trim(),
          minPercentage: min,
          maxPercentage: max,
          remark: bandRemark.trim() || undefined,
          displayOrder,
        });
        toast.success("Grade band updated");
      } else {
        await addGradeBand(bandSchemeId, {
          grade: bandGrade.trim(),
          minPercentage: min,
          maxPercentage: max,
          remark: bandRemark.trim() || undefined,
          displayOrder,
        });
        toast.success("Grade band added");
      }
      resetBandForm(bandSchemeId);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save grade band");
    }
  };

  const openDeleteBand = (schemeId: string, band: GradeBand) => {
    setDeletingBand({ schemeId, band });
    setBandDeleteOpen(true);
  };

  const handleDeleteBand = async () => {
    if (!deletingBand) return;
    try {
      await deleteGradeBand(deletingBand.band.id);
      toast.success("Grade band deleted");
      setBandDeleteOpen(false);
      setDeletingBand(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to delete grade band");
    }
  };

  // ---------------------------------------------------------
  // Class Exam Structure tab
  // ---------------------------------------------------------

  const sortedClasses = useMemo(() => [...classes].sort((a, b) => a.sortOrder - b.sortOrder), [classes]);
  const sortedExamGroupsAll = useMemo(() => [...examGroups].sort((a, b) => a.sequence - b.sequence), [examGroups]);

  const [structureClassId, setStructureClassId] = useState("");
  const [structureGradingSchemeId, setStructureGradingSchemeId] = useState("");
  const [structureHasOptionalSubject, setStructureHasOptionalSubject] = useState(false);
  const [structureCombineExamGroups, setStructureCombineExamGroups] = useState(false);
  const [structureShowPerformanceGraph, setStructureShowPerformanceGraph] = useState(false);
  const [structureNotes, setStructureNotes] = useState("");
  const [structureWeights, setStructureWeights] = useState<Record<string, { weightagePercent: string; includeInFinalResult: boolean }>>({});
  const [savingStructure, setSavingStructure] = useState(false);
  const [structureDeleteOpen, setStructureDeleteOpen] = useState(false);

  const existingStructure = useMemo<ClassExamStructure | null>(() => {
    return classExamStructures.find((structure) => structure.classId === structureClassId) ?? null;
  }, [classExamStructures, structureClassId]);

  const [loadedStructureKey, setLoadedStructureKey] = useState<string | null>(null);
  const structureKey = structureClassId ? `${structureClassId}:${existingStructure?.id ?? "new"}` : null;

  if (structureKey && structureKey !== loadedStructureKey) {
    setLoadedStructureKey(structureKey);

    setStructureGradingSchemeId(existingStructure?.gradingSchemeId ?? "");
    setStructureHasOptionalSubject(existingStructure?.hasOptionalSubject ?? false);
    setStructureCombineExamGroups(existingStructure?.combineExamGroups ?? false);
    setStructureShowPerformanceGraph(existingStructure?.showPerformanceGraph ?? false);
    setStructureNotes(existingStructure?.notes ?? "");

    const weightMap: Record<string, { weightagePercent: string; includeInFinalResult: boolean }> = {};
    sortedExamGroupsAll.forEach((group) => {
      const existingWeight = existingStructure?.examGroupWeights.find((item) => item.examGroupId === group.id);
      weightMap[group.id] = {
        weightagePercent: existingWeight?.weightagePercent != null ? String(existingWeight.weightagePercent) : "",
        includeInFinalResult: existingWeight?.includeInFinalResult ?? true,
      };
    });
    setStructureWeights(weightMap);
  }

  const updateStructureWeight = (groupId: string, field: "weightagePercent" | "includeInFinalResult", value: string | boolean) => {
    setStructureWeights((previous) => ({
      ...previous,
      [groupId]: {
        ...(previous[groupId] ?? { weightagePercent: "", includeInFinalResult: true }),
        [field]: value,
      },
    }));
  };

  const handleSaveStructure = async () => {
    if (!structureClassId) {
      toast.error("Select a class first");
      return;
    }

    const weightItems = sortedExamGroupsAll.map((group) => {
      const row = structureWeights[group.id] ?? { weightagePercent: "", includeInFinalResult: true };
      return {
        examGroupId: group.id,
        weightagePercent: row.weightagePercent.trim() ? Number(row.weightagePercent) : undefined,
        includeInFinalResult: row.includeInFinalResult,
      };
    });

    const totalWeight = weightItems.filter((item) => item.includeInFinalResult).reduce((sum, item) => sum + (item.weightagePercent ?? 0), 0);

    if (totalWeight > 100) {
      toast.error(`Weightages that count toward the final result add up to ${totalWeight}%, which exceeds 100%`);
      return;
    }

    const payload = {
      gradingSchemeId: structureGradingSchemeId || undefined,
      hasOptionalSubject: structureHasOptionalSubject,
      combineExamGroups: structureCombineExamGroups,
      showPerformanceGraph: structureShowPerformanceGraph,
      notes: structureNotes.trim() || undefined,
    };

    setSavingStructure(true);

    try {
      if (existingStructure) {
        await updateClassExamStructure(existingStructure.id, payload);

        if (weightItems.length > 0) {
          await replaceClassExamGroupWeights(existingStructure.id, weightItems);
        }
      } else {
        await createClassExamStructure({ classId: structureClassId, ...payload });

        const created = useAcademicStore.getState().classExamStructures.find((structure) => structure.classId === structureClassId);

        if (created && weightItems.length > 0) {
          await replaceClassExamGroupWeights(created.id, weightItems);
        }
      }

      toast.success("Class exam structure saved");

      await fetchClassExamStructures();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save class exam structure");
    } finally {
      setSavingStructure(false);
    }
  };

  const handleDeleteStructure = async () => {
    if (!existingStructure) return;
    try {
      await deleteClassExamStructure(existingStructure.id);
      toast.success("Class exam structure deleted");
      setStructureDeleteOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to delete class exam structure");
    }
  };

  // ---------------------------------------------------------
  // Report Card Templates tab
  // ---------------------------------------------------------

  const [templateClassFilter, setTemplateClassFilter] = useState("ALL");
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportCardTemplate | null>(null);
  const [templateClassId, setTemplateClassId] = useState("");
  const [templateScope, setTemplateScope] = useState<ReportCardScopeT>("INDIVIDUAL");
  const [templateExamGroupId, setTemplateExamGroupId] = useState("");
  const [templateGradingSchemeId, setTemplateGradingSchemeId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateShowGraph, setTemplateShowGraph] = useState(false);
  const [templateShowWeightage, setTemplateShowWeightage] = useState(false);
  const [templateIsActive, setTemplateIsActive] = useState(true);
  const [templateDeleteOpen, setTemplateDeleteOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<ReportCardTemplate | null>(null);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [sectionsTemplate, setSectionsTemplate] = useState<ReportCardTemplate | null>(null);
  const [sectionRows, setSectionRows] = useState<{ key: string; label: string; isEnabled: boolean; displayOrder: number }[]>([]);
  const [newSectionKey, setNewSectionKey] = useState("");
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [savingSections, setSavingSections] = useState(false);

  const visibleTemplates = useMemo(() => {
    return reportCardTemplates.filter((template) => templateClassFilter === "ALL" || template.classId === templateClassFilter);
  }, [reportCardTemplates, templateClassFilter]);

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateClassId("");
    setTemplateScope("INDIVIDUAL");
    setTemplateExamGroupId("");
    setTemplateGradingSchemeId("");
    setTemplateName("");
    setTemplateShowGraph(false);
    setTemplateShowWeightage(false);
    setTemplateIsActive(true);
  };

  const openAddTemplate = () => {
    resetTemplateForm();
    setTemplateFormOpen(true);
  };

  const openEditTemplate = (template: ReportCardTemplate) => {
    setEditingTemplate(template);
    setTemplateClassId(template.classId);
    setTemplateScope(template.reportScope);
    setTemplateExamGroupId(template.examGroupId ?? "");
    setTemplateGradingSchemeId(template.gradingSchemeId ?? "");
    setTemplateName(template.name);
    setTemplateShowGraph(template.showPerformanceGraph);
    setTemplateShowWeightage(template.showFinalResultWeightage);
    setTemplateIsActive(template.isActive);
    setTemplateFormOpen(true);
  };

  const handleSaveTemplate = async (event: FormEvent) => {
    event.preventDefault();

    if (!templateClassId) {
      toast.error("Select a class");
      return;
    }

    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (templateScope === "INDIVIDUAL" && !templateExamGroupId) {
      toast.error("Select an exam group for an individual template");
      return;
    }

    try {
      if (editingTemplate) {
        await updateReportCardTemplate(editingTemplate.id, {
          name: templateName.trim(),
          gradingSchemeId: templateGradingSchemeId || undefined,
          showPerformanceGraph: templateShowGraph,
          showFinalResultWeightage: templateShowWeightage,
          isActive: templateIsActive,
        });
        toast.success("Report card template updated");
      } else {
        await createReportCardTemplate({
          classId: templateClassId,
          examGroupId: templateScope === "INDIVIDUAL" ? templateExamGroupId : undefined,
          gradingSchemeId: templateGradingSchemeId || undefined,
          name: templateName.trim(),
          reportScope: templateScope,
          showPerformanceGraph: templateShowGraph,
          showFinalResultWeightage: templateShowWeightage,
          isActive: templateIsActive,
        });
        toast.success("Report card template created");
      }

      setTemplateFormOpen(false);
      resetTemplateForm();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save report card template");
    }
  };

  const openDeleteTemplate = (template: ReportCardTemplate) => {
    setDeletingTemplate(template);
    setTemplateDeleteOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteReportCardTemplate(deletingTemplate.id);
      toast.success("Report card template deleted");
      setTemplateDeleteOpen(false);
      setDeletingTemplate(null);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to delete report card template");
    }
  };

  const openSectionsManager = (template: ReportCardTemplate) => {
    setSectionsTemplate(template);
    setSectionRows(
      [...template.sections]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((section) => ({
          key: section.key,
          label: section.label,
          isEnabled: section.isEnabled,
          displayOrder: section.displayOrder,
        }))
    );
    setNewSectionKey("");
    setNewSectionLabel("");
    setSectionsOpen(true);
  };

  const addSectionRow = (key: string, label: string) => {
    if (!key.trim() || !label.trim()) return;

    if (sectionRows.some((row) => row.key === key.trim())) {
      toast.error("This section key is already in the list");
      return;
    }

    setSectionRows((previous) => [...previous, { key: key.trim(), label: label.trim(), isEnabled: true, displayOrder: previous.length + 1 }]);
  };

  const removeSectionRow = (key: string) => {
    setSectionRows((previous) => previous.filter((row) => row.key !== key));
  };

  const toggleSectionEnabled = (key: string, value: boolean) => {
    setSectionRows((previous) => previous.map((row) => (row.key === key ? { ...row, isEnabled: value } : row)));
  };

  const updateSectionOrder = (key: string, value: string) => {
    const order = Number(value);
    if (Number.isNaN(order)) return;
    setSectionRows((previous) => previous.map((row) => (row.key === key ? { ...row, displayOrder: order } : row)));
  };

  const handleSaveSections = async () => {
    if (!sectionsTemplate) return;

    if (sectionRows.length === 0) {
      toast.error("Add at least one section");
      return;
    }

    setSavingSections(true);

    try {
      await replaceReportCardTemplateSections(sectionsTemplate.id, sectionRows);
      toast.success("Report card sections saved");
      setSectionsOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save report card sections");
    } finally {
      setSavingSections(false);
    }
  };

  // ---------------------------------------------------------
  // Remark field definitions manager (per template)
  // ---------------------------------------------------------

  const [remarkFieldsManagerOpen, setRemarkFieldsManagerOpen] = useState(false);
  const [remarkFieldsManagerTemplate, setRemarkFieldsManagerTemplate] = useState<ReportCardTemplate | null>(null);
  const [remarkFieldRows, setRemarkFieldRows] = useState<{ key: string; label: string; displayOrder: number }[]>([]);
  const [newRemarkFieldKey, setNewRemarkFieldKey] = useState("");
  const [newRemarkFieldLabel, setNewRemarkFieldLabel] = useState("");
  const [savingRemarkFields, setSavingRemarkFields] = useState(false);

  const openRemarkFieldsManager = (template: ReportCardTemplate) => {
    setRemarkFieldsManagerTemplate(template);
    setRemarkFieldRows([...template.remarkFields].sort((a, b) => a.displayOrder - b.displayOrder).map((f) => ({ key: f.key, label: f.label, displayOrder: f.displayOrder })));
    setNewRemarkFieldKey("");
    setNewRemarkFieldLabel("");
    setRemarkFieldsManagerOpen(true);
  };

  const addRemarkFieldRow = (key: string, label: string) => {
    if (!key.trim() || !label.trim()) return;

    if (remarkFieldRows.some((row) => row.key === key.trim())) {
      toast.error("This remark key is already in the list");
      return;
    }

    setRemarkFieldRows((previous) => [...previous, { key: key.trim(), label: label.trim(), displayOrder: previous.length + 1 }]);
  };

  const removeRemarkFieldRow = (key: string) => {
    setRemarkFieldRows((previous) => previous.filter((row) => row.key !== key));
  };

  const handleSaveRemarkFields = async () => {
    if (!remarkFieldsManagerTemplate) return;

    if (remarkFieldRows.length === 0) {
      toast.error("Add at least one remark field");
      return;
    }

    setSavingRemarkFields(true);

    try {
      await replaceReportCardTemplateRemarkFields(remarkFieldsManagerTemplate.id, remarkFieldRows);
      toast.success("Remark fields saved");
      setRemarkFieldsManagerOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save remark fields");
    } finally {
      setSavingRemarkFields(false);
    }
  };

  // ---------------------------------------------------------
  // Co-scholastic row definitions manager (per template)
  // ---------------------------------------------------------

  const [coScholasticManagerOpen, setCoScholasticManagerOpen] = useState(false);
  const [coScholasticManagerTemplate, setCoScholasticManagerTemplate] = useState<ReportCardTemplate | null>(null);
  const [coScholasticRowsDraft, setCoScholasticRowsDraft] = useState<{ label: string; displayOrder: number }[]>([]);
  const [newCoScholasticRowLabel, setNewCoScholasticRowLabel] = useState("");
  const [savingCoScholasticRows, setSavingCoScholasticRows] = useState(false);

  const openCoScholasticManager = (template: ReportCardTemplate) => {
    setCoScholasticManagerTemplate(template);
    setCoScholasticRowsDraft([...template.coScholasticRows].sort((a, b) => a.displayOrder - b.displayOrder).map((row) => ({ label: row.label, displayOrder: row.displayOrder })));
    setNewCoScholasticRowLabel("");
    setCoScholasticManagerOpen(true);
  };

  const addCoScholasticRowDraft = (label: string) => {
    if (!label.trim()) return;

    if (coScholasticRowsDraft.some((row) => row.label.toLowerCase() === label.trim().toLowerCase())) {
      toast.error("This row already exists");
      return;
    }

    setCoScholasticRowsDraft((previous) => [...previous, { label: label.trim(), displayOrder: previous.length + 1 }]);
  };

  const removeCoScholasticRowDraft = (label: string) => {
    setCoScholasticRowsDraft((previous) => previous.filter((row) => row.label !== label));
  };

  const handleSaveCoScholasticRows = async () => {
    if (!coScholasticManagerTemplate) return;

    if (coScholasticRowsDraft.length === 0) {
      toast.error("Add at least one row");
      return;
    }

    setSavingCoScholasticRows(true);

    try {
      await replaceReportCardTemplateCoScholasticRows(coScholasticManagerTemplate.id, coScholasticRowsDraft);
      toast.success("Co-scholastic rows saved");
      setCoScholasticManagerOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Failed to save co-scholastic rows");
    } finally {
      setSavingCoScholasticRows(false);
    }
  };

  if (authorized === null) {
    return null;
  }

  if (!authorized) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <ClipboardList className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Access restricted</h2>
            <p className="mt-1 text-sm text-muted-foreground">You do not have permission to view report cards.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="size-5" />
              </div>

              <div>
                <h1 className="text-xl font-bold sm:text-2xl">Report Cards</h1>

                <p className="text-sm text-muted-foreground">Automatically computed academic performance reports</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="reports">
          <TabsList>
            <TabsTrigger value="reports" className="gap-1.5">
              <ClipboardList className="size-4" />
              Report Cards
            </TabsTrigger>

            <TabsTrigger value="grading" className="gap-1.5">
              <Award className="size-4" />
              Grading Schemes
            </TabsTrigger>

            <TabsTrigger value="structure" className="gap-1.5">
              <Sliders className="size-4" />
              Class Exam Structure
            </TabsTrigger>

            <TabsTrigger value="templates" className="gap-1.5">
              <LayoutTemplate className="size-4" />
              Report Templates
            </TabsTrigger>
          </TabsList>

          {/* =====================================================
              Reports tab
          ===================================================== */}
          <TabsContent value="reports" className="space-y-6 pt-6">
            <div className="flex justify-end">
              {canCreate && (
                <Button className="gap-2" onClick={openGenerate}>
                  <Sparkles className="size-4" />
                  Generate Report Cards
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Students</span>
                  <Users className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-bold">{studentCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">Current session</p>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Report Cards</span>
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-bold">{visibleReports.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Matching filters</p>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generated</span>
                  <CheckCircle2 className="size-4 text-blue-500" />
                </div>
                <p className="mt-2 text-2xl font-bold">{generatedCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">Ready for review</p>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Published</span>
                  <Send className="size-4 text-green-500" />
                </div>
                <p className="mt-2 text-2xl font-bold">{publishedCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">Visible to parents</p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px_auto]">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, admission no., exam group..." className="h-10 pl-10" />
                </div>

                <Select
                  value={sessionFilter}
                  onValueChange={(value) => {
                    setSessionFilter(value);
                    setExamGroupFilter("ALL");
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Session" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">All Sessions</SelectItem>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={examGroupFilter} onValueChange={setExamGroupFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Exam Group" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">All Exam Groups</SelectItem>
                    {sessionExamGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={scopeFilter} onValueChange={(value) => setScopeFilter(value as ReportCardScopeT | "ALL")}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {REPORT_SCOPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button type="button" variant="outline" className="h-10 gap-2" onClick={resetFilters}>
                  <RefreshCw className="size-4" />
                  Reset
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-4">
                {REPORT_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value as ReportCardStatusT | "ALL")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      statusFilter === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card">
              <div className="border-b px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="size-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Report Cards</span>
                      <span className="text-xs text-muted-foreground">({visibleReports.length})</span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">Computed automatically from exam marks</p>
                  </div>

                  {canCreate && missingCount > 0 && (
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openGenerate}>
                      <Sparkles className="size-3.5" />
                      {missingCount} missing
                    </Button>
                  )}
                </div>
              </div>

              {loading && !visibleReports.length ? (
                <div className="flex min-h-60 items-center justify-center">
                  <Loader2 className="size-7 animate-spin text-muted-foreground" />
                </div>
              ) : visibleReports.length === 0 ? (
                <div className="p-12 text-center">
                  <ClipboardList className="mx-auto size-9 text-muted-foreground" />
                  <h3 className="mt-3 font-semibold">No report cards found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Generate report cards for the selected academic session.</p>
                  {canCreate && (
                    <Button className="mt-5 gap-2" onClick={openGenerate}>
                      <Sparkles className="size-4" />
                      Generate Report Cards
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {visibleReports.map((report) => (
                    <div key={report.id} className="group flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-muted/20 sm:px-6" onClick={() => openReport(report)}>
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <UserRound className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{studentName(report.student)}</p>
                          <Badge className={cn("border-0 text-[11px]", statusClass(report.status))}>{statusLabel(report.status)}</Badge>
                          <Badge variant="outline" className="text-[11px]">
                            {scopeLabel(report.scope)}
                          </Badge>
                        </div>

                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          Admission No. {report.student.admissionNo}
                          <span className="mx-1.5">•</span>
                          {report.enrollment.class?.name ?? "Class"}
                          <span className="mx-1.5">•</span>
                          {report.enrollment.section?.name ?? "Section"}
                          <span className="mx-1.5">•</span>
                          {report.scope === "INDIVIDUAL" ? (report.examGroup?.name ?? "Exam") : "Final Report"}
                        </p>
                      </div>

                      <div className="hidden shrink-0 text-right md:block">
                        <p className="text-xs text-muted-foreground">Generated at</p>
                        <p className="mt-1 text-sm font-medium">{report.generatedAt ? format(new Date(report.generatedAt), "dd MMM yyyy") : "—"}</p>
                      </div>

                      <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
                        <div className="hidden items-center gap-1 md:flex">
                          <button
                            type="button"
                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                            aria-label="Open report card"
                            title="Open report card"
                            onClick={() => openReport(report)}
                          >
                            <FileText className="size-4" />
                          </button>

                          {canUpdate && (
                            <button
                              type="button"
                              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                              aria-label="Edit teacher remarks"
                              title="Edit teacher remarks"
                              onClick={() => openRemarks(report)}
                            >
                              <MessageSquareText className="size-4" />
                            </button>
                          )}

                          {canCreate && (
                            <button
                              type="button"
                              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50"
                              aria-label="Refresh with latest marks"
                              title="Refresh with latest marks"
                              onClick={() => handleRefresh(report)}
                              disabled={refreshingReportId === report.id}
                            >
                              {refreshingReportId === report.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                            </button>
                          )}

                          {canPublish && report.status !== "PUBLISHED" && (
                            <button
                              type="button"
                              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-green-600"
                              aria-label="Publish report card"
                              title="Publish report card"
                              onClick={() => openPublish(report)}
                            >
                              <Send className="size-4" />
                            </button>
                          )}

                          {canPublish && report.status === "PUBLISHED" && (
                            <button
                              type="button"
                              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-amber-600"
                              aria-label="Unpublish report card"
                              title="Unpublish report card"
                              onClick={() => openUnpublish(report)}
                            >
                              <Undo2 className="size-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                              aria-label="Delete report card"
                              title="Delete report card"
                              onClick={() => openDeleteReport(report)}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild className="md:hidden">
                              <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label="More actions">
                                <MoreVertical className="size-4" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openReport(report)}>
                                <FileText className="mr-2 size-4" />
                                View report
                              </DropdownMenuItem>

                              {canUpdate && (
                                <DropdownMenuItem onClick={() => openRemarks(report)}>
                                  <MessageSquareText className="mr-2 size-4" />
                                  Teacher remarks
                                </DropdownMenuItem>
                              )}

                              {canCreate && (
                                <DropdownMenuItem onClick={() => handleRefresh(report)} disabled={refreshingReportId === report.id}>
                                  <RefreshCw className="mr-2 size-4" />
                                  Refresh with latest marks
                                </DropdownMenuItem>
                              )}

                              {canPublish && report.status !== "PUBLISHED" && (
                                <DropdownMenuItem onClick={() => openPublish(report)}>
                                  <Send className="mr-2 size-4" />
                                  Publish
                                </DropdownMenuItem>
                              )}

                              {canPublish && report.status === "PUBLISHED" && (
                                <DropdownMenuItem onClick={() => openUnpublish(report)}>
                                  <Undo2 className="mr-2 size-4" />
                                  Unpublish
                                </DropdownMenuItem>
                              )}

                              {report.pdfUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={report.pdfUrl} target="_blank" rel="noreferrer">
                                    <Download className="mr-2 size-4" />
                                    Download PDF
                                  </a>
                                </DropdownMenuItem>
                              )}

                              {canDelete && (
                                <DropdownMenuItem onClick={() => openDeleteReport(report)} className="text-destructive">
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="md:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Report card actions">
                                <MoreVertical className="size-4" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openReport(report)}>
                                <FileText className="mr-2 size-4" />
                                View report
                              </DropdownMenuItem>

                              {canUpdate && (
                                <DropdownMenuItem onClick={() => openRemarks(report)}>
                                  <MessageSquareText className="mr-2 size-4" />
                                  Teacher remarks
                                </DropdownMenuItem>
                              )}

                              {canCreate && (
                                <DropdownMenuItem onClick={() => handleRefresh(report)} disabled={refreshingReportId === report.id}>
                                  <RefreshCw className="mr-2 size-4" />
                                  Refresh with latest marks
                                </DropdownMenuItem>
                              )}

                              {canPublish && report.status !== "PUBLISHED" && (
                                <DropdownMenuItem onClick={() => openPublish(report)}>
                                  <Send className="mr-2 size-4" />
                                  Publish
                                </DropdownMenuItem>
                              )}

                              {canPublish && report.status === "PUBLISHED" && (
                                <DropdownMenuItem onClick={() => openUnpublish(report)}>
                                  <Undo2 className="mr-2 size-4" />
                                  Unpublish
                                </DropdownMenuItem>
                              )}

                              {report.pdfUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={report.pdfUrl} target="_blank" rel="noreferrer">
                                    <Download className="mr-2 size-4" />
                                    Download PDF
                                  </a>
                                </DropdownMenuItem>
                              )}

                              {canDelete && (
                                <DropdownMenuItem onClick={() => openDeleteReport(report)} className="text-destructive">
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* =====================================================
              Grading Schemes tab
          ===================================================== */}
          <TabsContent value="grading" className="space-y-4 pt-6">
            <div className="rounded-xl border bg-card">
              <div className="border-b px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configured Grading Schemes</p>
              </div>

              <div className="divide-y">
                {gradingSchemes.map((scheme) => (
                  <div key={scheme.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{scheme.name}</p>
                          {!scheme.isActive && (
                            <Badge variant="outline" className="text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {scheme.description && <p className="mt-1 text-sm text-muted-foreground">{scheme.description}</p>}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setExpandedSchemeId(expandedSchemeId === scheme.id ? null : scheme.id)}>
                          <Award className="size-3.5" />
                          {expandedSchemeId === scheme.id ? "Hide grades" : "Manage grades"}
                        </Button>

                        {canManageGrading && (
                          <button
                            type="button"
                            aria-label="Edit scheme"
                            onClick={() => openEditScheme(scheme)}
                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}

                        {canDeleteGrading && (
                          <button
                            type="button"
                            aria-label="Delete scheme"
                            onClick={() => openDeleteScheme(scheme)}
                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {expandedSchemeId === scheme.id && (
                      <div className="mt-4 rounded-lg border">
                        <div className="divide-y">
                          {[...scheme.bands]
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((band) => (
                              <div key={band.id} className="flex items-center gap-3 px-4 py-2.5">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium">
                                    {band.grade}
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {band.minPercentage}% – {band.maxPercentage}%
                                    </span>
                                  </p>
                                  {band.remark && <p className="text-xs text-muted-foreground">{band.remark}</p>}
                                </div>

                                {canManageGrading && (
                                  <button
                                    type="button"
                                    aria-label="Edit grade band"
                                    onClick={() => openEditBand(scheme.id, band)}
                                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                )}

                                {canDeleteGrading && (
                                  <button
                                    type="button"
                                    aria-label="Delete grade band"
                                    onClick={() => openDeleteBand(scheme.id, band)}
                                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}

                          {scheme.bands.length === 0 && <p className="px-4 py-4 text-sm text-muted-foreground">No grade bands added yet.</p>}
                        </div>

                        {canManageGrading && (
                          <form
                            onSubmit={handleSaveBand}
                            className="border-t p-4"
                            onFocus={() => {
                              if (bandSchemeId !== scheme.id) resetBandForm(scheme.id);
                            }}
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground">{editingBand && bandSchemeId === scheme.id ? "Edit Grade Band" : "Add Grade Band"}</p>
                              {editingBand && bandSchemeId === scheme.id && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => resetBandForm(scheme.id)}>
                                  Cancel edit
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                              <Input placeholder="Grade (e.g. A1)" value={bandSchemeId === scheme.id ? bandGrade : ""} onChange={(e) => setBandGrade(e.target.value)} className="h-10" />
                              <Input placeholder="Min %" type="number" min="0" max="100" value={bandSchemeId === scheme.id ? bandMin : ""} onChange={(e) => setBandMin(e.target.value)} className="h-10" />
                              <Input placeholder="Max %" type="number" min="0" max="100" value={bandSchemeId === scheme.id ? bandMax : ""} onChange={(e) => setBandMax(e.target.value)} className="h-10" />
                              <Input placeholder="Remark (optional)" value={bandSchemeId === scheme.id ? bandRemark : ""} onChange={(e) => setBandRemark(e.target.value)} className="h-10" />
                              <Input placeholder="Order" type="number" min="1" value={bandSchemeId === scheme.id ? bandDisplayOrder : "1"} onChange={(e) => setBandDisplayOrder(e.target.value)} className="h-10" />
                            </div>

                            <div className="mt-3 flex justify-end">
                              <Button type="submit" size="sm" className="gap-1.5">
                                {editingBand && bandSchemeId === scheme.id ? (
                                  <>
                                    <Pencil className="size-3.5" />
                                    Update Band
                                  </>
                                ) : (
                                  <>
                                    <Plus className="size-3.5" />
                                    Add Band
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {gradingSchemes.length === 0 && (
                  <div className="p-8 text-center">
                    <Award className="mx-auto size-7 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">No grading schemes yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Add your school&apos;s grading scales below — e.g. CBSE 9-point, CIE A-G.</p>
                  </div>
                )}
              </div>
            </div>

            {canManageGrading && (
              <form onSubmit={handleSaveScheme} className="rounded-xl border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{editingScheme ? "Edit Grading Scheme" : "Add Grading Scheme"}</p>
                    <p className="text-xs text-muted-foreground">Create the scheme first, then add its grade bands above.</p>
                  </div>
                  {editingScheme && (
                    <Button type="button" variant="ghost" size="sm" onClick={resetSchemeForm}>
                      Cancel edit
                    </Button>
                  )}
                </div>

                <FieldGroup>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <Label>Name</Label>
                      <Input value={schemeName} onChange={(e) => setSchemeName(e.target.value)} placeholder="e.g. CBSE 9-Point Scale" className="h-11" />
                    </Field>

                    <Field>
                      <Label>Active</Label>
                      <div className="mt-3">
                        <Switch checked={schemeIsActive} onCheckedChange={setSchemeIsActive} />
                      </div>
                    </Field>
                  </div>

                  <Field>
                    <Label>Description</Label>
                    <Textarea value={schemeDescription} onChange={(e) => setSchemeDescription(e.target.value)} placeholder="Optional" rows={2} />
                  </Field>
                </FieldGroup>

                <div className="mt-4 flex justify-end">
                  <Button type="submit" disabled={loading || !schemeName.trim()} className="min-w-32.5">
                    {editingScheme ? (
                      <>
                        <Pencil className="mr-2 size-4" />
                        Update
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 size-4" />
                        Add Scheme
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* =====================================================
              Class Exam Structure tab
          ===================================================== */}
          <TabsContent value="structure" className="space-y-4 pt-6">
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <Field>
                <Label>Class</Label>
                <Select value={structureClassId} onValueChange={setStructureClassId}>
                  <SelectTrigger className="h-11 w-full sm:w-80">
                    <SelectValue placeholder="Select a class to configure" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedClasses.map((item: AcademicClass) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.board})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {structureClassId && (
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-4 sm:p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{existingStructure ? "Result Configuration" : "New Result Configuration"}</p>

                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field>
                        <Label>Grading Scheme</Label>
                        <Select value={structureGradingSchemeId || "NONE"} onValueChange={(value) => setStructureGradingSchemeId(value === "NONE" ? "" : value)}>
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="No grading scheme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">No grading scheme</SelectItem>
                            {gradingSchemes.map((scheme) => (
                              <SelectItem key={scheme.id} value={scheme.id}>
                                {scheme.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <Label>Optional Subject Allowed</Label>
                        <div className="mt-3">
                          <Switch checked={structureHasOptionalSubject} onCheckedChange={setStructureHasOptionalSubject} />
                        </div>
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field>
                        <Label>Combine Exam Groups Into a Final Report</Label>
                        <div className="mt-3">
                          <Switch checked={structureCombineExamGroups} onCheckedChange={setStructureCombineExamGroups} />
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">On = CBSE-style (e.g. Term 1 + Term 2 combine). Off = CIE-style (each exam group stands alone).</p>
                      </Field>

                      <Field>
                        <Label>Show Performance Graph</Label>
                        <div className="mt-3">
                          <Switch checked={structureShowPerformanceGraph} onCheckedChange={setStructureShowPerformanceGraph} />
                        </div>
                      </Field>
                    </div>

                    <Field>
                      <Label>Notes</Label>
                      <Textarea value={structureNotes} onChange={(e) => setStructureNotes(e.target.value)} placeholder="Optional internal notes about this class's result structure" rows={2} />
                    </Field>
                  </FieldGroup>
                </div>

                <div className="rounded-xl border bg-card p-4 sm:p-6">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exam Group Weightages</p>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Set how much each exam group counts toward this class&apos;s final result (e.g. UT 10% + Mid-Term 30% + End-Term 60%). Leave &quot;Include&quot; off for a group that only produces its own standalone
                    report.
                  </p>

                  {sortedExamGroupsAll.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No exam groups configured yet — create them from the Exams page first.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-125 text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Exam Group</th>
                            <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Weightage %</th>
                            <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Include in Final Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedExamGroupsAll.map((group) => {
                            const row = structureWeights[group.id] ?? { weightagePercent: "", includeInFinalResult: true };
                            return (
                              <tr key={group.id} className="border-b last:border-0">
                                <td className="px-3 py-2.5 font-medium">{group.name}</td>
                                <td className="px-3 py-2.5">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={row.weightagePercent}
                                    onChange={(e) => updateStructureWeight(group.id, "weightagePercent", e.target.value)}
                                    className="h-9 w-24"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <Checkbox checked={row.includeInFinalResult} onCheckedChange={(value) => updateStructureWeight(group.id, "includeInFinalResult", Boolean(value))} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {canManageStructure && (
                  <div className="flex items-center justify-between gap-3">
                    {existingStructure && canDeleteStructure ? (
                      <Button type="button" variant="outline" className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setStructureDeleteOpen(true)}>
                        <Trash2 className="size-4" />
                        Delete Structure
                      </Button>
                    ) : (
                      <span />
                    )}

                    <Button type="button" onClick={handleSaveStructure} disabled={savingStructure} className="min-w-40 gap-2">
                      {savingStructure ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" />
                          Save Structure
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* =====================================================
              Report Card Templates tab
          ===================================================== */}
          <TabsContent value="templates" className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Select value={templateClassFilter} onValueChange={setTemplateClassFilter}>
                <SelectTrigger className="h-10 w-full sm:w-64">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {sortedClasses.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {canManageTemplates && (
                <Button className="gap-2" onClick={openAddTemplate}>
                  <Plus className="size-4" />
                  Add Template
                </Button>
              )}
            </div>

            <div className="rounded-xl border bg-card">
              <div className="divide-y">
                {visibleTemplates.map((template) => (
                  <div key={template.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{template.name}</p>
                        <Badge variant="outline" className="text-[11px]">
                          {template.reportScope === "COMBINED" ? "Final Report" : "Individual"}
                        </Badge>
                        {!template.isActive && (
                          <Badge variant="outline" className="text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.class.name}
                        <span className="mx-1.5">•</span>
                        {template.reportScope === "INDIVIDUAL" ? (template.examGroup?.name ?? "Exam Group") : "Combined result"}
                        <span className="mx-1.5">•</span>
                        {template.gradingScheme?.name ?? "No grading scheme"}
                        <span className="mx-1.5">•</span>
                        {template.sections.length} section{template.sections.length === 1 ? "" : "s"}
                        <span className="mx-1.5">•</span>
                        {template.remarkFields.length} remark{template.remarkFields.length === 1 ? "" : "s"}
                        <span className="mx-1.5">•</span>
                        {template.coScholasticRows.length} co-scholastic row{template.coScholasticRows.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      {canManageTemplates && (
                        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openSectionsManager(template)}>
                          <LayoutTemplate className="size-3.5" />
                          Sections
                        </Button>
                      )}

                      {canManageTemplates && (
                        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openRemarkFieldsManager(template)}>
                          <MessageSquareText className="size-3.5" />
                          Remarks
                        </Button>
                      )}

                      {canManageTemplates && (
                        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openCoScholasticManager(template)}>
                          <Award className="size-3.5" />
                          Co-Scholastic
                        </Button>
                      )}

                      {canManageTemplates && (
                        <button
                          type="button"
                          aria-label="Edit template"
                          onClick={() => openEditTemplate(template)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}

                      {canDeleteTemplates && (
                        <button
                          type="button"
                          aria-label="Delete template"
                          onClick={() => openDeleteTemplate(template)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {visibleTemplates.length === 0 && (
                  <div className="p-8 text-center">
                    <LayoutTemplate className="mx-auto size-7 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">No report card templates yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Add a template to control which sections and graphs show for a class&apos;s report card.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* =====================================================
          Report detail
      ===================================================== */}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-190">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-start gap-3">
              <button type="button" onClick={() => setDetailOpen(false)} className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                <ArrowLeft className="size-4" />
              </button>

              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="truncate text-lg">{selectedReport ? studentName(selectedReport.student) : "Report Card"}</DialogTitle>

                  {selectedReport && <Badge className={cn("border-0", statusClass(selectedReport.status))}>{statusLabel(selectedReport.status)}</Badge>}
                </div>

                <DialogDescription className="mt-1">
                  {selectedReport ? (selectedReport.scope === "INDIVIDUAL" ? (selectedReport.examGroup?.name ?? selectedReport.session.name) : `Final Report — ${selectedReport.session.name}`) : "Academic report"}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {selectedReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Admission No.</p>
                    <p className="mt-1 font-semibold">{selectedReport.student.admissionNo}</p>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Class</p>
                    <p className="mt-1 font-semibold">{selectedReport.enrollment.class?.name ?? "—"}</p>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Section</p>
                    <p className="mt-1 font-semibold">{selectedReport.enrollment.section?.name ?? "—"}</p>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Session</p>
                    <p className="mt-1 font-semibold">{selectedReport.session.name}</p>
                  </div>
                </div>

                {isCombined && combinedGroups.length > 0 && (
                  <div className="rounded-xl border">
                    <div className="border-b px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Activity className="size-4 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contributing Exam Groups</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto p-4">
                      <table className="w-full min-w-100 text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="px-3 py-3 text-xs font-semibold text-muted-foreground">Exam Group</th>
                            <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Weightage</th>
                            <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Achieved</th>
                          </tr>
                        </thead>

                        <tbody>
                          {combinedGroups.map((item, index) => {
                            const group = readObject(item);
                            return (
                              <tr key={`${String(group.examGroupName ?? "group")}-${index}`} className="border-b last:border-0">
                                <td className="px-3 py-3 font-medium">{String(group.examGroupName ?? "—")}</td>
                                <td className="px-3 py-3 text-right text-muted-foreground">{group.weightagePercent != null ? `${group.weightagePercent}%` : "—"}</td>
                                <td className="px-3 py-3 text-right font-semibold">{group.percentage != null ? `${group.percentage}%` : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border">
                  <div className="border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Academic Performance</p>
                    </div>
                  </div>

                  <div className="p-4">
                    {subjects.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-135 text-sm">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="px-3 py-3 text-xs font-semibold text-muted-foreground">Subject</th>
                              {isCombined ? (
                                <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Weighted %</th>
                              ) : (
                                <>
                                  <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Obtained</th>
                                  <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Maximum</th>
                                  <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Percentage</th>
                                  <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Status</th>
                                </>
                              )}
                            </tr>
                          </thead>

                          <tbody>
                            {subjects.map((item, index) => {
                              const subject = readObject(item);
                              const components = readArray(subject.components);

                              return (
                                <tr key={`${String(subject.subjectName ?? "subject")}-${index}`} className="border-b last:border-0">
                                  <td className="px-3 py-3">
                                    <div className="font-medium">{String(subject.subjectName ?? "—")}</div>

                                    {!isCombined && components.length > 0 && (
                                      <div className="mt-0.5 text-xs text-muted-foreground">
                                        {components
                                          .map((componentItem) => {
                                            const component = readObject(componentItem);
                                            const value = component.isAbsent ? "Absent" : (component.marksObtained ?? "—");
                                            const tag = component.source === "MANUAL" ? " (manual)" : "";

                                            return `${String(component.name ?? "")} ${value}/${String(component.maximumMarks ?? "—")}${tag}`;
                                          })
                                          .join(" • ")}
                                      </div>
                                    )}
                                  </td>

                                  {isCombined ? (
                                    <td className="px-3 py-3 text-right font-semibold">{subject.weightedPercentage != null ? `${subject.weightedPercentage}%` : "—"}</td>
                                  ) : (
                                    <>
                                      <td className="px-3 py-3 text-right">{String(subject.obtainedTotal ?? "—")}</td>
                                      <td className="px-3 py-3 text-right text-muted-foreground">{String(subject.maxTotal ?? "—")}</td>
                                      <td className="px-3 py-3 text-right font-semibold">{subject.percentage != null ? `${subject.percentage}%` : "—"}</td>
                                      <td className="px-3 py-3 text-right">
                                        {subject.incomplete ? (
                                          <Badge variant="outline" className="text-[10px]">
                                            Pending
                                          </Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-8 text-center">
                        <BookOpen className="mx-auto size-7 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">Performance data will appear automatically</p>
                        <p className="mt-1 text-xs text-muted-foreground">This report card is ready to use once the academic marks data has been entered.</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedReport.template?.showPerformanceGraph && subjects.length > 0 && (
                  <div className="rounded-xl border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Activity className="size-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performance Graph</p>
                    </div>

                    {(() => {
                      const graphData = subjects.map((item) => {
                        const subject = readObject(item);
                        const rawValue = isCombined ? subject.weightedPercentage : subject.percentage;
                        const value = Number(rawValue ?? 0);

                        return { name: String(subject.subjectName ?? ""), value: Number.isFinite(value) ? value : 0 };
                      });

                      const barWidth = 36;
                      const gap = 34;
                      const chartWidth = Math.max(graphData.length * (barWidth + gap) + 20, 300);
                      const baseline = 150;
                      const maxBarHeight = 130;

                      return (
                        <svg viewBox={`0 0 ${chartWidth} 190`} className="w-full" style={{ maxHeight: 220 }}>
                          <line x1="0" y1={baseline} x2={chartWidth} y2={baseline} stroke="currentColor" strokeOpacity="0.15" />

                          {graphData.map((d, i) => {
                            const x = i * (barWidth + gap) + 20;
                            const barHeight = Math.max((Math.min(d.value, 100) / 100) * maxBarHeight, 2);
                            const y = baseline - barHeight;
                            const label = d.name.length > 9 ? `${d.name.slice(0, 8)}…` : d.name;

                            return (
                              <g key={`${d.name}-${i}`}>
                                <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} className="fill-primary" opacity={0.85} />
                                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" className="fill-foreground font-medium">
                                  {d.value}%
                                </text>
                                <text x={x + barWidth / 2} y={baseline + 16} textAnchor="middle" fontSize="10" className="fill-muted-foreground">
                                  {label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>
                )}

                <div className="rounded-xl border p-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overall Result</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end gap-8">
                    <div>
                      <p className="text-xs text-muted-foreground">Percentage</p>
                      <p className="mt-1 text-2xl font-bold">{overall.percentage != null ? `${overall.percentage}%` : "—"}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Grade</p>
                      <p className="mt-1 text-2xl font-bold">{String(overall.grade ?? "—")}</p>
                    </div>

                    {overall.remark != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Remark</p>
                        <p className="mt-1 text-sm font-medium">{String(overall.remark)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedReport.template?.coScholasticRows && selectedReport.template.coScholasticRows.length > 0 && (
                  <div className="rounded-xl border">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Award className="size-4 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Co-Scholastic</p>
                      </div>

                      {canUpdate && (
                        <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => openCoScholasticGrading(selectedReport)}>
                          <Pencil className="size-3.5" />
                          Grade
                        </Button>
                      )}
                    </div>

                    <div className="divide-y">
                      {[...selectedReport.template.coScholasticRows]
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((row) => (
                          <div key={row.id} className="flex items-center justify-between px-4 py-2.5">
                            <p className="text-sm">{row.label}</p>
                            <p className="text-sm font-semibold">{selectedReport.coScholasticMarks?.[row.label] || "—"}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border">
                  <div className="border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="size-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remarks</p>
                    </div>
                  </div>

                  <div className="divide-y">
                    {getRemarkFieldsForReport(selectedReport).map((field) => {
                      const value = readObject(selectedReport.teacherRemarks)[field.key];
                      const text = typeof value === "string" ? value.trim() : "";

                      return (
                        <div key={field.key} className="p-4">
                          <p className="text-xs font-semibold text-muted-foreground">{field.label}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{text || "No remarks added yet."}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              {selectedReport && canUpdate && (
                <Button type="button" variant="outline" className="gap-2" onClick={() => openRemarks(selectedReport)}>
                  <Pencil className="size-4" />
                  Remarks
                </Button>
              )}

              {selectedReport && canCreate && (
                <Button type="button" variant="outline" className="gap-2" onClick={() => handleRefresh(selectedReport)} disabled={refreshingReportId === selectedReport.id}>
                  {refreshingReportId === selectedReport.id ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  Refresh
                </Button>
              )}

              {selectedReport && canUpdate && hasManualComponents(selectedReport) && (
                <Button type="button" variant="outline" className="gap-2" onClick={() => openManualMarks(selectedReport)}>
                  <ListChecks className="size-4" />
                  Manual Marks
                </Button>
              )}

              {selectedReport?.pdfUrl && (
                <Button asChild variant="outline" className="gap-2">
                  <a href={selectedReport.pdfUrl} target="_blank" rel="noreferrer">
                    <Download className="size-4" />
                    Download
                  </a>
                </Button>
              )}

              {selectedReport && canPublish && selectedReport.status !== "PUBLISHED" && (
                <Button type="button" className="gap-2" onClick={() => openPublish(selectedReport)}>
                  <Send className="size-4" />
                  Publish
                </Button>
              )}

              {selectedReport && canPublish && selectedReport.status === "PUBLISHED" && (
                <Button type="button" variant="outline" className="gap-2" onClick={() => openUnpublish(selectedReport)}>
                  <Undo2 className="size-4" />
                  Unpublish
                </Button>
              )}

              {selectedReport && canDelete && (
                <Button type="button" variant="outline" className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => openDeleteReport(selectedReport)}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}

              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={remarksOpen}
        onOpenChange={(open) => {
          setRemarksOpen(open);
          if (!open) {
            setRemarksReport(null);
            setRemarksFields([]);
            setRemarksValues({});
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-140">
          <form onSubmit={handleSaveRemarks} className="flex flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageSquareText className="size-5" />
                </div>

                <div>
                  <DialogTitle>Remarks</DialogTitle>
                  <DialogDescription>{remarksReport ? studentName(remarksReport.student) : "Update remarks"}</DialogDescription>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <FieldGroup>
                {remarksFields.map((field) => (
                  <Field key={field.key}>
                    <Label>{field.label}</Label>
                    <Textarea
                      value={remarksValues[field.key] ?? ""}
                      onChange={(event) => setRemarksValues((previous) => ({ ...previous, [field.key]: event.target.value }))}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      rows={4}
                    />
                  </Field>
                ))}
              </FieldGroup>
            </div>

            <DialogFooter className="shrink-0 border-t px-6 py-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !canUpdate} className="gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
                Save Remarks
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={manualMarksOpen}
        onOpenChange={(open) => {
          setManualMarksOpen(open);
          if (!open) {
            setManualMarksReport(null);
            setManualMarksRows([]);
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-140">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ListChecks className="size-5" />
              </div>

              <div>
                <DialogTitle>Manual Marks</DialogTitle>
                <DialogDescription>{manualMarksReport ? studentName(manualMarksReport.student) : "Practical / Assessment marks entered by hand"}</DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {manualMarksRows.map((row, subjectIndex) => (
              <div key={row.subjectId} className="rounded-md border p-4">
                <p className="mb-3 text-sm font-semibold">{row.subjectName}</p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {row.components.map((component, componentIndex) => (
                    <div key={component.name}>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        {component.name} (out of {component.maximumMarks})
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max={component.maximumMarks}
                        value={component.value}
                        onChange={(e) => updateManualMarksValue(subjectIndex, componentIndex, e.target.value)}
                        placeholder="Not entered"
                        className="h-10"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {manualMarksRows.length === 0 && <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No manual components configured for this class&apos;s subjects yet.</div>}
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button type="button" onClick={handleSaveManualMarks} disabled={savingManualMarks || manualMarksRows.length === 0} className="min-w-32.5 gap-2">
              {savingManualMarks ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ListChecks className="size-4" />
                  Save Marks
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={generateOpen}
        onOpenChange={(open) => {
          setGenerateOpen(open);

          if (!open) {
            setGenerating(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-125">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>

              <div>
                <DialogTitle>Generate Report Cards</DialogTitle>
                <DialogDescription>Marks already entered are used automatically.</DialogDescription>
              </div>
            </div>
          </div>

          <FieldGroup>
            <Field>
              <Label>Report Type</Label>

              <Select
                value={generateScope}
                onValueChange={(value) => {
                  const next = value as ReportCardScopeT;
                  setGenerateScope(next);

                  if (next === "INDIVIDUAL") {
                    setGenerateExamGroupId(sessionExamGroups[0]?.id ?? "");
                  } else {
                    setGenerateExamGroupId("");
                  }
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual Report (one exam group)</SelectItem>

                  <SelectItem value="COMBINED">Final Report (combined result)</SelectItem>
                </SelectContent>
              </Select>

              <p className="mt-1 text-xs text-muted-foreground">
                {generateScope === "COMBINED"
                  ? "Computes the weighted final result across every exam group configured to count toward it, per each student's class. Classes that don't combine terms are skipped automatically."
                  : "A standalone report for one exam group (e.g. a Mid-Term report, or a Unit Test report with no final-result weightage)."}
              </p>
            </Field>

            {generateScope === "INDIVIDUAL" && (
              <Field>
                <Label>Exam Group</Label>

                <Select value={generateExamGroupId} onValueChange={setGenerateExamGroupId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={sessionExamGroups.length === 0 ? "No exams found for this session" : "Select exam group"} />
                  </SelectTrigger>

                  <SelectContent>
                    {sessionExamGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {sessionExamGroups.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Create an exam for this session on the Exams page first.</p>}
              </Field>
            )}

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />

                <div>
                  <p className="text-sm font-semibold">Automatic generation</p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Only missing report cards are generated for eligible students. Existing report cards are not duplicated.</p>

                  <p className="mt-3 text-sm font-semibold">
                    {missingCount} report card
                    {missingCount === 1 ? "" : "s"} to generate
                  </p>
                </div>
              </div>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button type="button" className="gap-2" disabled={generating || !canCreate || !effectiveSessionId || (generateScope === "INDIVIDUAL" && !generateExamGroupId) || missingCount === 0} onClick={handleGenerate}>
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Send className="size-6 text-green-600" />
            </div>

            <AlertDialogTitle className="text-center">Publish this report card?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">The report card will become available to parents after publishing.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handlePublish} className="gap-2">
              <Send className="size-4" />
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Undo2 className="size-6 text-amber-600" />
            </div>

            <AlertDialogTitle className="text-center">Unpublish this report card?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              It will no longer be visible to parents until published again. Do this before refreshing or editing a report that&apos;s already been shown.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleUnpublish} className="gap-2">
              <Undo2 className="size-4" />
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteReportOpen} onOpenChange={setDeleteReportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="text-center">Delete this report card?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This permanently removes the report card for <span className="font-semibold text-foreground">{deletingReport ? studentName(deletingReport.student) : "this student"}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDeleteReport} className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="size-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* =====================================================
          Grading scheme delete confirmations
      ===================================================== */}

      <AlertDialog open={schemeDeleteOpen} onOpenChange={setSchemeDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this grading scheme?</AlertDialogTitle>
            <AlertDialogDescription>Grading schemes already assigned to a class can&apos;t be deleted — deactivate them instead. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteScheme} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bandDeleteOpen} onOpenChange={setBandDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this grade band?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBand} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* =====================================================
          Class exam structure delete confirmation
      ===================================================== */}

      <AlertDialog open={structureDeleteOpen} onOpenChange={setStructureDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class&apos;s exam structure?</AlertDialogTitle>
            <AlertDialogDescription>This removes the grading scheme assignment and all exam group weightages for this class. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStructure} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* =====================================================
          Report card template form
      ===================================================== */}

      <Dialog
        open={templateFormOpen}
        onOpenChange={(open) => {
          setTemplateFormOpen(open);
          if (!open) resetTemplateForm();
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-125">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <LayoutTemplate className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">{editingTemplate ? "Edit Report Card Template" : "Add Report Card Template"}</DialogTitle>
                <DialogDescription>Controls which sections and graph show on a class&apos;s report card.</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveTemplate} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <FieldGroup>
                <Field>
                  <Label>Class</Label>
                  <Select value={templateClassId} onValueChange={setTemplateClassId} disabled={Boolean(editingTemplate)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedClasses.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label>Report Scope</Label>
                  <Select value={templateScope} onValueChange={(value) => setTemplateScope(value as ReportCardScopeT)} disabled={Boolean(editingTemplate)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual (one exam group)</SelectItem>
                      <SelectItem value="COMBINED">Combined (final report)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {templateScope === "INDIVIDUAL" && (
                  <Field>
                    <Label>Exam Group</Label>
                    <Select value={templateExamGroupId} onValueChange={setTemplateExamGroupId} disabled={Boolean(editingTemplate)}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select exam group" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedExamGroupsAll.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <Field>
                  <Label>Template Name</Label>
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Mid-Term Report" className="h-11" />
                </Field>

                <Field>
                  <Label>Grading Scheme</Label>
                  <Select value={templateGradingSchemeId || "NONE"} onValueChange={(value) => setTemplateGradingSchemeId(value === "NONE" ? "" : value)}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="No grading scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No grading scheme</SelectItem>
                      {gradingSchemes.map((scheme) => (
                        <SelectItem key={scheme.id} value={scheme.id}>
                          {scheme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <Label>Show Performance Graph</Label>
                    <div className="mt-3">
                      <Switch checked={templateShowGraph} onCheckedChange={setTemplateShowGraph} />
                    </div>
                  </Field>

                  <Field>
                    <Label>Show Final Result Weightage</Label>
                    <div className="mt-3">
                      <Switch checked={templateShowWeightage} onCheckedChange={setTemplateShowWeightage} />
                    </div>
                  </Field>
                </div>

                <Field>
                  <Label>Active</Label>
                  <div className="mt-3">
                    <Switch checked={templateIsActive} onCheckedChange={setTemplateIsActive} />
                  </div>
                </Field>
              </FieldGroup>
            </div>

            <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t px-7 py-4 pb-7">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="min-w-32.5">
                {editingTemplate ? (
                  <>
                    <Pencil className="mr-2 size-4" />
                    Update
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    Add
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={templateDeleteOpen} onOpenChange={setTemplateDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report card template?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* =====================================================
          Report card template sections manager
      ===================================================== */}

      <Dialog
        open={sectionsOpen}
        onOpenChange={(open) => {
          setSectionsOpen(open);
          if (!open) setSectionsTemplate(null);
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-140">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <LayoutTemplate className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Report Sections</DialogTitle>
                <DialogDescription>{sectionsTemplate ? `${sectionsTemplate.class.name} — ${sectionsTemplate.name}` : "Toggle and order the blocks that render on this report card"}</DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="rounded-md border">
              <div className="divide-y">
                {sectionRows
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((row) => (
                    <div key={row.key} className="flex items-center gap-3 px-4 py-2.5">
                      <Checkbox checked={row.isEnabled} onCheckedChange={(value) => toggleSectionEnabled(row.key, Boolean(value))} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{row.label}</p>
                        <p className="text-xs text-muted-foreground">{row.key}</p>
                      </div>
                      <Input type="number" min="1" value={row.displayOrder} onChange={(e) => updateSectionOrder(row.key, e.target.value)} className="h-9 w-16" />
                      <button
                        type="button"
                        aria-label="Remove section"
                        onClick={() => removeSectionRow(row.key)}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}

                {sectionRows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No sections yet — add one below.</p>}
              </div>
            </div>

            <div className="rounded-md border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_SECTION_PRESETS.filter((preset) => !sectionRows.some((row) => row.key === preset.key)).map((preset) => (
                  <Button key={preset.key} type="button" variant="outline" size="sm" onClick={() => addSectionRow(preset.key, preset.label)}>
                    + {preset.label}
                  </Button>
                ))}
                {COMMON_SECTION_PRESETS.every((preset) => sectionRows.some((row) => row.key === preset.key)) && <p className="text-xs text-muted-foreground">All common sections added.</p>}
              </div>

              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom section</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input placeholder="Key (e.g. CUSTOM_NOTE)" value={newSectionKey} onChange={(e) => setNewSectionKey(e.target.value)} className="h-10" />
                <Input placeholder="Label (e.g. Custom Note)" value={newSectionLabel} onChange={(e) => setNewSectionLabel(e.target.value)} className="h-10" />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 gap-1.5"
                  onClick={() => {
                    addSectionRow(newSectionKey, newSectionLabel);
                    setNewSectionKey("");
                    setNewSectionLabel("");
                  }}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveSections} disabled={savingSections} className="min-w-32.5 gap-2">
              {savingSections ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Save Sections
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          Co-scholastic grading (per report)
      ===================================================== */}

      <Dialog
        open={coScholasticOpen}
        onOpenChange={(open) => {
          setCoScholasticOpen(open);
          if (!open) {
            setCoScholasticReport(null);
            setCoScholasticValues({});
          }
        }}
      >
        <DialogContent className="sm:max-w-125">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Award className="size-5" />
            </div>
            <div>
              <DialogTitle>Co-Scholastic Grades</DialogTitle>
              <DialogDescription>{coScholasticReport ? studentName(coScholasticReport.student) : "Grade-only, not marks-based"}</DialogDescription>
            </div>
          </div>

          <FieldGroup>
            {(coScholasticReport?.template?.coScholasticRows ?? [])
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((row) => (
                <Field key={row.id}>
                  <Label>{row.label}</Label>
                  <Input value={coScholasticValues[row.label] ?? ""} onChange={(e) => setCoScholasticValues((previous) => ({ ...previous, [row.label]: e.target.value }))} placeholder="e.g. A" className="h-10" />
                </Field>
              ))}

            {!(coScholasticReport?.template?.coScholasticRows ?? []).length && <p className="text-sm text-muted-foreground">No co-scholastic rows configured for this class&apos;s template.</p>}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button type="button" onClick={handleSaveCoScholastic} disabled={savingCoScholastic} className="gap-2">
              {savingCoScholastic ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Save Grades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          Remark field definitions manager (per template)
      ===================================================== */}

      <Dialog
        open={remarkFieldsManagerOpen}
        onOpenChange={(open) => {
          setRemarkFieldsManagerOpen(open);
          if (!open) setRemarkFieldsManagerTemplate(null);
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-140">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <MessageSquareText className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Remark Fields</DialogTitle>
                <DialogDescription>
                  {remarkFieldsManagerTemplate ? `${remarkFieldsManagerTemplate.class.name} — ${remarkFieldsManagerTemplate.name}` : "The labeled remark boxes that appear on this report card"}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="rounded-md border">
              <div className="divide-y">
                {remarkFieldRows.map((row) => (
                  <div key={row.key} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.key}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove remark field"
                      onClick={() => removeRemarkFieldRow(row.key)}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}

                {remarkFieldRows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No remark fields yet — add one below.</p>}
              </div>
            </div>

            <div className="rounded-md border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_REMARK_FIELD_PRESETS.filter((preset) => !remarkFieldRows.some((row) => row.key === preset.key)).map((preset) => (
                  <Button key={preset.key} type="button" variant="outline" size="sm" onClick={() => addRemarkFieldRow(preset.key, preset.label)}>
                    + {preset.label}
                  </Button>
                ))}
                {COMMON_REMARK_FIELD_PRESETS.every((preset) => remarkFieldRows.some((row) => row.key === preset.key)) && <p className="text-xs text-muted-foreground">All common remark fields added.</p>}
              </div>

              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom field</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input placeholder="Key (e.g. SPORTS_REMARK)" value={newRemarkFieldKey} onChange={(e) => setNewRemarkFieldKey(e.target.value)} className="h-10" />
                <Input placeholder="Label (e.g. Sports Remark)" value={newRemarkFieldLabel} onChange={(e) => setNewRemarkFieldLabel(e.target.value)} className="h-10" />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 gap-1.5"
                  onClick={() => {
                    addRemarkFieldRow(newRemarkFieldKey, newRemarkFieldLabel);
                    setNewRemarkFieldKey("");
                    setNewRemarkFieldLabel("");
                  }}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveRemarkFields} disabled={savingRemarkFields} className="min-w-32.5 gap-2">
              {savingRemarkFields ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Save Fields
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          Co-scholastic row definitions manager (per template)
      ===================================================== */}

      <Dialog
        open={coScholasticManagerOpen}
        onOpenChange={(open) => {
          setCoScholasticManagerOpen(open);
          if (!open) setCoScholasticManagerTemplate(null);
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-140">
          <div className="shrink-0 border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Award className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Co-Scholastic Rows</DialogTitle>
                <DialogDescription>
                  {coScholasticManagerTemplate ? `${coScholasticManagerTemplate.class.name} — ${coScholasticManagerTemplate.name}` : "Grade-only rows, e.g. Work Education, Discipline"}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="rounded-md border">
              <div className="divide-y">
                {coScholasticRowsDraft.map((row) => (
                  <div key={row.label} className="flex items-center gap-3 px-4 py-2.5">
                    <p className="min-w-0 flex-1 text-sm font-medium">{row.label}</p>
                    <button
                      type="button"
                      aria-label="Remove row"
                      onClick={() => removeCoScholasticRowDraft(row.label)}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}

                {coScholasticRowsDraft.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No rows yet — add one below.</p>}
              </div>
            </div>

            <div className="rounded-md border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_COSCHOLASTIC_PRESETS.filter((preset) => !coScholasticRowsDraft.some((row) => row.label === preset)).map((preset) => (
                  <Button key={preset} type="button" variant="outline" size="sm" onClick={() => addCoScholasticRowDraft(preset)}>
                    + {preset}
                  </Button>
                ))}
                {COMMON_COSCHOLASTIC_PRESETS.every((preset) => coScholasticRowsDraft.some((row) => row.label === preset)) && <p className="text-xs text-muted-foreground">All common rows added.</p>}
              </div>

              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom row</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input placeholder="e.g. Music" value={newCoScholasticRowLabel} onChange={(e) => setNewCoScholasticRowLabel(e.target.value)} className="h-10" />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 gap-1.5"
                  onClick={() => {
                    addCoScholasticRowDraft(newCoScholasticRowLabel);
                    setNewCoScholasticRowLabel("");
                  }}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveCoScholasticRows} disabled={savingCoScholasticRows} className="min-w-32.5 gap-2">
              {savingCoScholasticRows ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Save Rows
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
