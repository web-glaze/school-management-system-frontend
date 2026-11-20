"use client";

import { useState } from "react";
import ApprovalsTab from "@/components/gatepass/ApprovalsTab";
import GateScanTab from "@/components/gatepass/GateScanTab";
import RecordsTab from "@/components/gatepass/RecordsTab";
import RequestsTab from "@/components/gatepass/RequestsTab";
import SetupTab from "@/components/gatepass/setup/SetupTab";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAnyPermission, usePermissions } from "@/hooks/usePermission";
import { ClipboardCheck, ClipboardList, ScanLine, Settings, ShieldCheck } from "lucide-react";
import { PillTabs } from "@/components/gatepass/shared";

const TABS = [
  { value: "requests", label: "Requests", icon: ClipboardList, permissions: ["movement.request"] },
  { value: "approvals", label: "Approvals", icon: ShieldCheck, permissions: ["movement.approve", "movement.finalize"] },
  { value: "gate", label: "Gate Scan", icon: ScanLine, permissions: ["gate.scan"] },
  { value: "records", label: "Records", icon: ClipboardCheck, permissions: ["gate.dashboard"] },
  { value: "setup", label: "Setup", icon: Settings, permissions: ["gatepass.config"] },
];

const ALL_PERMISSIONS = TABS.flatMap((tab) => tab.permissions);

export default function GatepassPage() {
  const authorized = useAnyPermission(ALL_PERMISSIONS);
  const { ready, hasAny } = usePermissions();
  const [tab, setTab] = useState("");

  if (authorized === null || !ready) return null;

  const visible = TABS.filter((item) => hasAny(item.permissions));
  const active = visible.some((item) => item.value === tab) ? tab : visible[0]?.value;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gate Pass</h1>
          <p className="text-muted-foreground">Outpasses, event trips and gate movement</p>
        </div>

        <PillTabs tabs={visible} value={active} onChange={setTab} />

        {active === "requests" && <RequestsTab />}
        {active === "approvals" && <ApprovalsTab />}
        {active === "gate" && <GateScanTab />}
        {active === "records" && <RecordsTab />}
        {active === "setup" && <SetupTab />}
      </div>
    </DashboardLayout>
  );
}
