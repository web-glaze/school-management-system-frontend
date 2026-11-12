import apiClient from "./api";

type Params = Record<string, string | number | boolean | undefined>;

// ───────── Shared types ─────────

export type EmployeeType = "TEACHING" | "NON_TEACHING" | "OTHER";
export type AttendanceMode = "BIOMETRIC" | "MANUAL" | "NOT_TRACKED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE" | "HOLIDAY" | "WEEKLY_OFF";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type LeaveFrequency = "YEARLY" | "MONTHLY" | "ONE_TIME";
export type PayDayBasis = "CALENDAR_DAYS" | "WORKING_DAYS" | "FIXED_30";
export type DeviceStatus = "ACTIVE" | "REVOKED";

export interface SalaryComponent {
  name: string;
  type: "FIXED" | "PERCENT";
  value: number;
}

// ───────── Payloads ─────────

export interface CreateEmployeePayload {
  name: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  type?: EmployeeType;
  email?: string;
  phone?: string;
  joiningDate?: string;
  biometricCode?: string;
  attendanceMode?: AttendanceMode;
  shiftId?: string;
}

// null or "" clears a field
export interface UpdateEmployeePayload {
  name?: string;
  designation?: string | null;
  department?: string | null;
  type?: EmployeeType;
  email?: string | null;
  phone?: string | null;
  joiningDate?: string | null;
  biometricCode?: string | null;
  attendanceMode?: AttendanceMode;
  shiftId?: string | null;
  isActive?: boolean;
}

export interface CreateEmployeeLoginPayload {
  userName: string;
  password: string;
  roleId: string;
}

