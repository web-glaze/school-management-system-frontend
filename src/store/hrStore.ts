import { create } from "zustand";
import {
  hrService,
  AttendanceMode,
  AttendanceStatus,
  CreateAttendancePayload,
  CreateDevicePayload,
  CreateEmployeeLoginPayload,
  CreateEmployeePayload,
  CreateLeavePayload,
  CreatePunchPayload,
  CreateSalaryStructurePayload,
  DayOfWeek,
  DeviceStatus,
  EmployeeType,
  FinalizePayrollPayload,
  GeneratePayrollPayload,
  ImportPunchItem,
  LeaveFrequency,
  PayDayBasis,
  SalaryComponent,
  UpdateAttendancePayload,
  UpdateDevicePayload,
  UpdateEmployeePayload,
  UpdateHrSettingPayload,
  UpdateLeavePayload,
  UpdateSalaryStructurePayload,
  UpsertLeavePolicyPayload,
  UpsertLeaveTypePayload,
  UpsertShiftPayload,
} from "@/services/hr.service";

// Prisma sends decimal columns as strings, so always wrap them with Number().
export type Dec = string | number;

// ───────── Entities ─────────

export interface EmployeeRef {
  id: string;
  name: string;
  employeeCode: string;
  designation?: string | null;
  department?: string | null;
  type?: EmployeeType;
  attendanceMode?: AttendanceMode;
  isActive?: boolean;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  department: string | null;
  type: EmployeeType;
  joiningDate: string | null;
  isActive: boolean;
  biometricCode: string | null;
  attendanceMode: AttendanceMode;
  shiftId: string | null;
  teacherId: string | null;
  staffId: string | null;
  userId: string | null;
  linkedTo: "TEACHER" | "STAFF" | null;
  shift?: { id: string; name: string } | null;
  user?: { id: string; userName: string | null; status: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeLookup {
  id: string;
  employeeCode: string;
  name: string;
  designation: string | null;
  department: string | null;
  type: EmployeeType;
  attendanceMode: AttendanceMode;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  lateMinutes: number | null;
  workedMinutes: number | null;
  source: "AUTO" | "MANUAL";
  leaveId: string | null;
  remarks: string | null;
  employee: EmployeeRef;
  session: { id: string; name: string };
}

export interface Punch {
  id: string;
  biometricCode: string;
  punchTime: string;
  deviceId: string | null;
  source: "DEVICE" | "MANUAL" | "IMPORT";
  employeeId: string | null;
  employee: { id: string; name: string; employeeCode: string } | null;
}

export interface UnmatchedPunchGroup {
  biometricCode: string;
  punchCount: number;
  firstPunch: string;
  lastPunch: string;
}

export interface PunchResult {
  result: "RECORDED" | "UNMATCHED" | "DUPLICATE";
  punchId?: string;
  attendance?: AttendanceRecord | null;
}

export interface PunchImportSummary {
  received: number;
  recorded: number;
  duplicates: number;
  unmatched: number;
  failed: { row: number; error: string }[];
}

export interface AttendanceShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  halfDayAfterMinutes: number;
  fullDayMinMinutes: number;
  halfDayMinMinutes: number;
  weeklyOffs: DayOfWeek[];
  isDefault: boolean;
  isActive: boolean;
  _count?: { employees: number };
}

export interface HrSetting {
  absentMarkTime: string;
  cycleStartDay: number;
  dayBasis: PayDayBasis;
  lateCountForHalfDay: number | null;
}

export interface AttendanceDevice {
  id: string;
  name: string;
  location: string | null;
  serialNumber: string;
  status: DeviceStatus;
  lastSeenAt: string | null;
  createdAt: string;
}

// The key is only returned when a device is created or its key is regenerated.
export type AttendanceDeviceWithKey = AttendanceDevice & { key: string };

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  isPaid: boolean;
  isActive: boolean;
  _count?: { policies: number; leaves: number };
}

