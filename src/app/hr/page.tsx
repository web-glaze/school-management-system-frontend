"use client";

import { useState } from "react";
import { CalendarCheck, CalendarDays, ClipboardList, Settings2, Users, Wallet, type LucideIcon } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAnyPermission, usePermissions } from "@/hooks/usePermission";
import { HR_ADMIN_PERMISSIONS } from "@/lib/hrPermissions";
import { SegmentedTabs } from "@/components/hr/shared";
import EmployeesTab from "@/components/hr/EmployeesTab";
import AttendanceTab from "@/components/hr/AttendanceTab";
import LeavesTab from "@/components/hr/LeavesTab";
import ReportsTab from "@/components/hr/ReportsTab";
import PayrollTab from "@/components/hr/PayrollTab";
import SettingsTab from "@/components/hr/SettingsTab";

type TabId = "employees" | "attendance" | "leaves" | "reports" | "payroll" | "settings";

// A tab shows when the person has any one of its permissions.
const TABS: { id: TabId; label: string; icon: LucideIcon; permissions: string[] }[] = [
  { id: "employees", label: "Employees", icon: Users, permissions: ["employee.read"] },
  { id: "attendance", label: "Attendance", icon: CalendarCheck, permissions: ["employee-attendance.read"] },
  { id: "leaves", label: "Leaves", icon: CalendarDays, permissions: ["employee-leave.read"] },
  { id: "reports", label: "Reports", icon: ClipboardList, permissions: ["hr-report.read"] },
  { id: "payroll", label: "Payroll", icon: Wallet, permissions: ["salary-structure.read", "payslip.read"] },
  {
    id: "settings",
    label: "Settings",
    icon: Settings2,
    permissions: ["hr-shift.read", "hr-setting.read", "attendance-device.read", "leave-type.read", "leave-policy.read"],
  },
];

export default function HrPage() {
  const authorized = useAnyPermission(HR_ADMIN_PERMISSIONS);
  const { ready, hasAny } = usePermissions();
  const [active, setActive] = useState<TabId | null>(null);

  if (!authorized || !ready) return null;

  const visibleTabs = TABS.filter((t) => hasAny(t.permissions));
  const current = visibleTabs.find((t) => t.id === active)?.id ?? visibleTabs[0]?.id;

  if (!current) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 mb-6 sm:mb-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">HR & Payroll</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Employees, attendance, leaves, reports and salaries</p>
          </div>

          <SegmentedTabs tabs={visibleTabs} value={current} onChange={setActive} />
        </div>

        {current === "employees" && <EmployeesTab />}
        {current === "attendance" && <AttendanceTab />}
        {current === "leaves" && <LeavesTab />}
        {current === "reports" && <ReportsTab />}
        {current === "payroll" && <PayrollTab />}
        {current === "settings" && <SettingsTab />}
      </div>
    </DashboardLayout>
  );
}