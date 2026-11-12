"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, MoreVertical, Pencil, Plus, RefreshCw, Search, Upload, UserCheck, UserX, Users } from "lucide-react";
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
import apiClient from "@/services/api";
import { useHrStore, type AttendanceShift, type Employee } from "@/store/hrStore";
import type { AttendanceMode, CreateEmployeePayload, EmployeeType, UpdateEmployeePayload } from "@/services/hr.service";
import {
  ATTENDANCE_MODE_OPTIONS,
  ConfirmDialog,
  DateField,
  DialogHeading,
  EMPLOYEE_TYPE_OPTIONS,
  EmptyState,
  FieldError,
  dateKey,
  fieldErrors,
  labelOf,
  toastError,
} from "@/components/hr/shared";
import { CheckField, ResultDialog, downloadCsv, parseCsv, readFileText, TEXTAREA_CLASS, type ResultInfo } from "@/components/hr/parts";

const ALL = "ALL";
const DEFAULT_SHIFT = "DEFAULT";
const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const TYPE_BADGE: Record<EmployeeType, string> = {
  TEACHING: "border-sky-200 bg-sky-50 text-sky-700",
  NON_TEACHING: "border-violet-200 bg-violet-50 text-violet-700",
  OTHER: "border-slate-200 bg-slate-50 text-slate-600",
};

// ───────────────────────── Add / edit dialog ─────────────────────────