export interface LeavePolicy {
  id: string;
  leaveTypeId: string;
  employeeId: string | null;
  allotmentDays: Dec;
  frequency: LeaveFrequency;
  validFrom: string;
  validTo: string;
  carryForward: boolean;
  maxCarryForwardDays: Dec | null;
  isActive: boolean;
  leaveType?: { id: string; name: string; code: string };
  employee?: EmployeeRef | null;
}

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: Dec;
  isPaid: boolean;
  reason: string | null;
  status: "ACTIVE" | "CANCELLED";
  createdAt: string;
  leaveType: { id: string; name: string; code: string; color: string | null; isPaid: boolean };
  employee: EmployeeRef;
}

// balance is null when no policy covers the date (nothing to measure against)
export interface LeaveBalance {
  leaveTypeId: string;
  name: string;
  code: string;
  color: string | null;
  isPaid: boolean;
  policyId: string | null;
  frequency: LeaveFrequency | null;
  periodStart: string | null;
  periodEnd: string | null;
  allotted: number;
  carriedForward: number;
  used: number;
  balance: number | null;
}

// ───────── Reports ─────────

export interface DayLeaveRef {
  id: string;
  typeName: string;
  code: string;
  isPaid: boolean;
  halfDay: boolean;
}

export interface DayInfo {
  date: string;
  kind: "WORKING" | "WEEKLY_OFF" | "HOLIDAY" | "NOT_JOINED";
  // PRESENT, LATE, HALF_DAY, ABSENT, LEAVE, HALF_DAY_LEAVE, UNMARKED, PENDING,
  // NOT_TRACKED, WEEKLY_OFF, HOLIDAY, NOT_JOINED
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  lateMinutes: number | null;
  workedMinutes: number | null;
  source: "AUTO" | "MANUAL" | null;
  remarks: string | null;
  leave: DayLeaveRef | null;
}

export interface PeriodSummary {
  workingDays: number;
  offDays: number;
  presentDays: number;
  halfDays: number;
  lateCount: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  unmarkedDays: number;
  pendingDays: number;
  notJoinedDays: number;
  notJoinedWorkingDays: number;
  lateMinutes: number;
  workedMinutes: number;
  leaveByType: { leaveTypeId: string; name: string; code: string; days: number }[];
}

export interface DailyReport {
  date: string;
  total: number;
  counts: Record<string, number>;
  rows: {
    employee: EmployeeRef;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    lateMinutes: number | null;
    leave: DayLeaveRef | null;
  }[];
}

export interface SummaryReport {
  from: string;
  to: string;
  employeeCount: number;
  rows: (PeriodSummary & { employee: EmployeeRef })[];
  totals: Record<string, number>;
}

export interface EmployeeReport {
  from: string;
  to: string;
  employee: EmployeeRef;
  summary: PeriodSummary;
  days: DayInfo[];
  leaves: EmployeeLeave[];
  balances: LeaveBalance[];
}

// ───────── Payroll ─────────

export interface SalaryStructure {
  id: string;
  employeeId: string;
  monthlySalary: Dec;
  allowances: SalaryComponent[] | null;
  deductions: SalaryComponent[] | null;
  effectiveFrom: string;
  employee: EmployeeRef;
}

export interface PricedComponent extends SalaryComponent {
  amount: number;
}

export interface PayslipBreakdown {
  basis: PayDayBasis;
  divisor: number;
  periodWorkingDays: number;
  offDays: number;
  lostDays: {
    absent: number;
    unpaidLeave: number;
    halfDays: number;
    lates: number;
    beforeJoining: number;
    total: number;
  };
  halfDayCount: number;
  lateCount: number;
  lateMinutes: number;
  workedMinutes: number;
  leaveByType: { leaveTypeId: string; name: string; code: string; days: number }[];
  unmarkedDays: number;
  pendingDays: number;
  allowances: PricedComponent[];
  deductions: PricedComponent[];
  grossSalary: number;
  attendanceDeduction: number;
  netSalary: number;
  warnings: string[];
}

