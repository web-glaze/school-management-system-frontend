"use client";

import type { ReactNode } from "react";
import { CalendarDays, ClipboardList, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { EmployeeReport, LeaveBalance, Payslip } from "@/store/hrStore";
import { DialogHeading, EmptyState, StatusBadge, daysText, formatDate, formatTime, minutesText, money, periodLabel } from "@/components/hr/shared";

// ───────────────────────── CSV helpers ─────────────────────────

// Comma or tab separated, with "quoted, values".
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === "," || ch === "\t") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export const readFileText = (file: File) => file.text();

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob(["\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ───────────────────────── Small pieces ─────────────────────────

export const TEXTAREA_CLASS =
  "min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function CheckField({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label className={cn("flex items-start gap-3 rounded-lg border p-3 text-sm", disabled ? "opacity-60" : "cursor-pointer")}>
      <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const toneClass = { default: "", good: "text-emerald-600", warn: "text-amber-600", bad: "text-red-600" }[tone];
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", toneClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ───────────────────────── Result dialog ─────────────────────────

export interface ResultInfo {
  title: string;
  lines: string[];
  problems?: string[];
  problemsTitle?: string;
}

export function ResultDialog({ result, onClose }: { result: ResultInfo | null; onClose: () => void }) {
  return (
    <Dialog
      open={!!result}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
        {result && (
          <>
            <DialogHeading icon={ClipboardList} title={result.title} />
            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
              <ul className="space-y-1 text-sm">
                {result.lines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>

              {!!result.problems?.length && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 text-sm font-medium text-amber-800">
                    {result.problemsTitle ?? "Needs attention"} ({result.problems.length})
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
                    {result.problems.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter className="border-t px-6 py-4">
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────── Leave balances ─────────────────────────

export function LeaveBalanceCards({ balances, emptyText }: { balances: LeaveBalance[]; emptyText?: string }) {
  if (!balances.length) return <EmptyState icon={CalendarDays} title={emptyText ?? "No leave types set up yet"} />;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((b) => (
        <div key={b.leaveTypeId} className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: b.color ?? "#94a3b8" }} />
              <p className="truncate font-medium">{b.name}</p>
            </div>
            <Badge variant="outline">{b.isPaid ? "Paid" : "Unpaid"}</Badge>
          </div>

          {b.balance === null ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No policy covers this date.
              {b.used > 0 ? ` ${daysText(b.used)} day(s) taken this year.` : ""}
            </p>
          ) : (
            <>
              <p className="mt-3 text-3xl font-bold">
                {daysText(b.balance)} <span className="text-sm font-normal text-muted-foreground">days left</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {daysText(b.used)} used of {daysText(b.allotted)}
                {b.carriedForward > 0 ? ` (includes ${daysText(b.carriedForward)} carried forward)` : ""}
              </p>
              {b.periodStart && b.periodEnd && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(b.periodStart)} – {formatDate(b.periodEnd)}
                </p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── Employee report ─────────────────────────

const DIMMED = ["WEEKLY_OFF", "HOLIDAY", "NOT_JOINED"];

export function EmployeeReportView({ report }: { report: EmployeeReport }) {
  const s = report.summary;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Working days" value={daysText(s.workingDays)} hint={`${s.offDays} weekly off / holiday`} />
        <StatCard label="Present" value={daysText(s.presentDays)} tone="good" hint={s.halfDays ? `${s.halfDays} half day(s)` : undefined} />
        <StatCard label="Late" value={s.lateCount} tone={s.lateCount ? "warn" : "default"} hint={s.lateMinutes ? `${minutesText(s.lateMinutes)} in total` : undefined} />
        <StatCard label="Absent" value={daysText(s.absentDays)} tone={s.absentDays ? "bad" : "default"} />
        <StatCard label="Paid leave" value={daysText(s.paidLeaveDays)} />
        <StatCard label="Unpaid leave" value={daysText(s.unpaidLeaveDays)} tone={s.unpaidLeaveDays ? "warn" : "default"} />
        <StatCard label="Unmarked" value={daysText(s.unmarkedDays)} tone={s.unmarkedDays ? "warn" : "default"} hint="No attendance or leave recorded" />
        <StatCard label="Time worked" value={minutesText(s.workedMinutes)} />
      </div>

      <section>
        <h3 className="mb-3 text-base font-semibold">Daily record</h3>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead>Check out</TableHead>
                <TableHead>Worked</TableHead>
                <TableHead>Late by</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.days.map((d) => (
                <TableRow key={d.date} className={cn(DIMMED.includes(d.status) && "bg-muted/30")}>
                  <TableCell className="whitespace-nowrap font-medium">{formatDate(d.date, "dd MMM, EEE")}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell>{formatTime(d.checkIn)}</TableCell>
                  <TableCell>{formatTime(d.checkOut)}</TableCell>
                  <TableCell>{minutesText(d.workedMinutes)}</TableCell>
                  <TableCell>{d.lateMinutes ? minutesText(d.lateMinutes) : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.leave ? `${d.leave.typeName}${d.leave.halfDay ? " (half day)" : ""} • ${d.leave.isPaid ? "Paid" : "Unpaid"}` : d.remarks || ""}
                    {d.source === "MANUAL" && " • Edited by HR"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {report.leaves.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-semibold">Leaves in this period</h3>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.leaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.leaveType.name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(l.startDate)}
                      {l.startDate.slice(0, 10) !== l.endDate.slice(0, 10) ? ` – ${formatDate(l.endDate)}` : ""}
                    </TableCell>
                    <TableCell>{daysText(l.totalDays)}</TableCell>
                    <TableCell>{l.isPaid ? "Paid" : "Unpaid"}</TableCell>
                    <TableCell>{l.status === "ACTIVE" ? "Active" : "Cancelled"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-base font-semibold">Leave balances</h3>
        <LeaveBalanceCards balances={report.balances} />
      </section>
    </div>
  );
}

// ───────────────────────── Payslip detail ─────────────────────────

export function PayslipDetailDialog({ payslip, onClose }: { payslip: Payslip | null; onClose: () => void }) {
  const b = payslip?.breakdown;

  return (
    <Dialog
      open={!!payslip}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-150 p-0 overflow-hidden">
        {payslip && (
          <>
            <DialogHeading
              icon={Receipt}
              title={`Payslip • ${periodLabel(payslip.periodKey)}`}
              description={payslip.employee ? `${payslip.employee.name} (${payslip.employee.employeeCode})` : undefined}
            />

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Period {formatDate(payslip.periodStart)} – {formatDate(payslip.periodEnd)}
                </span>
                <Badge variant="outline" className={payslip.status === "FINALIZED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                  {payslip.status === "FINALIZED" ? "Finalized" : "Draft"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Working days" value={daysText(payslip.workingDays)} />
                <StatCard label="Present" value={daysText(payslip.presentDays)} tone="good" />
                <StatCard label="Absent" value={daysText(payslip.absentDays)} tone={Number(payslip.absentDays) ? "bad" : "default"} />
                <StatCard label="Paid leave" value={daysText(payslip.paidLeaveDays)} />
                <StatCard label="Unpaid leave" value={daysText(payslip.unpaidLeaveDays)} tone={Number(payslip.unpaidLeaveDays) ? "warn" : "default"} />
                <StatCard label="Late marks" value={payslip.lateCount} />
              </div>

              {!!b?.warnings.length && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <ul className="list-disc space-y-1 pl-5">
                    {b.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border text-sm">
                <div className="flex justify-between border-b px-4 py-3">
                  <span>Monthly salary</span>
                  <span className="font-medium">{money(payslip.monthlySalary)}</span>
                </div>

                {b?.allowances.map((a, i) => (
                  <div key={`a${i}`} className="flex justify-between border-b px-4 py-3 text-emerald-700">
                    <span>
                      {a.name}
                      {a.type === "PERCENT" ? ` (${a.value}%)` : ""}
                    </span>
                    <span>+ {money(a.amount)}</span>
                  </div>
                ))}

                <div className="flex justify-between border-b bg-muted/40 px-4 py-3 font-medium">
                  <span>Gross salary</span>
                  <span>{money(b ? b.grossSalary : payslip.monthlySalary)}</span>
                </div>

                <div className="border-b px-4 py-3">
                  <div className="flex justify-between text-red-600">
                    <span>Attendance deduction</span>
                    <span>− {money(payslip.deductionAmount)}</span>
                  </div>
                  {b && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {daysText(b.lostDays.total)} day(s) lost at {money(payslip.perDayRate)} per day: absent {daysText(b.lostDays.absent)}, unpaid leave {daysText(b.lostDays.unpaidLeave)}, half days {daysText(b.lostDays.halfDays)}, late marks{" "}
                      {daysText(b.lostDays.lates)}
                      {b.lostDays.beforeJoining ? `, before joining ${daysText(b.lostDays.beforeJoining)}` : ""}
                    </p>
                  )}
                </div>

                {b?.deductions.map((d, i) => (
                  <div key={`d${i}`} className="flex justify-between border-b px-4 py-3 text-red-600">
                    <span>
                      {d.name}
                      {d.type === "PERCENT" ? ` (${d.value}%)` : ""}
                    </span>
                    <span>− {money(d.amount)}</span>
                  </div>
                ))}

                <div className="flex justify-between bg-primary/5 px-4 py-4 text-base font-bold">
                  <span>Net salary</span>
                  <span>{money(payslip.netSalary)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}