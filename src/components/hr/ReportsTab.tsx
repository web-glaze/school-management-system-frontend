"use client";

import { useEffect, useState } from "react";
import { format, subMonths } from "date-fns";
import { ClipboardList, Download, Loader2, User, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHrStore } from "@/store/hrStore";
import { EMPLOYEE_TYPE_OPTIONS, DateField, EmployeePicker, EmptyState, SegmentedTabs, currentPeriodKey, daysText, minutesText, monthBounds, toastError } from "@/components/hr/shared";
import { EmployeeReportView, downloadCsv } from "@/components/hr/parts";

const ALL = "ALL";
type View = "summary" | "employee";
type Range = { from: string; to: string };

function RangeBar({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  const thisMonth = monthBounds(currentPeriodKey());
  const lastMonth = monthBounds(format(subMonths(new Date(), 1), "yyyy-MM"));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="grid flex-1 gap-3 sm:grid-cols-2 sm:max-w-md">
        <DateField value={range.from} onChange={(from) => onChange({ ...range, from })} placeholder="From" />
        <DateField value={range.to} onChange={(to) => onChange({ ...range, to })} placeholder="To" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onChange(thisMonth)}>
          This month
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChange(lastMonth)}>
          Last month
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────── Summary ─────────────────────────

function SummaryView({ range, onRange, onOpen }: { range: Range; onRange: (r: Range) => void; onOpen: (employeeId: string) => void }) {
  const { summaryReport, departments, loading, fetchSummaryReport, fetchDepartments } = useHrStore();
  const [department, setDepartment] = useState(ALL);
  const [type, setType] = useState(ALL);

  useEffect(() => {
    fetchDepartments().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!range.from || !range.to) return;
    fetchSummaryReport({
      from: range.from,
      to: range.to,
      department: department === ALL ? undefined : department,
      type: type === ALL ? undefined : type,
    }).catch((e) => toastError(e, "Failed to load the report"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, department, type]);

  function exportCsv() {
    if (!summaryReport) return;
    downloadCsv(`attendance-summary-${summaryReport.from}-to-${summaryReport.to}.csv`, [
      ["Employee code", "Name", "Department", "Working days", "Present", "Half days", "Late", "Absent", "Paid leave", "Unpaid leave", "Unmarked", "Pending"],
      ...summaryReport.rows.map((r) => [r.employee.employeeCode, r.employee.name, r.employee.department ?? "", r.workingDays, r.presentDays, r.halfDays, r.lateCount, r.absentDays, r.paidLeaveDays, r.unpaidLeaveDays, r.unmarkedDays, r.pendingDays]),
    ]);
  }

  const t = summaryReport?.totals;

  return (
    <div className="space-y-5">
      <RangeBar range={range} onChange={onRange} />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="h-10 w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-10 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {EMPLOYEE_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" className="ml-auto gap-2" onClick={exportCsv} disabled={!summaryReport?.rows.length}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {loading && !summaryReport ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !summaryReport || summaryReport.rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No data for this period" />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Working</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Half days</TableHead>
                <TableHead className="text-right">Late</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="text-right">Paid leave</TableHead>
                <TableHead className="text-right">Unpaid leave</TableHead>
                <TableHead className="text-right">Unmarked</TableHead>
                <TableHead className="text-right">Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryReport.rows.map((r) => (
                <TableRow key={r.employee.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onOpen(r.employee.id)}>
                  <TableCell>
                    <p className="font-medium">{r.employee.name}</p>
                    <p className="text-xs text-muted-foreground">{r.employee.employeeCode}</p>
                  </TableCell>
                  <TableCell className="text-right">{daysText(r.workingDays)}</TableCell>
                  <TableCell className="text-right">{daysText(r.presentDays)}</TableCell>
                  <TableCell className="text-right">{r.halfDays}</TableCell>
                  <TableCell className="text-right">{r.lateCount}</TableCell>
                  <TableCell className={`text-right ${r.absentDays ? "font-medium text-red-600" : ""}`}>{daysText(r.absentDays)}</TableCell>
                  <TableCell className="text-right">{daysText(r.paidLeaveDays)}</TableCell>
                  <TableCell className="text-right">{daysText(r.unpaidLeaveDays)}</TableCell>
                  <TableCell className={`text-right ${r.unmarkedDays ? "font-medium text-amber-600" : ""}`}>{daysText(r.unmarkedDays)}</TableCell>
                  <TableCell className="text-right">{daysText(r.pendingDays)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {t && (
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total ({summaryReport.employeeCount})</TableCell>
                  <TableCell className="text-right">{daysText(t.workingDays)}</TableCell>
                  <TableCell className="text-right">{daysText(t.presentDays)}</TableCell>
                  <TableCell className="text-right">{t.halfDays}</TableCell>
                  <TableCell className="text-right">{t.lateCount}</TableCell>
                  <TableCell className="text-right">{daysText(t.absentDays)}</TableCell>
                  <TableCell className="text-right">{daysText(t.paidLeaveDays)}</TableCell>
                  <TableCell className="text-right">{daysText(t.unpaidLeaveDays)}</TableCell>
                  <TableCell className="text-right">{daysText(t.unmarkedDays)}</TableCell>
                  <TableCell className="text-right">{daysText(t.pendingDays)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Click a row to see that employee&apos;s full report. Half-day attendance counts 0.5 in Present. Unmarked days are finished working days with no attendance or leave recorded.</p>
      {summaryReport && summaryReport.rows.length > 0 && <span className="hidden">{minutesText(0)}</span>}
    </div>
  );
}

// ───────────────────────── Employee detail ─────────────────────────

function EmployeeView({ employeeId, onEmployee, range, onRange }: { employeeId: string; onEmployee: (id: string) => void; range: Range; onRange: (r: Range) => void }) {
  const { employeeLookup, employeeReport, loading, fetchEmployeeLookup, fetchEmployeeReport } = useHrStore();

  useEffect(() => {
    fetchEmployeeLookup(true).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!employeeId || !range.from || !range.to) return;
    fetchEmployeeReport(employeeId, range.from, range.to).catch((e) => toastError(e, "Failed to load the report"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, range.from, range.to]);

  const report = employeeReport && employeeReport.employee.id === employeeId ? employeeReport : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:max-w-md">
        <EmployeePicker employees={employeeLookup} value={employeeId} onChange={onEmployee} placeholder="Select an employee" />
      </div>
      <RangeBar range={range} onChange={onRange} />

      {!employeeId ? (
        <EmptyState icon={User} title="Pick an employee" hint="Or click a row in the summary." />
      ) : loading && !report ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : report ? (
        <EmployeeReportView report={report} />
      ) : null}
    </div>
  );
}

// ───────────────────────── Tab ─────────────────────────

export default function ReportsTab() {
  const [view, setView] = useState<View>("summary");
  const [employeeId, setEmployeeId] = useState("");
  const [range, setRange] = useState<Range>(monthBounds(currentPeriodKey()));

  const views: { id: View; label: string; icon: LucideIcon }[] = [
    { id: "summary", label: "Summary", icon: Users },
    { id: "employee", label: "Employee Report", icon: User },
  ];

  return (
    <div className="space-y-6">
      <SegmentedTabs tabs={views} value={view} onChange={setView} />

      {view === "summary" ? (
        <SummaryView
          range={range}
          onRange={setRange}
          onOpen={(id) => {
            setEmployeeId(id);
            setView("employee");
          }}
        />
      ) : (
        <EmployeeView employeeId={employeeId} onEmployee={setEmployeeId} range={range} onRange={setRange} />
      )}
    </div>
  );
}