function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  shifts,
  departments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  shifts: AttendanceShift[];
  departments: string[];
}) {
  const { createEmployee, updateEmployee, getNextBiometricCode } = useHrStore();
  const linked = !!employee?.linkedTo;

  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState<EmployeeType>("OTHER");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>("BIOMETRIC");
  const [biometricCode, setBiometricCode] = useState("");
  const [shiftId, setShiftId] = useState(DEFAULT_SHIFT);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(employee?.name ?? "");
    setDesignation(employee?.designation ?? "");
    setDepartment(employee?.department ?? "");
    setType(employee?.type ?? "OTHER");
    setEmail(employee?.email ?? "");
    setPhone(employee?.phone ?? "");
    setJoiningDate(dateKey(employee?.joiningDate));
    setAttendanceMode(employee?.attendanceMode ?? "BIOMETRIC");
    setBiometricCode(employee?.biometricCode ?? "");
    setShiftId(employee?.shiftId ?? DEFAULT_SHIFT);
    setIsActive(employee?.isActive ?? true);
    setErrors({});
  }, [open, employee]);

  async function suggestCode() {
    try {
      setBiometricCode(await getNextBiometricCode());
    } catch (error) {
      toastError(error, "Could not get the next code");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!linked) {
      if (!name.trim()) errs.name = "Name is required";
      if (phone.trim() && !PHONE_RE.test(phone.trim())) errs.phone = "Enter a valid 10-digit mobile number";
      if (email.trim() && !EMAIL_RE.test(email.trim())) errs.email = "Enter a valid email address";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      if (employee) {
        const shared = {
          department: department.trim(),
          attendanceMode,
          biometricCode: biometricCode.trim(),
          shiftId: shiftId === DEFAULT_SHIFT ? "" : shiftId,
        };
        const payload: UpdateEmployeePayload = linked
          ? shared
          : {
              ...shared,
              name: name.trim(),
              designation: designation.trim(),
              type,
              email: email.trim(),
              phone: phone.trim(),
              joiningDate,
              isActive,
            };
        const res = await updateEmployee(employee.id, payload);
        toast.success(res?.linkedPunches ? `Employee updated. ${res.linkedPunches} stored punch(es) were linked.` : "Employee updated successfully");
      } else {
        const payload: CreateEmployeePayload = {
          name: name.trim(),
          type,
          attendanceMode,
          ...(designation.trim() && { designation: designation.trim() }),
          ...(department.trim() && { department: department.trim() }),
          ...(email.trim() && { email: email.trim() }),
          ...(phone.trim() && { phone: phone.trim() }),
          ...(joiningDate && { joiningDate }),
          ...(biometricCode.trim() && { biometricCode: biometricCode.trim() }),
          ...(shiftId !== DEFAULT_SHIFT && { shiftId }),
        };
        const res = await createEmployee(payload);
        toast.success(res?.linkedPunches ? `Employee added. ${res.linkedPunches} stored punch(es) were linked.` : "Employee added successfully");
      }
      onOpenChange(false);
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to save employee");
    } finally {
      setSaving(false);
    }
  }

  const activeShifts = shifts.filter((s) => s.isActive || s.id === employee?.shiftId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150 p-0 overflow-hidden">
        <DialogHeading icon={Users} title={employee ? "Edit Employee" : "Add Employee"} description={employee ? employee.employeeCode : "Register a new employee."} />

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          {linked && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
              This person is managed from the {employee?.linkedTo === "TEACHER" ? "Teachers" : "Staff"} page. Here you can change the department, attendance mode, biometric code and shift.
            </div>
          )}

          <FieldGroup>
            <Field>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={linked} className="h-11" placeholder="Full name" />
              <FieldError message={errors.name} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Designation</Label>
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} disabled={linked} className="h-11" placeholder="e.g. Accountant" />
              </Field>

              <Field>
                <Label>Department</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} list="hr-departments" className="h-11" placeholder="e.g. Administration" />
                <datalist id="hr-departments">
                  {departments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as EmployeeType)} disabled={linked}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label>Joining Date</Label>
                <DateField value={joiningDate} onChange={setJoiningDate} disabled={linked} clearable placeholder="Optional" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={linked} className="h-11" placeholder="Optional" />
                <FieldError message={errors.email} />
              </Field>

              <Field>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} disabled={linked} className="h-11" placeholder="Optional" />
                <FieldError message={errors.phone} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Attendance Mode</Label>
                <Select value={attendanceMode} onValueChange={(v) => setAttendanceMode(v as AttendanceMode)}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_MODE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label>Shift</Label>
                <Select value={shiftId} onValueChange={setShiftId}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_SHIFT}>Default shift</SelectItem>
                    {activeShifts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <Label>Biometric Code</Label>
              <div className="flex gap-2">
                <Input
                  value={biometricCode}
                  onChange={(e) => setBiometricCode(e.target.value)}
                  className="h-11"
                  placeholder={employee ? "Not set" : "Auto-assigned if left empty"}
                />
                <Button type="button" variant="outline" className="h-11 shrink-0" onClick={suggestCode}>
                  Suggest
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">The ID this person is enrolled under on the biometric device. It must be the same number on the device.</p>
              <FieldError message={errors.biometricCode} />
            </Field>

            {employee && !linked && <CheckField checked={isActive} onChange={setIsActive} label="Active" hint="Inactive employees are not marked and are left out of payroll." />}
          </FieldGroup>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {employee ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────── Create login dialog ─────────────────────────

function randomPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function LoginDialog({ employee, onClose, onDone }: { employee: Employee | null; onClose: () => void; onDone: (result: ResultInfo) => void }) {
  const { createEmployeeLogin } = useHrStore();
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [rolesFailed, setRolesFailed] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!employee) return;
    setUserName(
      employee.name
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .trim()
        .split(/\s+/)
        .join(".")
    );
    setPassword("");
    setRoleId("");
    setErrors({});

    apiClient
      .get("/roles")
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        const list = Array.isArray(raw) ? raw : (raw?.items ?? []);
        setRoles(list.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })));
        setRolesFailed(false);
      })
      .catch(() => setRolesFailed(true));
  }, [employee]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee) return;

    const errs: Record<string, string> = {};
    if (!userName.trim()) errs.userName = "Username is required";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!roleId) errs.roleId = "Select a role";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const res = await createEmployeeLogin(employee.id, { userName: userName.trim(), password, roleId });
      onClose();
      onDone({
        title: "Login created",
        lines: [
          `Employee: ${employee.name}`,
          `Username: ${res.credentials.userName}`,
          `User code: ${res.credentials.userCode}`,
          `Temporary password: ${password}`,
          "Share the password securely. They will be asked to change it at first login.",
        ],
      });
    } catch (error) {
      const fe = fieldErrors(error);
      if (Object.keys(fe).length) setErrors(fe);
      toastError(error, "Failed to create login");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={!!employee}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden">
        <DialogHeading icon={KeyRound} title="Create Login" description={employee?.name} />

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <FieldGroup>
            <Field>
              <Label>Username</Label>
              <Input value={userName} onChange={(e) => setUserName(e.target.value)} className="h-11" />
              <FieldError message={errors.userName} />
            </Field>

            <Field>
              <Label>Temporary Password</Label>
              <div className="flex gap-2">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" placeholder="At least 8 characters" />
                <Button type="button" variant="outline" className="h-11 shrink-0" onClick={() => setPassword(randomPassword())}>
                  Generate
                </Button>
              </div>
              <FieldError message={errors.password} />
            </Field>

            <Field>
              <Label>Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rolesFailed && <p className="mt-1 text-xs text-red-500">Could not load the roles list.</p>}
              <FieldError message={errors.roleId} />
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Login
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────── Import dialog ─────────────────────────