export interface Payslip {
  id: string;
  employeeId: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  monthlySalary: Dec;
  workingDays: Dec;
  presentDays: Dec;
  paidLeaveDays: Dec;
  unpaidLeaveDays: Dec;
  absentDays: Dec;
  lateCount: number;
  perDayRate: Dec;
  deductionAmount: Dec;
  allowanceAmount: Dec;
  otherDeductionAmount: Dec;
  netSalary: Dec;
  breakdown: PayslipBreakdown | null;
  status: "DRAFT" | "FINALIZED";
  finalizedAt: string | null;
  // not included on the employee's own list
  employee?: EmployeeRef;
}

export interface GenerateResult {
  periodKey: string;
  from: string;
  to: string;
  generated: number;
  skipped: { employeeId: string; name: string; reason: string }[];
}

export interface FinalizeResult {
  periodKey: string;
  finalized: number;
  failed: { employeeId: string; name: string; error: string }[];
}

export interface EmployeeSyncResult {
  teachers: { created: number; updated: number };
  staff: { created: number; updated: number };
  skipped: { source: string; name: string; reason: string }[];
}

type Query = Record<string, string | undefined>;

// ───────── Store ─────────

interface HrStore {
  loading: boolean;

  employees: Employee[];
  employeeLookup: EmployeeLookup[];
  departments: string[];
  myProfile: Employee | null;

  attendances: AttendanceRecord[];
  punches: Punch[];
  unmatchedPunches: UnmatchedPunchGroup[];

  shifts: AttendanceShift[];
  settings: HrSetting | null;
  devices: AttendanceDevice[];

  leaveTypes: LeaveType[];
  leavePolicies: LeavePolicy[];
  leaves: EmployeeLeave[];
  myLeaves: EmployeeLeave[];
  myBalances: LeaveBalance[];

  dailyReport: DailyReport | null;
  summaryReport: SummaryReport | null;
  employeeReport: EmployeeReport | null;
  myReport: EmployeeReport | null;

  salaryStructures: SalaryStructure[];
  missingSalaries: EmployeeRef[];
  payslips: Payslip[];
  myPayslips: Payslip[];

  // employees
  fetchEmployees: (params?: Query) => Promise<void>;
  fetchEmployeeLookup: (includeInactive?: boolean) => Promise<void>;
  fetchDepartments: () => Promise<void>;
  fetchMyProfile: () => Promise<void>;
  getNextBiometricCode: () => Promise<string>;
  createEmployee: (data: CreateEmployeePayload) => Promise<Employee & { linkedPunches: number }>;
  updateEmployee: (id: string, data: UpdateEmployeePayload) => Promise<Employee & { linkedPunches: number }>;
  deleteEmployee: (id: string) => Promise<void>;
  createEmployeeLogin: (id: string, data: CreateEmployeeLoginPayload) => Promise<{ credentials: { userCode: string; userName: string } }>;
  importEmployees: (items: CreateEmployeePayload[]) => Promise<{ received: number; created: number; failed: { row: number; error: string }[] }>;
  syncEmployees: () => Promise<EmployeeSyncResult>;

  // attendance + punches
  fetchAttendances: (params?: Query) => Promise<void>;
  createAttendance: (data: CreateAttendancePayload) => Promise<void>;
  updateAttendance: (id: string, data: UpdateAttendancePayload) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;
  fetchPunches: (date: string, employeeId?: string) => Promise<void>;
  createPunch: (data: CreatePunchPayload) => Promise<PunchResult>;
  importPunches: (items: ImportPunchItem[]) => Promise<PunchImportSummary>;
  deletePunch: (id: string) => Promise<void>;
  fetchUnmatchedPunches: () => Promise<void>;
  assignUnmatchedPunches: (biometricCode: string, employeeId: string) => Promise<{ linked: number; daysRefreshed: number }>;

