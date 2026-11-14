"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GatesPanel from "./GatesPanel";
import HostelStudentsPanel from "./HostelStudentsPanel";
import HostelsPanel from "./HostelsPanel";
import HousemothersPanel from "./HousemothersPanel";

const PANELS = [
  { value: "hostels", label: "Hostels" },
  { value: "housemothers", label: "Housemothers" },
  { value: "students", label: "Students" },
  { value: "gates", label: "Gates" },
];

export default function SetupTab() {
  const [panel, setPanel] = useState("hostels");

  return (
    <div className="space-y-4">
      <Tabs value={panel} onValueChange={setPanel}>
        <TabsList>
          {PANELS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {panel === "hostels" && <HostelsPanel />}
      {panel === "housemothers" && <HousemothersPanel />}
      {panel === "students" && <HostelStudentsPanel />}
      {panel === "gates" && <GatesPanel />}
    </div>
  );
}