const TEMPLATE_HEADER = ["name", "designation", "department", "type", "email", "phone", "joiningDate", "biometricCode", "attendanceMode"];

function normalizeEnum<T extends string>(raw: string, allowed: readonly T[]): T | null {
  const v = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

function parseEmployees(text: string) {
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim()));
  const items: CreateEmployeePayload[] = [];
  const rowNumbers: number[] = [];
  const errors: string[] = [];

  if (!rows.length) return { items, rowNumbers, errors: ["No rows found"] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (key: string) => header.indexOf(key.toLowerCase());
  if (col("name") === -1) return { items, rowNumbers, errors: ['The first row must be a header row that includes "name"'] };

  const get = (r: string[], key: string) => (col(key) === -1 ? "" : (r[col(key)] ?? "").trim());

  rows.slice(1).forEach((r, i) => {
    const rowNo = i + 2;
    const name = get(r, "name");
    if (!name) return errors.push(`Row ${rowNo}: name is missing`);

    const item: CreateEmployeePayload = { name };
    const designation = get(r, "designation");
    const department = get(r, "department");
    const email = get(r, "email");
    const phone = get(r, "phone");
    const joiningDate = get(r, "joiningDate");
    const biometricCode = get(r, "biometricCode");
    const typeRaw = get(r, "type");
    const modeRaw = get(r, "attendanceMode");

    if (designation) item.designation = designation;
    if (department) item.department = department;
    if (email) item.email = email;
    if (phone) item.phone = phone;
    if (biometricCode) item.biometricCode = biometricCode;

    if (joiningDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(joiningDate)) return errors.push(`Row ${rowNo}: joiningDate must be YYYY-MM-DD`);
      item.joiningDate = joiningDate;
    }
    if (typeRaw) {
      const t = normalizeEnum<EmployeeType>(typeRaw, ["TEACHING", "NON_TEACHING", "OTHER"]);
      if (!t) return errors.push(`Row ${rowNo}: type must be Teaching, Non-teaching or Other`);
      item.type = t;
    }
    if (modeRaw) {
      const m = normalizeEnum<AttendanceMode>(modeRaw, ["BIOMETRIC", "MANUAL", "NOT_TRACKED"]);
      if (!m) return errors.push(`Row ${rowNo}: attendanceMode must be Biometric, Manual or Not tracked`);
      item.attendanceMode = m;
    }

    items.push(item);
    rowNumbers.push(rowNo);
  });

  if (items.length > 500) errors.push("Import up to 500 employees at a time");
  return { items, rowNumbers, errors };
}

function ImportDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (result: ResultInfo) => void }) {
  const { importEmployees } = useHrStore();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  async function handleFile(file?: File) {
    if (!file) return;
    setText(await readFileText(file));
  }

  async function handleImport() {
    const { items, rowNumbers, errors } = parseEmployees(text);
    if (!items.length) {
      toast.error(errors[0] ?? "Nothing to import");
      return;
    }
    if (items.length > 500) {
      toast.error(errors[errors.length - 1]);
      return;
    }

    setSaving(true);
    try {
      const res = await importEmployees(items);
      onClose();
      onDone({
        title: "Import finished",
        lines: [`Added ${res.created} of ${res.received} employee(s).`],
        problems: [...errors, ...res.failed.map((f) => `Row ${rowNumbers[f.row - 1] ?? f.row}: ${f.error}`)],
        problemsTitle: "Not imported",
      });
    } catch (error) {
      toastError(error, "Import failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-150 p-0 overflow-hidden">
        <DialogHeading icon={Upload} title="Import Employees" description="Upload a CSV file or paste rows. The first row is the header." />

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted">
              <Upload className="size-4" />
              Choose CSV file
              <input type="file" accept=".csv,text/csv,.txt" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
            <Button type="button" variant="outline" className="h-9" onClick={() => downloadCsv("employees-template.csv", [TEMPLATE_HEADER, ["Asha Verma", "Accountant", "Accounts", "Non-teaching", "asha@example.com", "9876543210", "2026-04-01", "1050", "Biometric"]])}>
              Download template
            </Button>
          </div>

          <textarea
            className={TEXTAREA_CLASS}
            rows={9}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={TEMPLATE_HEADER.join(",")}
          />
          <p className="text-xs text-muted-foreground">Only the name column is required. Leave the biometric code empty to auto-assign the next free number. Up to 500 rows.</p>
        </div>

        <DialogFooter className="gap-2 border-t px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={saving || !text.trim()}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────── Tab ─────────────────────────

export default function EmployeesTab() {
  const { employees, shifts, departments, loading, fetchEmployees, fetchShifts, fetchDepartments, updateEmployee, deleteEmployee, syncEmployees } = useHrStore();

  const canCreate = useHasPermission("employee.create");
  const canUpdate = useHasPermission("employee.update");
  const canDelete = useHasPermission("employee.delete");
  const canCreateLogin = useHasPermission("user.create");

  const [search, setSearch] = useState("");
  const [type, setType] = useState(ALL);
  const [department, setDepartment] = useState(ALL);
  const [mode, setMode] = useState(ALL);
  const [status, setStatus] = useState("active");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [loginFor, setLoginFor] = useState<Employee | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmSync, setConfirmSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Employee | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultInfo | null>(null);

  useEffect(() => {
    fetchShifts().catch(() => {});
    fetchDepartments().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEmployees({
        q: search.trim() || undefined,
        type: type === ALL ? undefined : type,
        department: department === ALL ? undefined : department,
        attendanceMode: mode === ALL ? undefined : mode,
        isActive: status === "active" ? "true" : status === "inactive" ? "false" : undefined,
      }).catch((e) => toastError(e, "Failed to load employees"));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type, department, mode, status]);

  async function handleToggle() {
    if (!toggleTarget) return;
    setBusy(true);
    try {
      if (toggleTarget.isActive) await deleteEmployee(toggleTarget.id);
      else await updateEmployee(toggleTarget.id, { isActive: true });
      toast.success(toggleTarget.isActive ? "Employee deactivated" : "Employee activated");
      setToggleTarget(null);
    } catch (error) {
      toastError(error, "Could not update the employee");
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const r = await syncEmployees();
      setConfirmSync(false);
      setResult({
        title: "Sync complete",
        lines: [`Teachers: ${r.teachers.created} added, ${r.teachers.updated} refreshed`, `Staff: ${r.staff.created} added, ${r.staff.updated} refreshed`],
        problems: r.skipped.map((s) => `${s.name} (${s.source.toLowerCase()}): ${s.reason}`),
        problemsTitle: "Skipped",
      });
    } catch (error) {
      toastError(error, "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, employee code or biometric code" className="h-10 pl-9" />
        </div>

        {canCreate && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setConfirmSync(true)}>
              <RefreshCw className="size-4" />
              Sync Teachers & Staff
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" />
              Import
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add Employee
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-10 w-full">
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

        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="h-10 w-full">
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

        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All attendance modes</SelectItem>
            {ATTENDANCE_MODE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value={ALL}>All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && employees.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState icon={Users} title="No employees found" hint={canCreate ? "Use Sync to bring in your teachers and staff, or add an employee." : "Try changing the filters."} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{employees.length} employee(s)</p>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => {
                  const canToggle = !e.linkedTo && ((e.isActive && canDelete) || (!e.isActive && canUpdate));
                  const canLogin = canUpdate && canCreateLogin && !e.userId && e.isActive;
                  const hasActions = canUpdate || canLogin || canToggle;

                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.employeeCode}
                          {e.linkedTo ? ` • ${e.linkedTo === "TEACHER" ? "Teacher" : "Staff"} record` : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>{e.designation || "—"}</p>
                        <p className="text-xs text-muted-foreground">{e.department || "No department"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TYPE_BADGE[e.type]}>
                          {labelOf(EMPLOYEE_TYPE_OPTIONS, e.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{labelOf(ATTENDANCE_MODE_OPTIONS, e.attendanceMode)}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.biometricCode ? `Code ${e.biometricCode}` : "No code"} • {e.shift?.name ?? "Default shift"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{e.user?.userName ?? <span className="text-muted-foreground">No login</span>}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={e.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                          {e.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasActions && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdate && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditing(e);
                                    setFormOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canLogin && (
                                <DropdownMenuItem onClick={() => setLoginFor(e)}>
                                  <KeyRound className="mr-2 size-4" />
                                  Create login
                                </DropdownMenuItem>
                              )}
                              {canToggle && (
                                <DropdownMenuItem onClick={() => setToggleTarget(e)} className={e.isActive ? "text-red-600" : ""}>
                                  {e.isActive ? <UserX className="mr-2 size-4" /> : <UserCheck className="mr-2 size-4" />}
                                  {e.isActive ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <EmployeeDialog open={formOpen} onOpenChange={setFormOpen} employee={editing} shifts={shifts} departments={departments} />
      <LoginDialog employee={loginFor} onClose={() => setLoginFor(null)} onDone={setResult} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onDone={setResult} />
      <ResultDialog result={result} onClose={() => setResult(null)} />

      <ConfirmDialog
        open={confirmSync}
        onOpenChange={setConfirmSync}
        title="Sync teachers and staff?"
        description="This creates an employee record for every teacher and staff member who does not have one, and refreshes the details of the ones that do. It is safe to run more than once."
        confirmLabel="Run sync"
        loading={syncing}
        onConfirm={handleSync}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(o) => {
          if (!o) setToggleTarget(null);
        }}
        title={toggleTarget?.isActive ? "Deactivate employee?" : "Activate employee?"}
        description={
          toggleTarget?.isActive
            ? `${toggleTarget?.name} will no longer be marked for attendance or included in payroll, and their login (if any) is suspended. History is kept.`
            : `${toggleTarget?.name} will be marked for attendance and included in payroll again.`
        }
        confirmLabel={toggleTarget?.isActive ? "Deactivate" : "Activate"}
        destructive={toggleTarget?.isActive}
        loading={busy}
        onConfirm={handleToggle}
      />
    </div>
  );
}