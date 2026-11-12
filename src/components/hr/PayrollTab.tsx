"use client";

import { useEffect, useState } from "react";
import { format, subMonths } from "date-fns";
import { toast } from "sonner";
import { Banknote, Eye, Loader2, Lock, LockOpen, MoreVertical, Pencil, Plus, RefreshCw, Trash2, Wallet, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHasPermission } from "@/hooks/usePermission";
import type { SalaryComponent } from "@/services/hr.service";
import { useHrStore, type Payslip, type SalaryStructure } from "@/store/hrStore";
import { ConfirmDialog, DateField, DialogHeading, EmployeePicker, EmptyState, FieldError, SegmentedTabs, currentPeriodKey, dateKey, daysText, fieldErrors, formatDate, money, num, periodLabel, todayStr, toastError } from "@/components/hr/shared";
import { CheckField, PayslipDetailDialog, ResultDialog, type ResultInfo } from "@/components/hr/parts";

const ALL = "ALL";

// ───────────────────────── Salary dialog ─────────────────────────

type ComponentRow = { name: string; type: "FIXED" | "PERCENT"; value: string };

function ComponentEditor({ title, rows, onChange, addLabel }: { title: string; rows: ComponentRow[]; onChange: (rows: ComponentRow[]) => void; addLabel: string }) {
  const update = (i: number, patch: Partial<ComponentRow>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => onChange([...rows, { name: "", type: "FIXED", value: "" }])}>
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>

      {rows.length === 0 && <p className="text-xs text-muted-foreground">None added.</p>}

      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_8rem_6rem_auto] items-center gap-2">
          <Input value={r.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Name" className="h-10" />
          <Select value={r.type} onValueChange={(v) => update(i, { type: v as "FIXED" | "PERCENT" })}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED">Fixed ₹</SelectItem>
              <SelectItem value="PERCENT">% of salary</SelectItem>
            </SelectContent>
          </Select>
          <Input value={r.value} onChange={(e) => update(i, { value: e.target.value.replace(/[^\d.]/g, "") })} placeholder="0" inputMode="decimal" className="h-10" />
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

const toRows = (items: SalaryComponent[] | null): ComponentRow[] => (items ?? []).map((c) => ({ name: c.name, type: c.type, value: String(c.value) }));

function SalaryDialog({ entry, onClose }: { entry: { structure: SalaryStructure | null } | null; onClose: () => void }) {
  const { missingSalaries, createSalaryStructure, updateSalaryStructure } = useHrStore();
  const structure = entry?.structure ?? null;

  const [employeeId, setEmployeeId] = useState("");
  const [salary, setSalary] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayStr());
  const [allowances, setAllowances] = useState<ComponentRow[]>([]);
  const [deductions, setDeductions] = useState<ComponentRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) return;
    const s = entry.structure;
    setEmployeeId(s?.employeeId ?? "");
    setSalary(s ? String(num(s.monthlySalary)) : "");
    setEffectiveFrom(s ? dateKey(s.effectiveFrom) : todayStr());
    setAllowances(toRows(s?.allowances ?? null));
    setDeductions(toRows(s?.deductions ?? null));
    setErrors({});
  }, [entry]);

  function buildComponents(rows: ComponentRow[], label: string): SalaryComponent[] | string {
    const used = rows.filter((r) => r.name.trim() || r.value.trim());
    const out: SalaryComponent[] = [];
    for (const r of used) {
      const value = Number(r.value);
      if (!r.name.trim()) return `Every ${label} needs a name`;
      if (!Number.isFinite(value) || value < 0 || r.value.trim() === "") return `Enter a valid amount for "${r.name}"`;
      if (r.type === "PERCENT" && value > 100) return `"${r.name}" cannot be more than 100%`;
      out.push({ name: r.name.trim(), type: r.type, value });
    }
    return out;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!employeeId) errs.employeeId = "Select an employee";
    const amount = Number(salary);
    if (!salary.trim() || !Number.isFinite(amount) || amount < 0) errs.monthlySalary = "Enter the monthly salary";
    if (!effectiveFrom) errs.effectiveFrom = "Pick the effective date";

    const allow = buildComponents(allowances, "allowance");
    const deduct = buildComponents(deductions, "deduction");
    if (typeof allow === "string") errs.allowances = allow;
    if (typeof deduct === "string") errs.deductions = deduct;

    setErrors(errs);
    if (Object.keys(errs).length || typeof allow === "string" || typeof deduct === "string") return;

    setSaving(true);
    try {
      if (structure) {
        await updateSalaryStructure(employeeId, { monthlySalary: amount, allowances: allow, deductions: deduct, effectiveFrom });
        toast.success("Salary updated successfully");
      } else {
        await createSalaryStructure({ employeeId, monthlySalary: amount, allowances: allow, deductions: deduct, effectiveFrom });
        toast.success("Salary saved successfully");
      }
      onClose();
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to save the salary");
    } finally {
      setSaving(false);
    }
  }

  const pickable = structure ? [structure.employee] : missingSalaries;

  return (
    <Dialog
      open={!!entry}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-150 p-0 overflow-hidden">
        <DialogHeading icon={Banknote} title={structure ? "Edit Salary" : "Set Salary"} description="Changes apply to payslips generated from now on. Finalized payslips never change." />

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <FieldGroup>
            <Field>
              <Label>Employee</Label>
              <EmployeePicker employees={pickable} value={employeeId} onChange={setEmployeeId} disabled={!!structure} hasError={!!errors.employeeId} />
              <FieldError message={errors.employeeId} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Monthly Salary (₹)</Label>
                <Input value={salary} onChange={(e) => setSalary(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" className="h-11" placeholder="0.00" />
                <FieldError message={errors.monthlySalary} />
              </Field>
              <Field>
                <Label>Effective From</Label>
                <DateField value={effectiveFrom} onChange={setEffectiveFrom} hasError={!!errors.effectiveFrom} />
                <FieldError message={errors.effectiveFrom} />
              </Field>
            </div>

            <div>
              <ComponentEditor title="Allowances" rows={allowances} onChange={setAllowances} addLabel="Add allowance" />
              <FieldError message={errors.allowances} />
            </div>

            <div>
              <ComponentEditor title="Fixed deductions (PF, tax, etc.)" rows={deductions} onChange={setDeductions} addLabel="Add deduction" />
              <FieldError message={errors.deductions} />
            </div>
          </FieldGroup>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {structure ? "Save Changes" : "Save Salary"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────── Salaries ─────────────────────────

const componentTotal = (items: SalaryComponent[] | null, base: number) => (items ?? []).reduce((sum, c) => sum + (c.type === "PERCENT" ? (base * c.value) / 100 : c.value), 0);

function SalariesView() {
  const { salaryStructures, missingSalaries, loading, fetchSalaryStructures, fetchMissingSalaries, deleteSalaryStructure } = useHrStore();
  const canCreate = useHasPermission("salary-structure.create");
  const canUpdate = useHasPermission("salary-structure.update");
  const canDelete = useHasPermission("salary-structure.delete");

  const [entry, setEntry] = useState<{ structure: SalaryStructure | null } | null>(null);
  const [removing, setRemoving] = useState<SalaryStructure | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSalaryStructures().catch((e) => toastError(e, "Failed to load salaries"));
    fetchMissingSalaries().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRemove() {
    if (!removing) return;
    setBusy(true);
    try {
      await deleteSalaryStructure(removing.employeeId);
      toast.success("Salary removed");
      setRemoving(null);
    } catch (error) {
      toastError(error, "Failed to remove the salary");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {missingSalaries.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{missingSalaries.length} active employee(s) have no salary set, so they are left out of payroll.</div>
        ) : (
          <span />
        )}
        {canCreate && (
          <Button className="gap-2" onClick={() => setEntry({ structure: null })} disabled={missingSalaries.length === 0}>
            <Plus className="size-4" />
            Set Salary
          </Button>
        )}
      </div>

      {loading && salaryStructures.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : salaryStructures.length === 0 ? (
        <EmptyState icon={Banknote} title="No salaries set yet" hint="Set each employee's monthly salary to include them in payroll." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Monthly salary</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Fixed deductions</TableHead>
                <TableHead>Effective from</TableHead>
                {(canUpdate || canDelete) && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryStructures.map((s) => {
                const base = num(s.monthlySalary);
                return (
                  <TableRow key={s.id} className={s.employee.isActive === false ? "opacity-60" : ""}>
                    <TableCell>
                      <p className="font-medium">{s.employee.name}</p>
                      <p className="text-xs text-muted-foreground">{s.employee.employeeCode}</p>
                    </TableCell>
                    <TableCell className="text-right font-medium">{money(base)}</TableCell>
                    <TableCell className="text-right">{money(componentTotal(s.allowances, base))}</TableCell>
                    <TableCell className="text-right">{money(componentTotal(s.deductions, base))}</TableCell>
                    <TableCell>{formatDate(s.effectiveFrom)}</TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => setEntry({ structure: s })}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem className="text-red-600" onClick={() => setRemoving(s)}>
                                <Trash2 className="mr-2 size-4" />
                                Remove
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <SalaryDialog entry={entry} onClose={() => setEntry(null)} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => {
          if (!o) setRemoving(null);
        }}
        title="Remove this salary?"
        description={`${removing?.employee.name ?? "This employee"} will be left out of payroll until a salary is set again. Existing payslips are kept.`}
        confirmLabel="Remove"
        destructive
        loading={busy}
        onConfirm={handleRemove}
      />
    </div>
  );
}

// ───────────────────────── Payslips ─────────────────────────

type FinalizeTarget = { kind: "all" } | { kind: "one"; slip: Payslip };

function FinalizeDialog({ target, count, loading, onClose, onConfirm }: { target: FinalizeTarget | null; count: number; loading: boolean; onClose: () => void; onConfirm: (allowUnmarked: boolean) => void }) {
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    if (target) setAllow(false);
  }, [target]);

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
        <DialogHeading
          icon={Lock}
          title={target?.kind === "one" ? "Finalize payslip" : `Finalize ${count} payslip(s)`}
          description="Figures are recalculated one last time, then locked. A locked payslip can be reopened if a mistake is found."
        />
        <div className="space-y-4 p-6">
          <CheckField checked={allow} onChange={setAllow} label="Pay unmarked days in full" hint="Working days with no attendance or leave recorded are normally blocked. Tick this to pay them in full instead." />
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => onConfirm(allow)} disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Finalize
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PayslipsView() {
  const { payslips, loading, fetchPayslips, generatePayroll, finalizePayroll, recalculatePayslip, finalizePayslip, reopenPayslip, deletePayslip } = useHrStore();
  const canGenerate = useHasPermission("payslip.create");
  const canRecalc = useHasPermission("payslip.update");
  const canFinalize = useHasPermission("payslip.finalize");
  const canDelete = useHasPermission("payslip.delete");

  const periods = Array.from({ length: 13 }, (_, i) => format(subMonths(new Date(), i), "yyyy-MM"));
  const [periodKey, setPeriodKey] = useState(currentPeriodKey());
  const [status, setStatus] = useState(ALL);
  const [detail, setDetail] = useState<Payslip | null>(null);
  const [finalizeTarget, setFinalizeTarget] = useState<FinalizeTarget | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "reopen" | "delete"; slip: Payslip } | null>(null);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<ResultInfo | null>(null);

  useEffect(() => {
    fetchPayslips({ periodKey, status: status === ALL ? undefined : status }).catch((e) => toastError(e, "Failed to load payslips"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKey, status]);

  const drafts = payslips.filter((p) => p.status === "DRAFT");
  const totalNet = payslips.reduce((sum, p) => sum + num(p.netSalary), 0);

  async function handleGenerate() {
    setWorking(true);
    try {
      const r = await generatePayroll({ periodKey });
      setResult({
        title: `Payslips for ${periodLabel(periodKey)}`,
        lines: [`${r.generated} draft payslip(s) calculated.`, `Pay period: ${formatDate(r.from)} – ${formatDate(r.to)}`],
        problems: r.skipped.map((s) => `${s.name}: ${s.reason}`),
        problemsTitle: "Skipped",
      });
    } catch (error) {
      toastError(error, "Failed to generate payslips");
    } finally {
      setWorking(false);
    }
  }

  async function handleFinalize(allowUnmarked: boolean) {
    if (!finalizeTarget) return;
    setWorking(true);
    try {
      if (finalizeTarget.kind === "one") {
        await finalizePayslip(finalizeTarget.slip.id, allowUnmarked);
        toast.success("Payslip finalized");
      } else {
        const r = await finalizePayroll({ periodKey, allowUnmarked });
        setResult({
          title: `Finalize ${periodLabel(periodKey)}`,
          lines: [`${r.finalized} payslip(s) finalized.`],
          problems: r.failed.map((f) => `${f.name}: ${f.error}`),
          problemsTitle: "Not finalized",
        });
      }
      setFinalizeTarget(null);
    } catch (error) {
      toastError(error, "Failed to finalize");
    } finally {
      setWorking(false);
    }
  }

  async function handleConfirm() {
    if (!confirm) return;
    setWorking(true);
    try {
      if (confirm.kind === "reopen") {
        await reopenPayslip(confirm.slip.id);
        toast.success("Payslip reopened. It is a draft again.");
      } else {
        await deletePayslip(confirm.slip.id);
        toast.success("Payslip deleted");
      }
      setConfirm(null);
    } catch (error) {
      toastError(error, "Action failed");
    } finally {
      setWorking(false);
    }
  }

  async function handleRecalculate(slip: Payslip) {
    try {
      await recalculatePayslip(slip.id);
      toast.success("Payslip recalculated");
    } catch (error) {
      toastError(error, "Failed to recalculate");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={periodKey} onValueChange={setPeriodKey}>
            <SelectTrigger className="h-10 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>
                  {periodLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="FINALIZED">Finalized</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {canGenerate && (
            <Button variant="outline" className="gap-2" onClick={handleGenerate} disabled={working}>
              {working ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Calculate payslips
            </Button>
          )}
          {canFinalize && (
            <Button className="gap-2" onClick={() => setFinalizeTarget({ kind: "all" })} disabled={drafts.length === 0}>
              <Lock className="size-4" />
              Finalize all ({drafts.length})
            </Button>
          )}
        </div>
      </div>

      {payslips.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total net payable</p>
            <p className="mt-1 text-2xl font-bold">{money(totalNet)}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Drafts</p>
            <p className="mt-1 text-2xl font-bold">{drafts.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Finalized</p>
            <p className="mt-1 text-2xl font-bold">{payslips.length - drafts.length}</p>
          </div>
        </div>
      )}

      {loading && payslips.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : payslips.length === 0 ? (
        <EmptyState icon={Wallet} title={`No payslips for ${periodLabel(periodKey)}`} hint={canGenerate ? 'Use "Calculate payslips" to create the drafts.' : undefined} />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Working</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="text-right">Unpaid leave</TableHead>
                <TableHead className="text-right">Deduction</TableHead>
                <TableHead className="text-right">Net salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((p) => {
                const warn = (p.breakdown?.warnings.length ?? 0) > 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.employee?.name}</p>
                      <p className="text-xs text-muted-foreground">{p.employee?.employeeCode}</p>
                    </TableCell>
                    <TableCell className="text-right">{daysText(p.workingDays)}</TableCell>
                    <TableCell className="text-right">{daysText(p.presentDays)}</TableCell>
                    <TableCell className="text-right">{daysText(p.absentDays)}</TableCell>
                    <TableCell className="text-right">{daysText(p.unpaidLeaveDays)}</TableCell>
                    <TableCell className="text-right text-red-600">{money(p.deductionAmount)}</TableCell>
                    <TableCell className="text-right font-semibold">{money(p.netSalary)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={p.status === "FINALIZED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                          {p.status === "FINALIZED" ? "Finalized" : "Draft"}
                        </Badge>
                        {warn && p.status === "DRAFT" && (
                          <span title="Has warnings. Open the payslip to see them." className="text-amber-600">
                            !
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetail(p)}>
                            <Eye className="mr-2 size-4" />
                            View
                          </DropdownMenuItem>
                          {p.status === "DRAFT" && canRecalc && (
                            <DropdownMenuItem onClick={() => handleRecalculate(p)}>
                              <RefreshCw className="mr-2 size-4" />
                              Recalculate
                            </DropdownMenuItem>
                          )}
                          {p.status === "DRAFT" && canFinalize && (
                            <DropdownMenuItem onClick={() => setFinalizeTarget({ kind: "one", slip: p })}>
                              <Lock className="mr-2 size-4" />
                              Finalize
                            </DropdownMenuItem>
                          )}
                          {p.status === "FINALIZED" && canFinalize && (
                            <DropdownMenuItem onClick={() => setConfirm({ kind: "reopen", slip: p })}>
                              <LockOpen className="mr-2 size-4" />
                              Reopen
                            </DropdownMenuItem>
                          )}
                          {p.status === "DRAFT" && canDelete && (
                            <DropdownMenuItem className="text-red-600" onClick={() => setConfirm({ kind: "delete", slip: p })}>
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <PayslipDetailDialog payslip={detail} onClose={() => setDetail(null)} />
      <FinalizeDialog target={finalizeTarget} count={drafts.length} loading={working} onClose={() => setFinalizeTarget(null)} onConfirm={handleFinalize} />
      <ResultDialog result={result} onClose={() => setResult(null)} />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
        title={confirm?.kind === "reopen" ? "Reopen this payslip?" : "Delete this draft payslip?"}
        description={
          confirm?.kind === "reopen"
            ? "It becomes a draft again so you can fix the cause and finalize it again. This is recorded in the audit log."
            : "The draft is removed. You can calculate it again later."
        }
        confirmLabel={confirm?.kind === "reopen" ? "Reopen" : "Delete"}
        destructive={confirm?.kind === "delete"}
        loading={working}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

// ───────────────────────── Tab ─────────────────────────

export default function PayrollTab() {
  const canSalaries = useHasPermission("salary-structure.read");
  const canPayslips = useHasPermission("payslip.read");
  const [view, setView] = useState<"payslips" | "salaries" | null>(null);

  const views: { id: "payslips" | "salaries"; label: string; icon: LucideIcon }[] = [
    ...(canPayslips ? [{ id: "payslips" as const, label: "Payslips", icon: Wallet }] : []),
    ...(canSalaries ? [{ id: "salaries" as const, label: "Salaries", icon: Banknote }] : []),
  ];
  if (views.length === 0) return null;
  const current = views.find((v) => v.id === view)?.id ?? views[0].id;

  return (
    <div className="space-y-6">
      {views.length > 1 && <SegmentedTabs tabs={views} value={current} onChange={setView} />}
      {current === "payslips" ? <PayslipsView /> : <SalariesView />}
    </div>
  );
}