  // shifts, settings, devices
  fetchShifts: () => Promise<void>;
  createShift: (data: UpsertShiftPayload) => Promise<void>;
  updateShift: (id: string, data: UpsertShiftPayload) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: UpdateHrSettingPayload) => Promise<void>;
  fetchDevices: () => Promise<void>;
  createDevice: (data: CreateDevicePayload) => Promise<AttendanceDeviceWithKey>;
  updateDevice: (id: string, data: UpdateDevicePayload) => Promise<void>;
  regenerateDeviceKey: (id: string) => Promise<AttendanceDeviceWithKey>;
  deleteDevice: (id: string) => Promise<void>;

  // leave
  fetchLeaveTypes: () => Promise<void>;
  createLeaveType: (data: UpsertLeaveTypePayload) => Promise<void>;
  updateLeaveType: (id: string, data: UpsertLeaveTypePayload) => Promise<void>;
  deleteLeaveType: (id: string) => Promise<void>;
  fetchLeavePolicies: (leaveTypeId?: string) => Promise<void>;
  createLeavePolicy: (data: UpsertLeavePolicyPayload) => Promise<void>;
  updateLeavePolicy: (id: string, data: UpsertLeavePolicyPayload) => Promise<void>;
  deleteLeavePolicy: (id: string) => Promise<void>;
  fetchLeaves: (params?: Query) => Promise<void>;
  createLeave: (data: CreateLeavePayload) => Promise<void>;
  updateLeave: (id: string, data: UpdateLeavePayload) => Promise<void>;
  cancelLeave: (id: string) => Promise<void>;
  getLeaveBalances: (employeeId: string, asOf?: string) => Promise<LeaveBalance[]>;
  fetchMyLeaves: (params?: Query) => Promise<void>;
  fetchMyBalances: (asOf?: string) => Promise<void>;

  // reports
  fetchDailyReport: (date?: string) => Promise<void>;
  fetchSummaryReport: (params?: Query) => Promise<void>;
  fetchEmployeeReport: (employeeId: string, from?: string, to?: string) => Promise<void>;
  fetchMyReport: (from?: string, to?: string) => Promise<void>;

  // payroll
  fetchSalaryStructures: () => Promise<void>;
  fetchMissingSalaries: () => Promise<void>;
  createSalaryStructure: (data: CreateSalaryStructurePayload) => Promise<void>;
  updateSalaryStructure: (employeeId: string, data: UpdateSalaryStructurePayload) => Promise<void>;
  deleteSalaryStructure: (employeeId: string) => Promise<void>;
  fetchPayslips: (params?: Query) => Promise<void>;
  generatePayroll: (data: GeneratePayrollPayload) => Promise<GenerateResult>;
  finalizePayroll: (data: FinalizePayrollPayload) => Promise<FinalizeResult>;
  recalculatePayslip: (id: string) => Promise<void>;
  finalizePayslip: (id: string, allowUnmarked?: boolean) => Promise<void>;
  reopenPayslip: (id: string) => Promise<void>;
  deletePayslip: (id: string) => Promise<void>;
  fetchMyPayslips: () => Promise<void>;

  clearAll: () => void;
}

const initialState = {
  loading: false,
  employees: [] as Employee[],
  employeeLookup: [] as EmployeeLookup[],
  departments: [] as string[],
  myProfile: null as Employee | null,
  attendances: [] as AttendanceRecord[],
  punches: [] as Punch[],
  unmatchedPunches: [] as UnmatchedPunchGroup[],
  shifts: [] as AttendanceShift[],
  settings: null as HrSetting | null,
  devices: [] as AttendanceDevice[],
  leaveTypes: [] as LeaveType[],
  leavePolicies: [] as LeavePolicy[],
  leaves: [] as EmployeeLeave[],
  myLeaves: [] as EmployeeLeave[],
  myBalances: [] as LeaveBalance[],
  dailyReport: null as DailyReport | null,
  summaryReport: null as SummaryReport | null,
  employeeReport: null as EmployeeReport | null,
  myReport: null as EmployeeReport | null,
  salaryStructures: [] as SalaryStructure[],
  missingSalaries: [] as EmployeeRef[],
  payslips: [] as Payslip[],
  myPayslips: [] as Payslip[],
};

// Remembered so that a save can refresh the list with the same filters.
let pending = 0;
let lastEmployeeQuery: Query | undefined;
let lastAttendanceQuery: Query | undefined;
let lastPunchQuery: { date: string; employeeId?: string } | undefined;
let lastLeaveQuery: Query | undefined;
let lastPolicyType: string | undefined;
let lastPayslipQuery: Query | undefined;

