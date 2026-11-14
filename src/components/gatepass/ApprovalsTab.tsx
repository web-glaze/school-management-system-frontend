"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermission";
import AllRequestsPanel from "./AllRequestsPanel";
import PendingList from "./PendingList";

export default function ApprovalsTab() {
  const { ready, has } = usePermissions();
  const [view, setView] = useState("");

  if (!ready) return null;

  const views: { value: string; label: string }[] = [];

  if (has("movement.approve")) views.push({ value: "housemother", label: "Housemother approvals" });
  if (has("movement.finalize")) {
    views.push({ value: "final", label: "Final approval" });
    views.push({ value: "all", label: "All requests" });
  }

  if (views.length === 0) return null;

  const active = views.some((item) => item.value === view) ? view : views[0].value;

  return (
    <div className="space-y-4">
      {views.length > 1 && (
        <Tabs value={active} onValueChange={setView}>
          <TabsList>
            {views.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {active === "housemother" && <PendingList mode="housemother" />}
      {active === "final" && <PendingList mode="final" />}
      {active === "all" && <AllRequestsPanel />}
    </div>
  );
}