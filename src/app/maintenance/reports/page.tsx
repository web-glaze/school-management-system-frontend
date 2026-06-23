"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermission } from "@/hooks/usePermission";
import { useReportStore } from "@/store/maintenanceStore";
import { useEffect, useMemo, useState } from "react";
import { ChartContainer, ShadcnChartTooltip, ShadcnChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ClipboardList,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  UserCog,
  CalendarDays,
  TrendingUp,
  Building2,
  PieChart as PieChartIcon,
  Download,
  X,
  SlidersHorizontal,
  CalendarRange,
  FileSpreadsheet,
} from "lucide-react";
import { PieChart, Pie, Cell, Label, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";

// ─── Design tokens ────────────────────────────────────────────────────────────

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

const priorityChartConfig = { tickets: { label: "Tickets" } } satisfies ChartConfig;
const trendChartConfig = { count: { label: "Tickets", color: "#2563eb" } } satisfies ChartConfig;

const RANKED_PREVIEW = 6;

const ACCENTS = {
  indigo: { icon: "text-indigo-600 bg-indigo-50", num: "text-indigo-600" },
  amber: { icon: "text-amber-600 bg-amber-50", num: "text-amber-600" },
  blue: { icon: "text-blue-600 bg-blue-50", num: "text-blue-600" },
  sky: { icon: "text-sky-600 bg-sky-50", num: "text-sky-600" },
  emerald: { icon: "text-emerald-600 bg-emerald-50", num: "text-emerald-600" },
  slate: { icon: "text-slate-600 bg-slate-100", num: "text-slate-600" },
};

function ChartEmptyState({ label = "No data for this period" }: { label?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/60">
        <PieChartIcon className="size-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StatSkeleton() {
  return <span className="inline-block h-6 w-12 animate-pulse rounded-md bg-muted" />;
}

function FilterChip({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
      <span className="text-sky-500/70">{label}:</span>
      {value}
      <button onClick={onRemove} className="ml-0.5 rounded-full text-sky-500 hover:text-sky-700" aria-label={`Remove ${label} filter`}>
        <X className="size-3" />
      </button>
    </span>
  );
}

// ─── RankedList ───────────────────────────────────────────────────────────────

function RankedList({ items, color }: { items: { name: string; count: number }[]; color: string }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">No data for this period</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-3.5">
      {items.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{item.name}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{item.count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: color }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RankedCard ───────────────────────────────────────────────────────────────

function RankedCard({
  title,
  icon: Icon,
  iconColor,
  items,
  color,
  onViewAll,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  items: { name: string; count: number }[];
  color: string;
  onViewAll: () => void;
}) {
  const sorted = useMemo(() => [...items].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)), [items]);
  const preview = sorted.slice(0, RANKED_PREVIEW);
  return (
    <Card className="min-w-0">
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
          <Button variant="ghost" size="sm" className="mt-3 w-full text-sky-600 hover:bg-sky-50 hover:text-sky-700" onClick={onViewAll}>
            View all {items.length}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-card shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b bg-card px-5 py-4">
          <div>
            <h3 className="font-semibold">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options:
    | string[]
    | {
        label: string;
        value: string;
      }[];
  placeholder: string;
}) {
  const isActive = value !== "all";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`flex-1 md:flex-none h-9 min-w-36 text-sm transition-colors ${isActive ? "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200" : ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((opt) =>
          typeof opt === "string" ? (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ) : (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const authorized = usePermission("report.read");
  const { report, filters, loading, fetchReports, fetchFilterOptions } = useReportStore();

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const summary = report?.summary;
  const statusChart = report?.statusChart || [];
  const priorityChart = report?.priorityChart || [];
  const departmentChart = report?.departmentChart || [];
  const technicianChart = report?.technicianChart || [];
  const locationChart = report?.locationChart || [];
  const trendChart = report?.trendChart || [];

  const [period, setPeriod] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");
  const [status, setStatus] = useState("all");
  const [technician, setTechnician] = useState("all");
  const [priority, setPriority] = useState("all");
  const [activeTab] = useState("overview");
  const [activeModal, setActiveModal] = useState<"departments" | "technicians" | "locations" | null>(null);
  const [appliedPeriod, setAppliedPeriod] = useState("");
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>();
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

  type ReportTicket = {
    ticketCode?: string;
    description?: string;
    locationType?: string;
    priority?: string;
    status?: string;
    createdAt?: string;
    department?: { name?: string } | null;
    assignedTechnician?: { name?: string } | null;
  };

  type ChartItem = {
    name: string;
    value: number;
  };

  type RankedItem = {
    name: string;
    count: number;
  };

  type AccentKey = keyof typeof ACCENTS;

  // Fetch when applied time window changes
  useEffect(() => {
    const params: Record<string, string> = {};

    if (appliedFilters.department !== "all") {
      params.departmentId = appliedFilters.department;
    }

    if (appliedFilters.technician !== "all") {
      params.technicianId = appliedFilters.technician;
    }

    if (appliedFilters.status !== "all") {
      params.status = appliedFilters.status;
    }

    if (appliedFilters.priority !== "all") {
      params.priority = appliedFilters.priority;
    }

    if (appliedFilters.location !== "all") {
      params.locationType = appliedFilters.location;
    }

    if (appliedPeriod) {
      params.period = appliedPeriod;
    }

    if (appliedDateRange?.from && appliedDateRange?.to) {
      params.from = appliedDateRange.from.toISOString();

      const end = new Date(appliedDateRange.to);
      end.setHours(23, 59, 59, 999);

      params.to = end.toISOString();
    }

    fetchReports(params);
  }, [appliedFilters.department, appliedFilters.technician, appliedFilters.status, appliedFilters.priority, appliedFilters.location, appliedPeriod, appliedDateRange]);

  const getDepartmentName = (id: string) => filters?.departments?.find((d) => d.id === id)?.name || id;

  const getTechnicianName = (id: string) => filters?.technicians?.find((t) => t.id === id)?.name || id;

  const totalPriorityTickets = priorityChart.reduce((sum: number, item: ChartItem) => sum + item.value, 0);

  const hasActiveFilters =
    appliedFilters.department !== "all" ||
    appliedFilters.location !== "all" ||
    appliedFilters.status !== "all" ||
    appliedFilters.technician !== "all" ||
    appliedFilters.priority !== "all" ||
    appliedPeriod !== "" ||
    !!appliedDateRange?.from;

  const filtersChanged =
    department !== appliedFilters.department ||
    location !== appliedFilters.location ||
    status !== appliedFilters.status ||
    technician !== appliedFilters.technician ||
    priority !== appliedFilters.priority ||
    period !== appliedPeriod ||
    dateRange?.from?.getTime() !== appliedDateRange?.from?.getTime() ||
    dateRange?.to?.getTime() !== appliedDateRange?.to?.getTime();

  // Active pending filter count for badge
  const pendingFilterCount = [department !== "all", location !== "all", status !== "all", technician !== "all", priority !== "all", !!period, !!dateRange?.from].filter(Boolean).length;

  const stats: {
    label: string;
    value: number;
    icon: React.ElementType;
    accent: AccentKey;
  }[] = [
    {
      label: "Total Tickets",
      value: summary?.totalTickets || 0,
      icon: ClipboardList,
      accent: "indigo",
    },
    {
      label: "Pending",
      value: summary?.pending || 0,
      icon: Clock,
      accent: "amber",
    },
    {
      label: "Assigned",
      value: summary?.assigned || 0,
      icon: UserCog,
      accent: "blue",
    },
    {
      label: "In Progress",
      value: summary?.inProgress || 0,
      icon: Activity,
      accent: "sky",
    },
    {
      label: "Resolved",
      value: summary?.resolved || 0,
      icon: CheckCircle2,
      accent: "emerald",
    },
    {
      label: "Closed",
      value: summary?.closed || 0,
      icon: XCircle,
      accent: "slate",
    },
  ];

  const MODAL_CONFIG = {
    departments: {
      title: "All Departments",
      items: departmentChart,
      color: PALETTE.emerald,
    },
    technicians: {
      title: "All Technicians",
      items: technicianChart,
      color: PALETTE.blue,
    },

    locations: {
      title: "All Locations",
      items: locationChart,
      color: PALETTE.blue,
    },
  };
  const modal = activeModal && MODAL_CONFIG[activeModal] ? MODAL_CONFIG[activeModal] : null;

  function applyFilters() {
    setAppliedFilters({ department, location, status, technician, priority, search: "", period, dateRange });
    setAppliedPeriod(period);
    setAppliedDateRange(dateRange);
  }

  function clearFilters() {
    setDepartment("all");
    setLocation("all");
    setStatus("all");
    setTechnician("all");
    setPriority("all");
    setPeriod("");
    setDateRange(undefined);
    setAppliedPeriod("");
    setAppliedDateRange(undefined);
    setAppliedFilters({ department: "all", location: "all", status: "all", technician: "all", priority: "all", search: "", period: "", dateRange: undefined });
  }

  function dateLabel() {
    if (period) return period.charAt(0).toUpperCase() + period.slice(1);
    if (dateRange?.from) {
      if (dateRange.to) return `${dateRange.from.toLocaleDateString("en-IN")} – ${dateRange.to.toLocaleDateString("en-IN")}`;
      return dateRange.from.toLocaleDateString("en-IN");
    }
    return "Custom range";
  }

  if (authorized === null) return null;

  const departmentOptions =
    filters?.departments?.map((d) => ({
      label: d.name,
      value: d.id,
    })) || [];

  const technicianOptions =
    filters?.technicians?.map((t) => ({
      label: t.name,
      value: t.id,
    })) || [];

  const statusOptions = filters?.statuses || [];

  const priorityOptions = filters?.priorities || [];

  const locationOptions = filters?.locations || [];

  const handleExport = async () => {
    const params = new URLSearchParams();

    if (appliedFilters.department !== "all") params.append("departmentId", appliedFilters.department);

    if (appliedFilters.technician !== "all") params.append("technicianId", appliedFilters.technician);

    if (appliedFilters.status !== "all") params.append("status", appliedFilters.status);

    if (appliedFilters.priority !== "all") params.append("priority", appliedFilters.priority);

    if (appliedFilters.location !== "all") params.append("locationType", appliedFilters.location);

    if (appliedPeriod) params.append("period", appliedPeriod);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/export?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "maintenance-report.xlsx";

    link.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-black md:text-3xl">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">Analytics and maintenance insights</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 px-4 text-sm" disabled={!summary || loading}>
                <Download className="size-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Spreadsheet (Coming Soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Filter panel ── */}
        <Card className="overflow-hidden">
          {/* Row 1 — Search · Period shortcuts · Date range */}
          <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3">
            {/* Quick period toggle */}
            <div className="flex items-center rounded-md border bg-muted/30">
              {(["today", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(period === p ? "" : p);
                    setDateRange(undefined);
                  }}
                  className={`rounded px-2 py-2 text-xs h-9 md:text-base md:px-4 font-medium transition-all ${period === p ? "bg-sky-600 text-white shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm"}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={`flex-1 md:flex-none h-9 gap-2 text-sm ${dateRange?.from ? "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200" : ""}`}>
                  <CalendarRange className="size-3.5" />
                  {dateRange?.from ? dateLabel() : "Custom range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
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
          </div>

          {/* Row 2 — Dimension filters + Apply */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <div className="flex shrink-0 items-center gap-1.5 mr-1">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</span>
              {pendingFilterCount > 0 && <span className="flex size-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold leading-none text-white">{pendingFilterCount}</span>}
            </div>

            <FilterSelect value={department} onChange={setDepartment} options={departmentOptions} placeholder="Department" />
            <FilterSelect value={location} onChange={setLocation} options={locationOptions} placeholder="Location" />
            <FilterSelect value={status} onChange={setStatus} options={statusOptions} placeholder="Status" />
            <FilterSelect value={technician} onChange={setTechnician} options={technicianOptions} placeholder="Technician" />
            <FilterSelect value={priority} onChange={setPriority} options={priorityOptions} placeholder="Priority" />

            <div className="ml-auto flex items-center gap-2">
              {(filtersChanged || hasActiveFilters) && (
                <button onClick={clearFilters} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  Clear all
                </button>
              )}
              <Button size="sm" disabled={!filtersChanged} onClick={applyFilters} className="px-5">
                Apply
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Active filter chips ── */}
        {hasActiveFilters &&
          (() => {
            const chips: { label: string; value: string; onRemove: () => void }[] = [];
            if (appliedPeriod)
              chips.push({
                label: "Period",
                value: appliedPeriod.charAt(0).toUpperCase() + appliedPeriod.slice(1),
                onRemove: () => {
                  setPeriod("");
                  setAppliedPeriod("");
                },
              });
            if (appliedDateRange?.from)
              chips.push({
                label: "Date",
                value: appliedDateRange.to ? `${appliedDateRange.from.toLocaleDateString("en-IN")} – ${appliedDateRange.to.toLocaleDateString("en-IN")}` : appliedDateRange.from.toLocaleDateString("en-IN"),
                onRemove: () => {
                  setDateRange(undefined);
                  setAppliedDateRange(undefined);
                },
              });
            if (appliedFilters.department !== "all")
              chips.push({
                label: "Department",
                value: getDepartmentName(appliedFilters.department),
                onRemove: () => {
                  setDepartment("all");
                  setAppliedFilters((f) => ({ ...f, department: "all" }));
                },
              });
            if (appliedFilters.location !== "all")
              chips.push({
                label: "Location",
                value: appliedFilters.location,
                onRemove: () => {
                  setLocation("all");
                  setAppliedFilters((f) => ({ ...f, location: "all" }));
                },
              });
            if (appliedFilters.status !== "all")
              chips.push({
                label: "Status",
                value: appliedFilters.status,
                onRemove: () => {
                  setStatus("all");
                  setAppliedFilters((f) => ({ ...f, status: "all" }));
                },
              });
            if (appliedFilters.technician !== "all")
              chips.push({
                label: "Technician",
                value: getTechnicianName(appliedFilters.technician),
                onRemove: () => {
                  setTechnician("all");
                  setAppliedFilters((f) => ({ ...f, technician: "all" }));
                },
              });
            if (appliedFilters.priority !== "all")
              chips.push({
                label: "Priority",
                value: appliedFilters.priority,
                onRemove: () => {
                  setPriority("all");
                  setAppliedFilters((f) => ({ ...f, priority: "all" }));
                },
              });

            if (!chips.length) return null;
            return (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Active filters:</span>
                {chips.map((c) => (
                  <FilterChip key={c.label} label={c.label} value={c.value} onRemove={c.onRemove} />
                ))}
                <button onClick={clearFilters} className="ml-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline shrink-0">
                  Clear all
                </button>
              </div>
            );
          })()}

        {/* ── KPI ribbon ── */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const tone = ACCENTS[stat.accent as keyof typeof ACCENTS];
                return (
                  <div key={stat.label} className="flex min-w-0 items-center gap-3 p-4">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                      <p className={`text-xl font-bold leading-tight tabular-nums ${tone.num}`}>{loading ? <StatSkeleton /> : stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Tabs and Content ── */}
        {!loading && !summary?.totalTickets ? (
          <Card className="flex flex-col items-center justify-center border-dashed py-20 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-8 ring-sky-50/50">
              <CalendarDays className="size-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No data available</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{hasActiveFilters ? "Try adjusting or clearing your filters to see results." : "No maintenance tickets are available for the selected period."}</p>
            {hasActiveFilters && (
              <Button size="sm" variant="outline" className="mt-5" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* ══════════ Overview tab ══════════ */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Trend + Priority */}
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                  <Card className="min-w-0 xl:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="size-4 text-indigo-600" />
                        Ticket Trend
                      </CardTitle>
                      <CardDescription>Tickets created over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 min-w-0 pt-2">
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

                  <Card className="min-w-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <PieChartIcon className="size-4 text-rose-600" />
                        Priority
                      </CardTitle>
                      <CardDescription>Breakdown by priority</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 min-w-0 pt-2">
                      {priorityChart.length === 0 ? (
                        <ChartEmptyState />
                      ) : (
                        <ChartContainer config={priorityChartConfig} className="mx-auto aspect-square max-h-[280px]">
                          <PieChart>
                            <ShadcnChartTooltip cursor={false} content={<ShadcnChartTooltipContent hideLabel />} />
                            <Pie data={priorityChart} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95} strokeWidth={5}>
                              {priorityChart.map((_: { name: string; value: number }, index: number) => (
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

                {/* Ranked cards */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <RankedCard title="Top Departments" icon={Building2} iconColor="text-emerald-600" items={departmentChart} color={PALETTE.emerald} onViewAll={() => setActiveModal("departments")} />

                  <RankedCard title="Top Technicians" icon={UserCog} iconColor="text-blue-600" items={technicianChart} color={PALETTE.blue} onViewAll={() => setActiveModal("technicians")} />

                  <RankedCard title="Top Locations" icon={Building2} iconColor="text-blue-600" items={locationChart} color={PALETTE.blue} onViewAll={() => setActiveModal("locations")} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <Modal title={modal.title} description={`${modal.items.length} total`} onClose={() => setActiveModal(null)}>
          <RankedList items={[...modal.items].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))} color={modal.color} />
        </Modal>
      )}
    </DashboardLayout>
  );
}
