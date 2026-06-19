"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermission } from "@/hooks/usePermission";
import { useReportStore } from "@/store/maintenanceStore";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ChartContainer, ShadcnChartTooltip, ShadcnChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ClipboardList, Clock, Activity, CheckCircle2, XCircle, UserCog, CalendarDays, TrendingUp, Building2, MapPin, PieChart as PieChartIcon, Search, Download, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X } from "lucide-react";

import { PieChart, Pie, Cell, Label, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";

const PALETTE = {
  indigo: "#4f46e5",
  blue: "#2563eb",
  sky: "#0284c7",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#e11d48",
  violet: "#7c3aed",
  slate: "#64748b",
};

const PIE_COLORS = [PALETTE.indigo, PALETTE.amber, PALETTE.rose, PALETTE.emerald, PALETTE.violet, PALETTE.sky];

const priorityChartConfig = {
  tickets: {
    label: "Tickets",
  },
} satisfies ChartConfig;

const trendChartConfig = {
  count: {
    label: "Tickets",
    color: "#2563eb",
  },
} satisfies ChartConfig;

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "tickets", label: "Tickets" },
];

const PAGE_SIZE = 10;
const RANKED_PREVIEW = 6;

const ACCENTS = {
  indigo: { icon: "text-indigo-600 bg-indigo-50", num: "text-indigo-600" },
  amber: { icon: "text-amber-600 bg-amber-50", num: "text-amber-600" },
  blue: { icon: "text-blue-600 bg-blue-50", num: "text-blue-600" },
  sky: { icon: "text-sky-600 bg-sky-50", num: "text-sky-600" },
  emerald: { icon: "text-emerald-600 bg-emerald-50", num: "text-emerald-600" },
  slate: { icon: "text-slate-600 bg-slate-100", num: "text-slate-600" },
};

function isUnassignedValue(value: string | null | undefined) {
  return (value || "").toString().toLowerCase() === "unassigned";
}

function matchesDimension(actualName: string | null | undefined, filterValue: string) {
  if (filterValue === "all") return true;
  if (isUnassignedValue(filterValue)) return !actualName || isUnassignedValue(actualName);
  return actualName === filterValue;
}

