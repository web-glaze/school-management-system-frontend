"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquareText,
  MoreVertical,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAcademicStore, type Exam, type Student, type StudentEnrollment } from "@/store/academicStore";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type ReportCardTypeT = "EXAM" | "ANNUAL";
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
  examId?: string | null;
  type: ReportCardTypeT;
  reportKey: string;
  teacherRemarks?: Record<string, unknown>;
  reportData?: Record<string, unknown>;
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
  exam?: Exam | null;
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

const REPORT_TYPE_OPTIONS: {
  value: ReportCardTypeT | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "All Types" },
  { value: "EXAM", label: "Exam" },
  { value: "ANNUAL", label: "Annual" },
];

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

function typeLabel(type: ReportCardTypeT) {
  return type === "ANNUAL" ? "Annual Report" : "Exam Report";
}

function studentName(student?: Student | null) {
  if (!student) return "Unknown Student";
  return `${student.firstName} ${student.lastName}`.trim();
}

function remarkText(remarks?: Record<string, unknown>) {
  if (!remarks) return "";
  const values = Object.values(remarks)
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return values.join("\n");
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export default function ReportCardsPage() {
  const {
    loading,
    sessions,
    exams,
    studentEnrollments,
    reportCards,
    fetchSessions,
    fetchExams,
    fetchStudents,
    fetchStudentEnrollments,
    fetchReportCards,
    generateExamReportCard,
    generateAnnualReportCard,
    updateReportCard,
    publishReportCard,
  } = useAcademicStore();

  const authorized = usePermission("reportcard.read");
  const canCreate = usePermission("reportcard.create");
  const canUpdate = usePermission("reportcard.update");
  const canPublish = usePermission("reportcard.publish");

  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<ReportCardTypeT | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ReportCardStatusT | "ALL">("ALL");
  const [examFilter, setExamFilter] = useState("ALL");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);

  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarksReport, setRemarksReport] = useState<ReportCard | null>(null);
  const [remarks, setRemarks] = useState("");

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishingReport, setPublishingReport] = useState<ReportCard | null>(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateType, setGenerateType] = useState<ReportCardTypeT>("EXAM");
  const [generateExamId, setGenerateExamId] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchExams();
    fetchStudents();
    fetchStudentEnrollments();
    fetchReportCards();
  }, []);

  const activeSessionId = useMemo(() => {
    const active = sessions.find((session) => session.isActive);
    return active?.id ?? sessions[0]?.id ?? "";
  }, [sessions]);

  const effectiveSessionId = sessionFilter === "ALL" ? activeSessionId : sessionFilter;

  const sessionExams = useMemo(() => {
    return exams.filter((exam) => exam.sessionId === effectiveSessionId).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [exams, effectiveSessionId]);

  const sessionEnrollments = useMemo(() => {
    return studentEnrollments.filter((enrollment) => enrollment.sessionId === effectiveSessionId && enrollment.enrollmentStatus !== "DROPPED");
  }, [studentEnrollments, effectiveSessionId]);

  const visibleReports = useMemo(() => {
    return (reportCards as ReportCard[])
      .filter((report) => {
        const fullName = studentName(report.student).toLowerCase();
        const admissionNo = report.student.admissionNo.toLowerCase();
        const examName = report.exam?.name?.toLowerCase() ?? "";

        const query = search.toLowerCase().trim();

        const matchesSearch = !query || fullName.includes(query) || admissionNo.includes(query) || examName.includes(query);

        const matchesSession = sessionFilter === "ALL" || report.sessionId === sessionFilter;

        const matchesType = typeFilter === "ALL" || report.type === typeFilter;

        const matchesStatus = statusFilter === "ALL" || report.status === statusFilter;

        const matchesExam = examFilter === "ALL" || (report.type === "EXAM" && report.examId === examFilter);

        return matchesSearch && matchesSession && matchesType && matchesStatus && matchesExam;
      })
      .sort((a, b) => {
        const first = new Date(a.generatedAt ?? a.createdAt).getTime();
        const second = new Date(b.generatedAt ?? b.createdAt).getTime();

        return second - first;
      });
  }, [reportCards, search, sessionFilter, typeFilter, statusFilter, examFilter]);

  const generatedCount = useMemo(() => visibleReports.filter((report) => report.status === "GENERATED").length, [visibleReports]);

  const publishedCount = useMemo(() => visibleReports.filter((report) => report.status === "PUBLISHED").length, [visibleReports]);

  const studentCount = useMemo(() => {
    return sessionEnrollments.length;
  }, [sessionEnrollments]);

  const missingCount = useMemo(() => {
    if (!effectiveSessionId) return 0;

    const keySet = new Set((reportCards as ReportCard[]).map((report) => report.reportKey));

    if (generateType === "ANNUAL") {
      return sessionEnrollments.filter((enrollment) => !keySet.has(`${enrollment.studentId}:ANNUAL:${effectiveSessionId}`)).length;
    }

    if (!generateExamId) return 0;

    return sessionEnrollments.filter((enrollment) => !keySet.has(`${enrollment.studentId}:EXAM:${generateExamId}`)).length;
  }, [reportCards, sessionEnrollments, effectiveSessionId, generateType, generateExamId]);

  const resetFilters = () => {
    setSearch("");
    setSessionFilter("ALL");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setExamFilter("ALL");
  };

  const openReport = (report: ReportCard) => {
    setSelectedReport(report);
    setDetailOpen(true);
  };

  const openRemarks = (report: ReportCard) => {
    setRemarksReport(report);
    setRemarks(remarkText(report.teacherRemarks));
    setRemarksOpen(true);
  };

  const handleSaveRemarks = async (event: FormEvent) => {
    event.preventDefault();

    if (!remarksReport || !canUpdate) return;

    try {
      await updateReportCard(remarksReport.id, {
        teacherRemarks: {
          classTeacher: remarks.trim(),
        },
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
        setSelectedReport(null);
        setDetailOpen(false);
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to publish report card");
    }
  };

  const openGenerate = () => {
    setGenerateType("EXAM");
    setGenerateExamId(sessionExams[0]?.id ?? "");
    setGenerateOpen(true);
  };

  const handleGenerate = async () => {
    if (!effectiveSessionId || !canCreate) return;

    setGenerating(true);

    try {
      const eligible = sessionEnrollments.filter((enrollment) => {
        if (generateType === "ANNUAL") {
          return true;
        }

        return Boolean(generateExamId);
      });

      if (!eligible.length) {
        toast.error("No eligible students found");
        return;
      }

      const existingKeys = new Set((reportCards as ReportCard[]).map((report) => report.reportKey));

      const missingStudents = eligible.filter((enrollment) => {
        const key = generateType === "ANNUAL" ? `${enrollment.studentId}:ANNUAL:${effectiveSessionId}` : `${enrollment.studentId}:EXAM:${generateExamId}`;

        return !existingKeys.has(key);
      });

      if (!missingStudents.length) {
        toast.success("All eligible report cards are already generated");
        setGenerateOpen(false);
        return;
      }

      if (generateType === "ANNUAL") {
        await Promise.all(missingStudents.map((enrollment) => generateAnnualReportCard(enrollment.studentId, effectiveSessionId, {})));
      } else {
        await Promise.all(missingStudents.map((enrollment) => generateExamReportCard(enrollment.studentId, generateExamId, {})));
      }

      await fetchReportCards();

      toast.success(`${missingStudents.length} report card${missingStudents.length === 1 ? "" : "s"} generated`);

      setGenerateOpen(false);
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;

      toast.error(err.response?.data?.message || "Failed to generate report cards");
    } finally {
      setGenerating(false);
    }
  };

  const data = readObject(selectedReport?.reportData);

  const subjects = readArray(data.subjects);
  const attendance = readObject(data.attendance);
  const summary = readObject(data.summary);

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

                <p className="text-sm text-muted-foreground">Automatically generated academic performance reports</p>
              </div>
            </div>
          </div>

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
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, admission no., exam..." className="h-10 pl-10" />
            </div>

            <Select
              value={sessionFilter}
              onValueChange={(value) => {
                setSessionFilter(value);
                setExamFilter("ALL");
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

            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Exam" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Exams</SelectItem>
                {sessionExams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ReportCardTypeT | "ALL")}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {REPORT_TYPE_OPTIONS.map((option) => (
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

                <p className="mt-1 text-xs text-muted-foreground">Automatically generated from academic records</p>
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
                        {typeLabel(report.type)}
                      </Badge>
                    </div>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      Admission No. {report.student.admissionNo}
                      <span className="mx-1.5">•</span>
                      {report.enrollment.class?.name ?? "Class"}
                      <span className="mx-1.5">•</span>
                      {report.enrollment.section?.name ?? "Section"}
                      <span className="mx-1.5">•</span>
                      {report.exam?.name ?? report.session.name}
                    </p>
                  </div>

                  <div className="hidden shrink-0 text-right md:block">
                    <p className="text-xs text-muted-foreground">Generated</p>

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

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
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

                          {canPublish && report.status !== "PUBLISHED" && (
                            <DropdownMenuItem onClick={() => openPublish(report)}>
                              <Send className="mr-2 size-4" />
                              Publish
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

                          {canPublish && report.status !== "PUBLISHED" && (
                            <DropdownMenuItem onClick={() => openPublish(report)}>
                              <Send className="mr-2 size-4" />
                              Publish
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

                <DialogDescription className="mt-1">{selectedReport?.exam?.name ?? selectedReport?.session.name ?? "Academic report"}</DialogDescription>
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
                              <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Obtained</th>
                              <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Maximum</th>
                              <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">Grade</th>
                            </tr>
                          </thead>

                          <tbody>
                            {subjects.map((item, index) => {
                              const subject = readObject(item);
                              return (
                                <tr key={`${String(subject.name ?? "subject")}-${index}`} className="border-b last:border-0">
                                  <td className="px-3 py-3 font-medium">{String(subject.name ?? "—")}</td>
                                  <td className="px-3 py-3 text-right">{String(subject.obtained ?? "—")}</td>
                                  <td className="px-3 py-3 text-right text-muted-foreground">{String(subject.maximum ?? "—")}</td>
                                  <td className="px-3 py-3 text-right font-semibold">{String(subject.grade ?? "—")}</td>
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
                        <p className="mt-1 text-xs text-muted-foreground">This report card is ready to use once the academic marks data has been generated.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attendance</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Present</p>
                        <p className="mt-1 text-xl font-bold">{String(attendance.present ?? "—")}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Total Days</p>
                        <p className="mt-1 text-xl font-bold">{String(attendance.total ?? "—")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="size-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overall Result</p>
                    </div>

                    <p className="mt-4 text-2xl font-bold">
                      {String(summary.percentage ?? "—")}
                      {summary.percentage != null ? "%" : ""}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">Grade {String(summary.grade ?? "—")}</p>
                  </div>
                </div>

                <div className="rounded-xl border">
                  <div className="border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="size-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teacher Remarks</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{remarkText(selectedReport.teacherRemarks) || "No teacher remarks added yet."}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <div className="flex w-full items-center justify-end gap-2">
              {selectedReport && canUpdate && (
                <Button type="button" variant="outline" className="gap-2" onClick={() => openRemarks(selectedReport)}>
                  <Pencil className="size-4" />
                  Remarks
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
            setRemarks("");
          }
        }}
      >
        <DialogContent className="sm:max-w-140">
          <form onSubmit={handleSaveRemarks}>
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageSquareText className="size-5" />
                </div>

                <div>
                  <DialogTitle>Teacher Remarks</DialogTitle>
                  <DialogDescription>{remarksReport ? studentName(remarksReport.student) : "Update teacher remarks"}</DialogDescription>
                </div>
              </div>
            </div>

            <FieldGroup>
              <Field>
                <Label>Class Teacher&apos;s Remarks</Label>
                <Textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Enter teacher remarks..." rows={6} />
              </Field>
            </FieldGroup>

            <DialogFooter className="mt-6">
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
                <DialogDescription>Existing academic records are used automatically.</DialogDescription>
              </div>
            </div>
          </div>

          <FieldGroup>
            <Field>
              <Label>Report Type</Label>

              <Select
                value={generateType}
                onValueChange={(value) => {
                  const next = value as ReportCardTypeT;
                  setGenerateType(next);

                  if (next === "EXAM") {
                    setGenerateExamId(sessionExams[0]?.id ?? "");
                  } else {
                    setGenerateExamId("");
                  }
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="EXAM">Examination Report</SelectItem>

                  <SelectItem value="ANNUAL">Annual Report</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {generateType === "EXAM" && (
              <Field>
                <Label>Examination</Label>

                <Select value={generateExamId} onValueChange={setGenerateExamId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select examination" />
                  </SelectTrigger>

                  <SelectContent>
                    {sessionExams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />

                <div>
                  <p className="text-sm font-semibold">Automatic generation</p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">The system will generate only missing report cards for eligible students. Existing report cards will not be duplicated.</p>

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

            <Button type="button" className="gap-2" disabled={generating || !canCreate || !effectiveSessionId || (generateType === "EXAM" && !generateExamId) || missingCount === 0} onClick={handleGenerate}>
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
    </DashboardLayout>
  );
}
