"use client";

import { useState } from "react";
import { PillTabs } from "../shared";
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
      <PillTabs size="sub" tabs={PANELS} value={panel} onChange={setPanel} />

      {panel === "hostels" && <HostelsPanel />}
      {panel === "housemothers" && <HousemothersPanel />}
      {panel === "students" && <HostelStudentsPanel />}
      {panel === "gates" && <GatesPanel />}
    </div>
  );
}