function statusTone(value: string | null | undefined) {
  const v = (value || "").toString().toLowerCase();
  if (v.includes("pending")) return { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-100" };
  if (v.includes("assign")) return { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-100" };
  if (v.includes("progress")) return { dot: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50", ring: "ring-sky-100" };
  if (v.includes("resolved")) return { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-100" };
  if (v.includes("closed")) return { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", ring: "ring-slate-200" };
  return { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", ring: "ring-slate-200" };
}

function priorityTone(value: string | null | undefined) {
  const v = (value || "").toString().toLowerCase();
  if (v.includes("urgent") || v.includes("critical")) return { text: "text-rose-700", bg: "bg-rose-50", ring: "ring-rose-100" };
  if (v.includes("high")) return { text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-100" };
  if (v.includes("medium")) return { text: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-100" };
  if (v.includes("low")) return { text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-100" };
  return { text: "text-slate-600", bg: "bg-slate-100", ring: "ring-slate-200" };
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone = statusTone(value);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tone.bg} ${tone.text} ${tone.ring}`}>
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {value}
    </span>
  );
}

function PriorityBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone = priorityTone(value);
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tone.bg} ${tone.text} ${tone.ring}`}>{value}</span>;
}

function ChartEmptyState({ label = "No data for this period" }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{label}</div>;
}

function StatSkeleton() {
  return <span className="inline-block h-6 w-12 rounded-md bg-muted animate-pulse" />;
}

function RankedList({ items, color }: { items: { name: string; count: number }[]; color: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground py-6 text-center">No data for this period</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-3.5">
      {items.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-4 text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium truncate">{item.name}</span>
              <span className="text-sm font-semibold tabular-nums shrink-0">{item.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: color }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RankedCard({ title, icon: Icon, iconColor, items, color, onViewAll }: { title: string; icon: React.ElementType; iconColor: string; items: { name: string; count: number }[]; color: string; onViewAll: () => void }) {
  const sorted = useMemo(() => [...items].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)), [items]);
  const preview = sorted.slice(0, RANKED_PREVIEW);
  return (
    <Card className="border shadow-sm min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`size-4 ${iconColor}`} />
          {title}
        </CardTitle>
        <CardDescription>{items.length > RANKED_PREVIEW ? `Top ${RANKED_PREVIEW} of ${items.length}` : "Ranked by ticket volume"}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <RankedList items={preview} color={color} />
        {items.length > RANKED_PREVIEW && (
          <Button variant="ghost" size="sm" className="w-full mt-3 text-sky-600 hover:text-sky-700 hover:bg-sky-50" onClick={onViewAll}>
            View all {items.length}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border bg-card shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b p-4 sticky top-0 bg-card">
          <div>
            <h3 className="font-semibold">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options, placeholder }: { value: string; onChange: (value: string) => void; options: string[]; placeholder: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 min-w-50">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>

        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type ReportTicket = {
  ticketCode?: string;
  description?: string;
  locationType?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
  department?: {
    name?: string;
  } | null;
  assignedTechnician?: {
    name?: string;
  } | null;
};

function exportTicketsExcel(tickets: ReportTicket[], period: string) {
  const data = tickets.map((t) => ({
    Ticket: t.ticketCode,
    Description: t.description,
    Location: t.locationType,
    Priority: t.priority,
    Status: t.status,
    Department: t.department?.name ?? "Unassigned",
    Technician: t.assignedTechnician?.name ?? "Unassigned",
    Created: t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(file, `tickets-${period}-${Date.now()}.xlsx`);
}

function exportTicketsPDF(tickets: ReportTicket[], period: string) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Maintenance Tickets Report", 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Period: ${period} | Generated: ${new Date().toLocaleString("en-IN")} | ${tickets.length} ticket(s)`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Ticket", "Description", "Location", "Priority", "Status", "Department", "Technician", "Created"]],
    body: tickets.map((t) => [
      t.ticketCode ?? "",
      t.description ?? "",
      t.locationType ?? "",
      t.priority ?? "",
      t.status ?? "",
      t.department?.name ?? "Unassigned",
      t.assignedTechnician?.name ?? "Unassigned",
      t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`tickets-${period}-${Date.now()}.pdf`);
}

function computeLiveSummary(
  tickets: Array<{
    status?: string | null;
  }>
) {
  const matchStatus = (s: string) => (t: { status?: string | null }) => (t.status || "").toLowerCase().includes(s);
  return {
    totalTickets: tickets.length,
    pending: tickets.filter(matchStatus("pending")).length,
    assigned: tickets.filter(matchStatus("assign")).length,
    inProgress: tickets.filter(matchStatus("progress")).length,
    resolved: tickets.filter(matchStatus("resolved")).length,
    closed: tickets.filter(matchStatus("closed")).length,
  };
}

export default function ReportsPage() {
  const authorized = usePermission("report.read");
  const { report, loading, fetchReports } = useReportStore();

  const [period, setPeriod] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");
  const [appliedPeriod, setAppliedPeriod] = useState("");
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>();
  const [status, setStatus] = useState("all");
  const [technician, setTechnician] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [activeModal, setActiveModal] = useState<"locations" | "departments" | "technicians" | null>(null);
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState("desc");
  const [appliedFilters, setAppliedFilters] = useState({
    department: "all",
    location: "all",
    status: "all",
    technician: "all",
    priority: "all",
    search: "",
    period: "",
    dateRange: undefined as DateRange | undefined,
  });

  useEffect(() => {
    const params: Record<string, string> = {};
    if (appliedPeriod) {
      params.period = appliedPeriod;
    }

    if (appliedDateRange?.from && appliedDateRange?.to) {
      params.from = appliedDateRange.from.toISOString();
      const endDate = new Date(appliedDateRange.to);
      endDate.setHours(23, 59, 59, 999);

      params.to = endDate.toISOString();
    }

    fetchReports(params);
  }, [appliedPeriod, appliedDateRange, fetchReports]);

  const summary = report?.summary;

  const priorityChart = report?.charts?.priorityChart?.map((item) => ({ name: item.priority, value: item._count })) || [];

  const totalPriorityTickets = priorityChart.reduce((sum, item) => sum + item.value, 0);

  const departmentChartAll =
    report?.charts?.departmentChart?.map((item) => ({
      name: item.name || "Unassigned",
      count: item.count,
    })) || [];
  const technicianChartAll =
    report?.charts?.technicianChart?.map((item) => ({
      name: item.name || "Unassigned",
      count: item.count,
    })) || [];
  const locationChartAll =
    report?.charts?.locationChart?.map((item) => ({
      name: item.locationType || "Unassigned",
      count: item._count,
    })) || [];
  const trendChart = report?.charts?.trendChart || [];

  const departmentOptions = useMemo(() => {
    const names = Array.from(new Set(departmentChartAll.map((d) => d.name).filter((n) => n && !isUnassignedValue(n))));
    const hasUnassigned = (report?.tickets || []).some((t) => !t.department?.name);
    return hasUnassigned ? [...names, "Unassigned"] : names;
  }, [departmentChartAll, report]);

  const locationOptions = useMemo(() => {
    const names = Array.from(new Set(locationChartAll.map((l) => l.name).filter((n) => n && !isUnassignedValue(n))));
    const hasUnassigned = (report?.tickets || []).some((t) => !t.locationType);
    return hasUnassigned ? [...names, "Unassigned"] : names;
  }, [locationChartAll, report]);

  const statusOptions = useMemo(() => Array.from(new Set((report?.tickets || []).map((t) => t.status).filter(Boolean))), [report]);
  const technicianOptions = useMemo(() => Array.from(new Set((report?.tickets || []).map((t) => t.assignedTechnician?.name).filter((name): name is string => Boolean(name)))), [report]);
  const priorityOptions = useMemo(() => Array.from(new Set((report?.tickets || []).map((t) => t.priority).filter((priority): priority is string => Boolean(priority)))), [report]);
  const filteredTickets = useMemo(() => {
    let list = report?.tickets || [];
    if (appliedFilters.department !== "all") list = list.filter((t) => matchesDimension(t.department?.name, appliedFilters.department));
    if (appliedFilters.location !== "all") list = list.filter((t) => matchesDimension(t.locationType, appliedFilters.location));
    if (appliedFilters.status !== "all") list = list.filter((t) => t.status === appliedFilters.status);
    if (appliedFilters.technician !== "all") {
      list = list.filter((t) => (t.assignedTechnician?.name || "").toLowerCase() === appliedFilters.technician.toLowerCase());
    }
    if (appliedFilters.priority !== "all") {
      list = list.filter((t) => (t.priority || "").toLowerCase() === appliedFilters.priority.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) => t.ticketCode?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.assignedTechnician?.name?.toLowerCase().includes(q) || t.department?.name?.toLowerCase().includes(q) || t.locationType?.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "desc" ? -diff : diff;
    });
  }, [report, appliedFilters, sortDir, search]);

  const hasActiveFilters =
    appliedFilters.department !== "all" || appliedFilters.location !== "all" || appliedFilters.status !== "all" || appliedFilters.technician !== "all" || appliedFilters.priority !== "all" || appliedPeriod !== "" || !!appliedDateRange?.from;

  const liveSummary = hasActiveFilters ? computeLiveSummary(filteredTickets) : summary;

  const filtersChanged =
    department !== appliedFilters.department ||
    location !== appliedFilters.location ||
    status !== appliedFilters.status ||
    technician !== appliedFilters.technician ||
    priority !== appliedFilters.priority ||
    period !== appliedPeriod ||
    dateRange?.from?.getTime() !== appliedDateRange?.from?.getTime() ||
    dateRange?.to?.getTime() !== appliedDateRange?.to?.getTime();

  const stats = [
    { label: "Total Tickets", value: liveSummary?.totalTickets ?? 0, icon: ClipboardList, accent: "indigo" },
    { label: "Pending", value: liveSummary?.pending ?? 0, icon: Clock, accent: "amber" },
    { label: "Assigned", value: liveSummary?.assigned ?? 0, icon: UserCog, accent: "blue" },
    { label: "In Progress", value: liveSummary?.inProgress ?? 0, icon: Activity, accent: "sky" },
    { label: "Resolved", value: liveSummary?.resolved ?? 0, icon: CheckCircle2, accent: "emerald" },
    { label: "Closed", value: liveSummary?.closed ?? 0, icon: XCircle, accent: "slate" },
  ] as const;

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paginatedTickets = filteredTickets.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const MODAL_CONFIG = {
    locations: { title: "All Locations", items: locationChartAll, color: PALETTE.violet },
    departments: { title: "All Departments", items: departmentChartAll, color: PALETTE.emerald },
    technicians: { title: "All Technicians", items: technicianChartAll, color: PALETTE.blue },
  };
  const modal = activeModal && MODAL_CONFIG[activeModal] ? MODAL_CONFIG[activeModal] : null;
  if (authorized === null) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-black">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">Analytics and maintenance insights</p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 px-4 gap-2 text-sm">
                  <Download className="size-3.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportTicketsPDF(filteredTickets, appliedPeriod)}>PDF</DropdownMenuItem>

                <DropdownMenuItem onClick={() => exportTicketsExcel(filteredTickets, appliedPeriod)}>Spreadsheet</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
          {/* <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-1 shrink-0">
            <SlidersHorizontal className="size-3.5" />
            Filters
          </div> */}

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket"
              className="h-9 w-full sm:w-38 rounded-md border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
            />
          </div>

          <FilterSelect value={department} onChange={setDepartment} options={departmentOptions} placeholder="All departments" />
          <FilterSelect value={location} onChange={setLocation} options={locationOptions} placeholder="All locations" />
          <FilterSelect value={status} onChange={setStatus} options={statusOptions} placeholder="All statuses" />
          <FilterSelect value={technician} onChange={setTechnician} options={technicianOptions} placeholder="All technicians" />
          <FilterSelect value={priority} onChange={setPriority} options={priorityOptions} placeholder="All priorities" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                {period
                  ? period.charAt(0).toUpperCase() + period.slice(1)
                  : dateRange?.from
                    ? dateRange.to
                      ? `${dateRange.from.toLocaleDateString("en-IN")} - ${dateRange.to.toLocaleDateString("en-IN")}`
                      : dateRange.from.toLocaleDateString("en-IN")
                    : "Date Range"}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-3" align="start">
              <div className="flex gap-2 mb-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPeriod("today");
                    setDateRange(undefined);
                  }}
                >
                  Today
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPeriod("week");
                    setDateRange(undefined);
                  }}
                >
                  Week
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPeriod("month");
                    setDateRange(undefined);
                  }}
                >
                  Month
                </Button>
              </div>

              <Calendar
                mode="range"
                numberOfMonths={2}
                defaultMonth={new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  setPeriod("");
                }}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
          <Button
            className="ml-auto"
            disabled={!filtersChanged}
            onClick={() => {
              setAppliedFilters({
                department,
                location,
                status,
                technician,
                priority,
                search: "",
                period,
                dateRange,
              });

              setAppliedPeriod(period);
              setAppliedDateRange(dateRange);
              setPage(1);
            }}
          >
            Apply Filters
          </Button>
        </div>
        <div className="flex justify-end">
          {hasActiveFilters && (
            <button
              onClick={() => {
                setDepartment("all");
                setLocation("all");
                setStatus("all");
                setTechnician("all");
                setPriority("all");
                setSearch("");
                setPeriod("");
                setDateRange(undefined);
                setAppliedPeriod("");
                setAppliedDateRange(undefined);

                setAppliedFilters({
                  department: "all",
                  location: "all",
                  status: "all",
                  technician: "all",
                  priority: "all",
                  search: "",
                  period: "",
                  dateRange: undefined,
                });
              }}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline ml-auto shrink-0"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* KPI ribbon */}
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-x divide-y xl:divide-y-0 divide-border">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const tone = ACCENTS[stat.accent];
                return (
                  <div key={stat.label} className="p-4 flex items-center gap-3 min-w-0">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground truncate">{stat.label}</p>
                      <p className={`text-xl font-bold tabular-nums leading-tight ${tone.num}`}>{loading ? <StatSkeleton /> : stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="border-b flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${activeTab === tab.key ? "border-sky-600 text-sky-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
              {tab.key === "tickets" && <span className="ml-1.5 text-xs text-muted-foreground">({filteredTickets.length})</span>}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <Card className="border shadow-sm xl:col-span-2 min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4 text-indigo-600" />
                    Ticket Trend
                  </CardTitle>
                  <CardDescription>Tickets created over time</CardDescription>
                </CardHeader>
                <CardContent className="h-80 pt-2 min-w-0">
                  {trendChart.length === 0 ? (
                    <ChartEmptyState />
                  ) : (
                    <ChartContainer config={trendChartConfig} className="h-full w-full">
                      <AreaChart data={trendChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <defs>
                          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid vertical={false} />

                        <XAxis dataKey="date" tickLine={false} axisLine={false} />

                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />

                        <ShadcnChartTooltip content={<ShadcnChartTooltipContent />} />

                        <Area type="monotone" dataKey="count" name="Tickets" stroke="var(--color-count)" strokeWidth={2.5} fill="url(#trendFill)" />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border shadow-sm min-w-0">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChartIcon className="size-4 text-rose-600" />
                    Priority
                  </CardTitle>
                  <CardDescription>Breakdown by priority</CardDescription>
                </CardHeader>
                <CardContent className="h-80 pt-2 min-w-0">
                  {priorityChart.length === 0 ? (
                    <ChartEmptyState />
                  ) : (
                    <ChartContainer config={priorityChartConfig} className="mx-auto aspect-square max-h-70">
                      <PieChart>
                        <ShadcnChartTooltip cursor={false} content={<ShadcnChartTooltipContent hideLabel />} />

                        <Pie data={priorityChart} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95} strokeWidth={5}>
                          {priorityChart.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}

                          <Label
                            content={({ viewBox }) => {
                              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                                      {totalPriorityTickets}
                                    </tspan>

                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                                      Tickets
                                    </tspan>
                                  </text>
                                );
                              }
                              return null;
                            }}
                          />
                        </Pie>

                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <RankedCard title="Top Locations" icon={MapPin} iconColor="text-violet-600" items={locationChartAll} color={PALETTE.violet} onViewAll={() => setActiveModal("locations")} />
              <RankedCard title="Top Departments" icon={Building2} iconColor="text-emerald-600" items={departmentChartAll} color={PALETTE.emerald} onViewAll={() => setActiveModal("departments")} />
              <RankedCard title="Top Technicians" icon={UserCog} iconColor="text-blue-600" items={technicianChartAll} color={PALETTE.blue} onViewAll={() => setActiveModal("technicians")} />
            </div>
          </div>
        )}

        {/* Tickets tab */}
        {activeTab === "tickets" && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Tickets</CardTitle>
              <CardDescription>{hasActiveFilters ? `${filteredTickets.length} ticket(s) match the current filters` : "Latest maintenance tickets"}</CardDescription>
            </CardHeader>

            <CardContent className="pt-2">
              {filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <CalendarDays className="size-10 text-muted-foreground/30 mb-3" />
                  <h3 className="font-semibold text-sm">No tickets found</h3>
                  <p className="text-sm text-muted-foreground mt-1">{hasActiveFilters ? "Try adjusting or clearing your filters." : "No tickets are available for the selected period."}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40 border-b">
                          <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Ticket</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Location</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Priority</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Department</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Technician</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                            <button onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))} className="flex items-center gap-1 hover:text-foreground">
                              Created
                              {sortDir === "desc" ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
                            </button>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedTickets.map((ticket) => (
                          <tr key={ticket.id} className="border-b last:border-0 odd:bg-muted/10 hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3">
                              <p className="font-semibold">{ticket.ticketCode}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-55">{ticket.description}</p>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">{ticket.locationType}</td>
                            <td className="py-2.5 px-3">
                              <PriorityBadge value={ticket.priority} />
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge value={ticket.status} />
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">{ticket.department?.name ?? <span className="italic">Unassigned</span>}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{ticket.assignedTechnician?.name ?? <span className="italic">Unassigned</span>}</td>
                            <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <p className="text-xs text-muted-foreground">
                      Showing {(pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, filteredTickets.length)} of {filteredTickets.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={pageSafe <= 1} onClick={() => setPage((p) => p - 1)} className="gap-1">
                        <ChevronLeft className="size-3.5" />
                        Prev
                      </Button>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {pageSafe} / {totalPages}
                      </span>
                      <Button variant="outline" size="sm" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => p + 1)} className="gap-1">
                        Next
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {modal && (
        <Modal title={modal.title} description={`${modal.items.length} total`} onClose={() => setActiveModal(null)}>
          <RankedList items={[...modal.items].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))} color={modal.color} />
        </Modal>
      )}
    </DashboardLayout>
  );
}