export interface CreateAttendancePayload {
  employeeId: string;
  sessionId?: string;
  attendanceDate: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

export interface UpdateAttendancePayload {
  attendanceDate: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

export interface CreatePunchPayload {
  employeeId?: string;
  biometricCode?: string;
  punchTime: string;
  deviceId?: string;
}

export interface ImportPunchItem {
  biometricCode: string;
  punchTime: string;
}

export interface UpsertShiftPayload {
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes?: number;
  halfDayAfterMinutes?: number;
  fullDayMinMinutes?: number;
  halfDayMinMinutes?: number;
  weeklyOffs?: DayOfWeek[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateHrSettingPayload {
  absentMarkTime?: string;
  cycleStartDay?: number;
  dayBasis?: PayDayBasis;
  lateCountForHalfDay?: number | null;
}

export interface CreateDevicePayload {
  name: string;
  location?: string;
  serialNumber: string;
}

export interface UpdateDevicePayload {
  name: string;
  location?: string;
  status?: DeviceStatus;
}

export interface UpsertLeaveTypePayload {
  name: string;
  code: string;
  description?: string;
  color?: string;
  isPaid?: boolean;
  isActive?: boolean;
}

export interface UpsertLeavePolicyPayload {
  leaveTypeId: string;
  employeeId?: string | null;
  allotmentDays: number;
  frequency: LeaveFrequency;
  validFrom: string;
  validTo: string;
  carryForward?: boolean;
  maxCarryForwardDays?: number | null;
  isActive?: boolean;
}

export interface CreateLeavePayload {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate?: string;
  isHalfDay?: boolean;
  isPaid?: boolean;
  reason?: string;
}

export interface UpdateLeavePayload {
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  isHalfDay?: boolean;
  isPaid?: boolean;
  reason?: string;
}

export interface CreateSalaryStructurePayload {
  employeeId: string;
  monthlySalary: number;
  allowances?: SalaryComponent[];
  deductions?: SalaryComponent[];
  effectiveFrom: string;
}

export interface UpdateSalaryStructurePayload {
  monthlySalary?: number;
  allowances?: SalaryComponent[];
  deductions?: SalaryComponent[];
  effectiveFrom?: string;
}

export interface GeneratePayrollPayload {
  periodKey: string;
  employeeIds?: string[];
}

export interface FinalizePayrollPayload {
  periodKey: string;
  employeeIds?: string[];
  allowUnmarked?: boolean;
}

// ───────── Service ─────────

export const hrService = {
  employees: {
    getAll: (params?: Params) => apiClient.get("/hr/employees", { params }),
    lookup: (includeInactive = false) => apiClient.get("/hr/employees/lookup", { params: includeInactive ? { includeInactive: true } : undefined }),
    departments: () => apiClient.get("/hr/employees/departments"),
    nextBiometricCode: () => apiClient.get("/hr/employees/next-biometric-code"),
    me: () => apiClient.get("/hr/employees/me"),
    getById: (id: string) => apiClient.get(`/hr/employees/${id}`),
    create: (data: CreateEmployeePayload) => apiClient.post("/hr/employees", data),
    update: (id: string, data: UpdateEmployeePayload) => apiClient.patch(`/hr/employees/${id}`, data),
    remove: (id: string) => apiClient.delete(`/hr/employees/${id}`),
    createLogin: (id: string, data: CreateEmployeeLoginPayload) => apiClient.post(`/hr/employees/${id}/login`, data),
    importMany: (employees: CreateEmployeePayload[]) => apiClient.post("/hr/employees/import", { employees }),
    sync: () => apiClient.post("/hr/employees/sync"),
  },

  attendance: {
    getAll: (params?: Params) => apiClient.get("/hr/attendance", { params }),
    my: (params?: Params) => apiClient.get("/hr/attendance/my", { params }),
    getById: (id: string) => apiClient.get(`/hr/attendance/${id}`),
    create: (data: CreateAttendancePayload) => apiClient.post("/hr/attendance", data),
    update: (id: string, data: UpdateAttendancePayload) => apiClient.patch(`/hr/attendance/${id}`, data),
    remove: (id: string) => apiClient.delete(`/hr/attendance/${id}`),
  },

  punches: {
    getByDate: (date: string, employeeId?: string) => apiClient.get("/hr/punches", { params: { date, employeeId } }),
    create: (data: CreatePunchPayload) => apiClient.post("/hr/punches", data),
    importMany: (punches: ImportPunchItem[]) => apiClient.post("/hr/punches/import", { punches }),
    unmatched: () => apiClient.get("/hr/punches/unmatched"),
    assignUnmatched: (biometricCode: string, employeeId: string) => apiClient.post("/hr/punches/unmatched/assign", { biometricCode, employeeId }),
    remove: (id: string) => apiClient.delete(`/hr/punches/${id}`),
  },

  shifts: {
    getAll: () => apiClient.get("/hr/shifts"),
    getById: (id: string) => apiClient.get(`/hr/shifts/${id}`),
    create: (data: UpsertShiftPayload) => apiClient.post("/hr/shifts", data),
    update: (id: string, data: UpsertShiftPayload) => apiClient.patch(`/hr/shifts/${id}`, data),
    remove: (id: string) => apiClient.delete(`/hr/shifts/${id}`),
  },

  settings: {
    get: () => apiClient.get("/hr/settings"),
    update: (data: UpdateHrSettingPayload) => apiClient.patch("/hr/settings", data),
  },

  devices: {
    getAll: () => apiClient.get("/hr/devices"),
    create: (data: CreateDevicePayload) => apiClient.post("/hr/devices", data),
    update: (id: string, data: UpdateDevicePayload) => apiClient.patch(`/hr/devices/${id}`, data),
    regenerateKey: (id: string) => apiClient.post(`/hr/devices/${id}/regenerate-key`),
    remove: (id: string) => apiClient.delete(`/hr/devices/${id}`),
  },

  leaveConfig: {
    getTypes: () => apiClient.get("/hr/leave-config/types"),
    createType: (data: UpsertLeaveTypePayload) => apiClient.post("/hr/leave-config/types", data),
    updateType: (id: string, data: UpsertLeaveTypePayload) => apiClient.patch(`/hr/leave-config/types/${id}`, data),
    removeType: (id: string) => apiClient.delete(`/hr/leave-config/types/${id}`),
    getPolicies: (leaveTypeId?: string) => apiClient.get("/hr/leave-config/policies", { params: { leaveTypeId } }),
    createPolicy: (data: UpsertLeavePolicyPayload) => apiClient.post("/hr/leave-config/policies", data),
    updatePolicy: (id: string, data: UpsertLeavePolicyPayload) => apiClient.patch(`/hr/leave-config/policies/${id}`, data),
    removePolicy: (id: string) => apiClient.delete(`/hr/leave-config/policies/${id}`),
  },

  leaves: {
    getAll: (params?: Params) => apiClient.get("/hr/leaves", { params }),
    my: (params?: Params) => apiClient.get("/hr/leaves/my", { params }),
    myBalances: (asOf?: string) => apiClient.get("/hr/leaves/my/balances", { params: { asOf } }),
    balances: (employeeId: string, asOf?: string) => apiClient.get(`/hr/leaves/balances/${employeeId}`, { params: { asOf } }),
    getById: (id: string) => apiClient.get(`/hr/leaves/${id}`),
    create: (data: CreateLeavePayload) => apiClient.post("/hr/leaves", data),
    update: (id: string, data: UpdateLeavePayload) => apiClient.patch(`/hr/leaves/${id}`, data),
    cancel: (id: string) => apiClient.delete(`/hr/leaves/${id}`),
  },

  reports: {
    daily: (date?: string) => apiClient.get("/hr/reports/daily", { params: { date } }),
    summary: (params?: Params) => apiClient.get("/hr/reports/attendance-summary", { params }),
    employee: (employeeId: string, from?: string, to?: string) => apiClient.get(`/hr/reports/employee/${employeeId}`, { params: { from, to } }),
    my: (from?: string, to?: string) => apiClient.get("/hr/reports/my", { params: { from, to } }),
  },

  payroll: {
    getStructures: () => apiClient.get("/hr/payroll/salary-structures"),
    getMissingStructures: () => apiClient.get("/hr/payroll/salary-structures/missing"),
    getStructure: (employeeId: string) => apiClient.get(`/hr/payroll/salary-structures/${employeeId}`),
    createStructure: (data: CreateSalaryStructurePayload) => apiClient.post("/hr/payroll/salary-structures", data),
    updateStructure: (employeeId: string, data: UpdateSalaryStructurePayload) => apiClient.patch(`/hr/payroll/salary-structures/${employeeId}`, data),
    removeStructure: (employeeId: string) => apiClient.delete(`/hr/payroll/salary-structures/${employeeId}`),

    getPayslips: (params?: Params) => apiClient.get("/hr/payroll/payslips", { params }),
    getPayslip: (id: string) => apiClient.get(`/hr/payroll/payslips/${id}`),
    myPayslips: () => apiClient.get("/hr/payroll/my/payslips"),
    generate: (data: GeneratePayrollPayload) => apiClient.post("/hr/payroll/generate", data),
    finalize: (data: FinalizePayrollPayload) => apiClient.post("/hr/payroll/finalize", data),
    recalculate: (id: string) => apiClient.post(`/hr/payroll/payslips/${id}/recalculate`),
    finalizePayslip: (id: string, allowUnmarked = false) => apiClient.post(`/hr/payroll/payslips/${id}/finalize`, { allowUnmarked }),
    reopen: (id: string) => apiClient.post(`/hr/payroll/payslips/${id}/reopen`),
    removePayslip: (id: string) => apiClient.delete(`/hr/payroll/payslips/${id}`),
  },
};