export const useHrStore = create<HrStore>((set, get) => {
  // One counter for every request, so parallel fetches do not flicker the loader.
  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    pending++;
    set({ loading: true });
    try {
      return await fn();
    } finally {
      pending--;
      set({ loading: pending > 0 });
    }
  };

  const data = <T>(res: any, fallback: T): T => res?.data?.data ?? fallback;

  return {
    ...initialState,

    // ======================
    // Employees
    // ======================

    fetchEmployees: async (params) => {
      if (params !== undefined) lastEmployeeQuery = params;
      await run(async () => {
        const res = await hrService.employees.getAll(lastEmployeeQuery);
        set({ employees: data(res, []) });
      });
    },

    fetchEmployeeLookup: async (includeInactive = false) => {
      await run(async () => {
        const res = await hrService.employees.lookup(includeInactive);
        set({ employeeLookup: data(res, []) });
      });
    },

    fetchDepartments: async () => {
      await run(async () => {
        const res = await hrService.employees.departments();
        set({ departments: data(res, []) });
      });
    },

    fetchMyProfile: async () => {
      await run(async () => {
        const res = await hrService.employees.me();
        set({ myProfile: data(res, null) });
      });
    },

    getNextBiometricCode: async () => {
      const res = await hrService.employees.nextBiometricCode();
      return data<{ code: string }>(res, { code: "" }).code;
    },

    createEmployee: async (payload) => {
      const res = await hrService.employees.create(payload);
      await get().fetchEmployees();
      return data(res, null as any);
    },

    updateEmployee: async (id, payload) => {
      const res = await hrService.employees.update(id, payload);
      await get().fetchEmployees();
      return data(res, null as any);
    },

    deleteEmployee: async (id) => {
      await hrService.employees.remove(id);
      await get().fetchEmployees();
    },

    createEmployeeLogin: async (id, payload) => {
      const res = await hrService.employees.createLogin(id, payload);
      await get().fetchEmployees();
      return data(res, null as any);
    },

    importEmployees: async (items) => {
      const res = await hrService.employees.importMany(items);
      await get().fetchEmployees();
      return data(res, null as any);
    },

    syncEmployees: async () => {
      const res = await hrService.employees.sync();
      await get().fetchEmployees();
      return data(res, null as any);
    },

    // ======================
    // Attendance + punches
    // ======================

    fetchAttendances: async (params) => {
      if (params !== undefined) lastAttendanceQuery = params;
      await run(async () => {
        const res = await hrService.attendance.getAll(lastAttendanceQuery);
        set({ attendances: data(res, []) });
      });
    },

    createAttendance: async (payload) => {
      await hrService.attendance.create(payload);
      await get().fetchAttendances();
    },

    updateAttendance: async (id, payload) => {
      await hrService.attendance.update(id, payload);
      await get().fetchAttendances();
    },

    deleteAttendance: async (id) => {
      await hrService.attendance.remove(id);
      await get().fetchAttendances();
    },

    fetchPunches: async (date, employeeId) => {
      lastPunchQuery = { date, employeeId };
      await run(async () => {
        const res = await hrService.punches.getByDate(date, employeeId);
        set({ punches: data(res, []) });
      });
    },

    createPunch: async (payload) => {
      const res = await hrService.punches.create(payload);
      if (lastPunchQuery) await get().fetchPunches(lastPunchQuery.date, lastPunchQuery.employeeId);
      await get().fetchAttendances();
      await get().fetchUnmatchedPunches();
      return data(res, null as any);
    },

    importPunches: async (items) => {
      const res = await hrService.punches.importMany(items);
      if (lastPunchQuery) await get().fetchPunches(lastPunchQuery.date, lastPunchQuery.employeeId);
      await get().fetchAttendances();
      await get().fetchUnmatchedPunches();
      return data(res, null as any);
    },

    deletePunch: async (id) => {
      await hrService.punches.remove(id);
      if (lastPunchQuery) await get().fetchPunches(lastPunchQuery.date, lastPunchQuery.employeeId);
      await get().fetchAttendances();
    },

    fetchUnmatchedPunches: async () => {
      await run(async () => {
        const res = await hrService.punches.unmatched();
        set({ unmatchedPunches: data(res, []) });
      });
    },

    assignUnmatchedPunches: async (biometricCode, employeeId) => {
      const res = await hrService.punches.assignUnmatched(biometricCode, employeeId);
      await get().fetchUnmatchedPunches();
      await get().fetchAttendances();
      await get().fetchEmployees();
      return data(res, null as any);
    },

    // ======================
    // Shifts, settings, devices
    // ======================

    fetchShifts: async () => {
      await run(async () => {
        const res = await hrService.shifts.getAll();
        set({ shifts: data(res, []) });
      });
    },

    createShift: async (payload) => {
      await hrService.shifts.create(payload);
      await get().fetchShifts();
    },

    updateShift: async (id, payload) => {
      await hrService.shifts.update(id, payload);
      await get().fetchShifts();
    },

    deleteShift: async (id) => {
      await hrService.shifts.remove(id);
      await get().fetchShifts();
    },

    fetchSettings: async () => {
      await run(async () => {
        const res = await hrService.settings.get();
        set({ settings: data(res, null) });
      });
    },

    updateSettings: async (payload) => {
      await hrService.settings.update(payload);
      await get().fetchSettings();
    },

    fetchDevices: async () => {
      await run(async () => {
        const res = await hrService.devices.getAll();
        set({ devices: data(res, []) });
      });
    },

    createDevice: async (payload) => {
      const res = await hrService.devices.create(payload);
      await get().fetchDevices();
      return data(res, null as any);
    },

    updateDevice: async (id, payload) => {
      await hrService.devices.update(id, payload);
      await get().fetchDevices();
    },

    regenerateDeviceKey: async (id) => {
      const res = await hrService.devices.regenerateKey(id);
      await get().fetchDevices();
      return data(res, null as any);
    },

    deleteDevice: async (id) => {
      await hrService.devices.remove(id);
      await get().fetchDevices();
    },

    // ======================
    // Leave
    // ======================

    fetchLeaveTypes: async () => {
      await run(async () => {
        const res = await hrService.leaveConfig.getTypes();
        set({ leaveTypes: data(res, []) });
      });
    },

    createLeaveType: async (payload) => {
      await hrService.leaveConfig.createType(payload);
      await get().fetchLeaveTypes();
    },

    updateLeaveType: async (id, payload) => {
      await hrService.leaveConfig.updateType(id, payload);
      await get().fetchLeaveTypes();
    },

    deleteLeaveType: async (id) => {
      await hrService.leaveConfig.removeType(id);
      await get().fetchLeaveTypes();
    },

    fetchLeavePolicies: async (leaveTypeId) => {
      lastPolicyType = leaveTypeId;
      await run(async () => {
        const res = await hrService.leaveConfig.getPolicies(lastPolicyType);
        set({ leavePolicies: data(res, []) });
      });
    },

    createLeavePolicy: async (payload) => {
      await hrService.leaveConfig.createPolicy(payload);
      await get().fetchLeavePolicies(lastPolicyType);
      await get().fetchLeaveTypes();
    },

    updateLeavePolicy: async (id, payload) => {
      await hrService.leaveConfig.updatePolicy(id, payload);
      await get().fetchLeavePolicies(lastPolicyType);
    },

    deleteLeavePolicy: async (id) => {
      await hrService.leaveConfig.removePolicy(id);
      await get().fetchLeavePolicies(lastPolicyType);
      await get().fetchLeaveTypes();
    },

    fetchLeaves: async (params) => {
      if (params !== undefined) lastLeaveQuery = params;
      await run(async () => {
        const res = await hrService.leaves.getAll(lastLeaveQuery);
        set({ leaves: data(res, []) });
      });
    },

    createLeave: async (payload) => {
      await hrService.leaves.create(payload);
      await get().fetchLeaves();
      await get().fetchAttendances();
    },

    updateLeave: async (id, payload) => {
      await hrService.leaves.update(id, payload);
      await get().fetchLeaves();
      await get().fetchAttendances();
    },

    cancelLeave: async (id) => {
      await hrService.leaves.cancel(id);
      await get().fetchLeaves();
      await get().fetchAttendances();
    },

    // Returned directly (not stored): it depends on the employee picked in a form.
    getLeaveBalances: async (employeeId, asOf) => {
      const res = await hrService.leaves.balances(employeeId, asOf);
      return data(res, []);
    },

    fetchMyLeaves: async (params) => {
      await run(async () => {
        const res = await hrService.leaves.my(params);
        set({ myLeaves: data(res, []) });
      });
    },

    fetchMyBalances: async (asOf) => {
      await run(async () => {
        const res = await hrService.leaves.myBalances(asOf);
        set({ myBalances: data(res, []) });
      });
    },

    // ======================
    // Reports
    // ======================

    fetchDailyReport: async (date) => {
      await run(async () => {
        const res = await hrService.reports.daily(date);
        set({ dailyReport: data(res, null) });
      });
    },

    fetchSummaryReport: async (params) => {
      await run(async () => {
        const res = await hrService.reports.summary(params);
        set({ summaryReport: data(res, null) });
      });
    },

    fetchEmployeeReport: async (employeeId, from, to) => {
      await run(async () => {
        const res = await hrService.reports.employee(employeeId, from, to);
        set({ employeeReport: data(res, null) });
      });
    },

    fetchMyReport: async (from, to) => {
      await run(async () => {
        const res = await hrService.reports.my(from, to);
        set({ myReport: data(res, null) });
      });
    },

    // ======================
    // Payroll
    // ======================

    fetchSalaryStructures: async () => {
      await run(async () => {
        const res = await hrService.payroll.getStructures();
        set({ salaryStructures: data(res, []) });
      });
    },

    fetchMissingSalaries: async () => {
      await run(async () => {
        const res = await hrService.payroll.getMissingStructures();
        set({ missingSalaries: data(res, []) });
      });
    },

    createSalaryStructure: async (payload) => {
      await hrService.payroll.createStructure(payload);
      await get().fetchSalaryStructures();
      await get().fetchMissingSalaries();
    },

    updateSalaryStructure: async (employeeId, payload) => {
      await hrService.payroll.updateStructure(employeeId, payload);
      await get().fetchSalaryStructures();
    },

    deleteSalaryStructure: async (employeeId) => {
      await hrService.payroll.removeStructure(employeeId);
      await get().fetchSalaryStructures();
      await get().fetchMissingSalaries();
    },

    fetchPayslips: async (params) => {
      if (params !== undefined) lastPayslipQuery = params;
      await run(async () => {
        const res = await hrService.payroll.getPayslips(lastPayslipQuery);
        set({ payslips: data(res, []) });
      });
    },

    generatePayroll: async (payload) => {
      const res = await hrService.payroll.generate(payload);
      await get().fetchPayslips();
      return data(res, null as any);
    },

    finalizePayroll: async (payload) => {
      const res = await hrService.payroll.finalize(payload);
      await get().fetchPayslips();
      return data(res, null as any);
    },

    recalculatePayslip: async (id) => {
      await hrService.payroll.recalculate(id);
      await get().fetchPayslips();
    },

    finalizePayslip: async (id, allowUnmarked = false) => {
      await hrService.payroll.finalizePayslip(id, allowUnmarked);
      await get().fetchPayslips();
    },

    reopenPayslip: async (id) => {
      await hrService.payroll.reopen(id);
      await get().fetchPayslips();
    },

    deletePayslip: async (id) => {
      await hrService.payroll.removePayslip(id);
      await get().fetchPayslips();
    },

    fetchMyPayslips: async () => {
      await run(async () => {
        const res = await hrService.payroll.myPayslips();
        set({ myPayslips: data(res, []) });
      });
    },

    // Call on logout so one person's data never shows for the next login.
    clearAll: () => set({ ...initialState }),
  };
});