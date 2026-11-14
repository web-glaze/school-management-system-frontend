"use client";

import { useState } from "react";
import ApprovalsTab from "@/components/gatepass/ApprovalsTab";
import GateScanTab from "@/components/gatepass/GateScanTab";
import RecordsTab from "@/components/gatepass/RecordsTab";
import RequestsTab from "@/components/gatepass/RequestsTab";
import SetupTab from "@/components/gatepass/setup/SetupTab";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnyPermission, usePermissions } from "@/hooks/usePermission";

const TABS = [
  { value: "requests", label: "Requests", permissions: ["movement.request"] },
  { value: "approvals", label: "Approvals", permissions: ["movement.approve", "movement.finalize"] },
  { value: "gate", label: "Gate Scan", permissions: ["gate.scan"] },
  { value: "records", label: "Records", permissions: ["gate.dashboard"] },
  { value: "setup", label: "Setup", permissions: ["gatepass.config"] },
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

        <Tabs value={active} onValueChange={setTab}>
          <TabsList>
            {visible.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {active === "requests" && <RequestsTab />}
        {active === "approvals" && <ApprovalsTab />}
        {active === "gate" && <GateScanTab />}
        {active === "records" && <RecordsTab />}
        {active === "setup" && <SetupTab />}
      </div>
    </DashboardLayout>
  );
}