"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, Clock3, DoorOpen, FileCog, Loader2, MonitorSmartphone, Plus, RefreshCw, Search, Settings2, ShieldAlert, Trash2, Users, X, Zap } from "lucide-react";
import { toast } from "sonner";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePermission } from "@/hooks/usePermission";
import apiClient from "@/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SectionKey = "request-types" | "gates" | "devices" | "slots" | "blacklist";

type RequestType = {
  id: string;
  code: string;
  name: string;
  appliesTo: "STUDENT" | "STAFF";
  slotModel: "FIXED" | "FREE_FORM" | "EITHER";
  approvalChain: unknown;
  goodsTracking: boolean;
  maxDurationHours?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Gate = {
  id: string;
  name: string;
  location?: string | null;
  type: "MAIN" | "HOSTEL" | "SERVICE";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type GateDevice = {
  id: string;
  gateId: string;
  deviceName: string;
  deviceToken: string;
  status: "ACTIVE" | "REVOKED";
  lastSyncAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  gate?: Gate;
};

type VisitingSlot = {
  id: string;
  slotDate: string;
  timeFrom: string;
  timeTo: string;
  slotPurpose: "VISITING" | "OUTING";
  capacity: number;
  bookedCount: number;
  status: "OPEN" | "FULL" | "CLOSED";
  createdAt?: string;
  updatedAt?: string;
};

type PassBlacklist = {
  id: string;
  subjectType: "STUDENT" | "STAFF" | "VISITOR";
  subjectId: string;
  reason?: string | null;
  activeUntil?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  data?: {
    data?: T;
  } & T;
};

const sections: {
  key: SectionKey;
  title: string;
  description: string;
  icon: ElementType;
}[] = [
  {
    key: "request-types",
    title: "Request Types",
    description: "Movement rules and approval chains",
    icon: FileCog,
  },
  {
    key: "gates",
    title: "Gates",
    description: "Physical campus entry points",
    icon: DoorOpen,
  },
  {
    key: "devices",
    title: "Devices",
    description: "Registered gate scanning devices",
    icon: MonitorSmartphone,
  },
  {
    key: "slots",
    title: "Visiting Slots",
    description: "Published visiting and outing windows",
    icon: CalendarClock,
  },
  {
    key: "blacklist",
    title: "Blacklist",
    description: "Restricted people and temporary bans",
    icon: ShieldAlert,
  },
];

function unwrap<T>(response: ApiResponse<T>): T {
  const value = response?.data;

  if (value && typeof value === "object" && "data" in value) {
    return value.data as T;
  }

  return value as T;
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object" && "items" in value && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: T[] }).items;
  }

  return [];
}

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }

  return fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatEnum(value?: string | null) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getApprovalChain(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function StatusPill({ active, label }: { active: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}
    >
      <span className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {label ?? (active ? "Active" : "Inactive")}
    </span>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">{title}</h3>

      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function GatepassConfigurationPage() {
  const authorized = usePermission("gatepass.config");

  const [activeSection, setActiveSection] = useState<SectionKey>("request-types");

  const [search, setSearch] = useState("");

  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [devices, setDevices] = useState<GateDevice[]>([]);
  const [slots, setSlots] = useState<VisitingSlot[]>([]);
  const [blacklist, setBlacklist] = useState<PassBlacklist[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [requestTypeForm, setRequestTypeForm] = useState({
    code: "",
    name: "",
    appliesTo: "STUDENT" as RequestType["appliesTo"],
    slotModel: "FREE_FORM" as RequestType["slotModel"],
    approvalChain: "",
    goodsTracking: false,
    maxDurationHours: "",
    isActive: true,
  });

  const [gateForm, setGateForm] = useState({
    name: "",
    location: "",
    type: "MAIN" as Gate["type"],
    isActive: true,
  });

  const [deviceForm, setDeviceForm] = useState({
    gateId: "",
    deviceName: "",
    deviceToken: "",
    status: "ACTIVE" as GateDevice["status"],
  });

  const [slotForm, setSlotForm] = useState({
    slotDate: "",
    timeFrom: "",
    timeTo: "",
    slotPurpose: "VISITING" as VisitingSlot["slotPurpose"],
    capacity: "50",
    status: "OPEN" as VisitingSlot["status"],
  });

  const [blacklistForm, setBlacklistForm] = useState({
    subjectType: "STUDENT" as PassBlacklist["subjectType"],
    subjectId: "",
    reason: "",
    activeUntil: "",
  });

  const resetForms = useCallback(() => {
    setRequestTypeForm({
      code: "",
      name: "",
      appliesTo: "STUDENT",
      slotModel: "FREE_FORM",
      approvalChain: "",
      goodsTracking: false,
      maxDurationHours: "",
      isActive: true,
    });

    setGateForm({
      name: "",
      location: "",
      type: "MAIN",
      isActive: true,
    });

    setDeviceForm({
      gateId: "",
      deviceName: "",
      deviceToken: "",
      status: "ACTIVE",
    });

    setSlotForm({
      slotDate: "",
      timeFrom: "",
      timeTo: "",
      slotPurpose: "VISITING",
      capacity: "50",
      status: "OPEN",
    });

    setBlacklistForm({
      subjectType: "STUDENT",
      subjectId: "",
      reason: "",
      activeUntil: "",
    });
  }, []);

  const loadConfiguration = useCallback(async () => {
    setLoading(true);

    try {
      const [requestTypesResponse, gatesResponse, devicesResponse, slotsResponse, blacklistResponse] = await Promise.all([
        apiClient.get("/gatepass/configuration/request-types"),
        apiClient.get("/gatepass/configuration/gates"),
        apiClient.get("/gatepass/configuration/devices"),
        apiClient.get("/gatepass/configuration/slots"),
        apiClient.get("/gatepass/configuration/blacklist"),
      ]);

      setRequestTypes(normalizeArray<RequestType>(unwrap(requestTypesResponse)));

      setGates(normalizeArray<Gate>(unwrap(gatesResponse)));

      setDevices(normalizeArray<GateDevice>(unwrap(devicesResponse)));

      setSlots(normalizeArray<VisitingSlot>(unwrap(slotsResponse)));

      setBlacklist(normalizeArray<PassBlacklist>(unwrap(blacklistResponse)));
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load gatepass configuration"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized === true) {
      void loadConfiguration();
    }
  }, [authorized, loadConfiguration]);

  const currentSection = useMemo(() => sections.find((section) => section.key === activeSection)!, [activeSection]);

  const filteredRequestTypes = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return requestTypes;

    return requestTypes.filter(
      (item) => item.name.toLowerCase().includes(value) || item.code.toLowerCase().includes(value) || item.appliesTo.toLowerCase().includes(value) || item.slotModel.toLowerCase().includes(value)
    );
  }, [requestTypes, search]);

  const filteredGates = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return gates;

    return gates.filter((item) => item.name.toLowerCase().includes(value) || item.location?.toLowerCase().includes(value) || item.type.toLowerCase().includes(value));
  }, [gates, search]);

  const filteredDevices = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return devices;

    return devices.filter((item) => item.deviceName.toLowerCase().includes(value) || item.deviceToken.toLowerCase().includes(value) || item.gate?.name?.toLowerCase().includes(value));
  }, [devices, search]);

  const filteredSlots = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return slots;

    return slots.filter((item) => item.slotPurpose.toLowerCase().includes(value) || item.status.toLowerCase().includes(value) || formatDate(item.slotDate).toLowerCase().includes(value));
  }, [slots, search]);

  const filteredBlacklist = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return blacklist;

    return blacklist.filter((item) => item.subjectId.toLowerCase().includes(value) || item.subjectType.toLowerCase().includes(value) || item.reason?.toLowerCase().includes(value));
  }, [blacklist, search]);

  const openCreateDialog = () => {
    resetForms();
    setDialogOpen(true);
  };

  const createRequestType = async () => {
    if (!requestTypeForm.code.trim()) {
      toast.error("Request type code is required");
      return;
    }

    if (!requestTypeForm.name.trim()) {
      toast.error("Request type name is required");
      return;
    }

    const approvalChain = requestTypeForm.approvalChain
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setSaving(true);

    try {
      const response = await apiClient.post("/gate-config/request-types", {
        code: requestTypeForm.code.trim(),
        name: requestTypeForm.name.trim(),
        appliesTo: requestTypeForm.appliesTo,
        slotModel: requestTypeForm.slotModel,
        approvalChain,
        goodsTracking: requestTypeForm.goodsTracking,
        maxDurationHours: requestTypeForm.maxDurationHours ? Number(requestTypeForm.maxDurationHours) : undefined,
        isActive: requestTypeForm.isActive,
      });

      const created = unwrap<RequestType>(response);

      setRequestTypes((previous) => [created, ...previous.filter((item) => item.id !== created.id)]);

      toast.success("Request type created successfully");
      setDialogOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to create request type"));
    } finally {
      setSaving(false);
    }
  };

  const createGate = async () => {
    if (!gateForm.name.trim()) {
      toast.error("Gate name is required");
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.post("/gate-config/gates", {
        name: gateForm.name.trim(),
        location: gateForm.location.trim() || undefined,
        type: gateForm.type,
        isActive: gateForm.isActive,
      });

      const created = unwrap<Gate>(response);

      setGates((previous) => [created, ...previous.filter((item) => item.id !== created.id)]);

      toast.success("Gate created successfully");
      setDialogOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to create gate"));
    } finally {
      setSaving(false);
    }
  };

  const createDevice = async () => {
    if (!deviceForm.gateId) {
      toast.error("Select a gate");
      return;
    }

    if (!deviceForm.deviceName.trim()) {
      toast.error("Device name is required");
      return;
    }

    if (!deviceForm.deviceToken.trim()) {
      toast.error("Device token is required");
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.post("/gate-config/devices", {
        gateId: deviceForm.gateId,
        deviceName: deviceForm.deviceName.trim(),
        deviceToken: deviceForm.deviceToken.trim(),
        status: deviceForm.status,
      });

      const created = unwrap<GateDevice>(response);

      setDevices((previous) => [created, ...previous.filter((item) => item.id !== created.id)]);

      toast.success("Device registered successfully");
      setDialogOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to register device"));
    } finally {
      setSaving(false);
    }
  };

  const createSlot = async () => {
    if (!slotForm.slotDate) {
      toast.error("Slot date is required");
      return;
    }

    if (!slotForm.timeFrom || !slotForm.timeTo) {
      toast.error("Start and end time are required");
      return;
    }

    const capacity = Number(slotForm.capacity);

    if (!Number.isFinite(capacity) || capacity <= 0) {
      toast.error("Capacity must be greater than zero");
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.post("/gate-config/slots", {
        slotDate: new Date(`${slotForm.slotDate}T00:00:00`).toISOString(),
        timeFrom: slotForm.timeFrom,
        timeTo: slotForm.timeTo,
        slotPurpose: slotForm.slotPurpose,
        capacity,
        status: slotForm.status,
      });

      const created = unwrap<VisitingSlot>(response);

      setSlots((previous) => [created, ...previous.filter((item) => item.id !== created.id)]);

      toast.success("Visiting slot created successfully");
      setDialogOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to create visiting slot"));
    } finally {
      setSaving(false);
    }
  };

  const createBlacklistEntry = async () => {
    if (!blacklistForm.subjectId.trim()) {
      toast.error("Subject ID is required");
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.post("/gate-config/blacklist", {
        subjectType: blacklistForm.subjectType,
        subjectId: blacklistForm.subjectId.trim(),
        reason: blacklistForm.reason.trim() || undefined,
        activeUntil: blacklistForm.activeUntil ? new Date(`${blacklistForm.activeUntil}T23:59:59`).toISOString() : undefined,
      });

      const created = unwrap<PassBlacklist>(response);

      setBlacklist((previous) => [created, ...previous.filter((item) => item.id !== created.id)]);

      toast.success("Blacklist entry added successfully");
      setDialogOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to add blacklist entry"));
    } finally {
      setSaving(false);
    }
  };

  const deleteBlacklistEntry = async (id: string) => {
    setSaving(true);

    try {
      await apiClient.delete(`/gate-config/blacklist/${id}`);

      setBlacklist((previous) => previous.filter((item) => item.id !== id));

      toast.success("Blacklist entry removed");
    } catch (error) {
      toast.error(errorMessage(error, "Failed to remove blacklist entry"));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    switch (activeSection) {
      case "request-types":
        await createRequestType();
        break;

      case "gates":
        await createGate();
        break;

      case "devices":
        await createDevice();
        break;

      case "slots":
        await createSlot();
        break;

      case "blacklist":
        await createBlacklistEntry();
        break;
    }
  };

  const totalActive = {
    requestTypes: requestTypes.filter((item) => item.isActive).length,
    gates: gates.filter((item) => item.isActive).length,
    devices: devices.filter((item) => item.status === "ACTIVE").length,
    slots: slots.filter((item) => item.status === "OPEN").length,
    blacklist: blacklist.length,
  };

  if (authorized === null) {
    return null;
  }

  if (!authorized) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <ShieldAlert className="size-6 text-muted-foreground" />
            </div>

            <h2 className="text-lg font-bold">Access Restricted</h2>

            <p className="mt-1 text-sm text-muted-foreground">You do not have permission to manage Gatepass configuration.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-7">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Settings2 className="size-5" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Gatepass</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Configuration</h1>

            <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">Configure movement rules, gates, scanning devices, visiting slots and blacklist controls from one place.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" className="h-10 gap-2" onClick={() => void loadConfiguration()} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button className="h-10 gap-2" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Add {currentSection.title.replace(/s$/, "")}
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <SummaryCard icon={FileCog} label="Request Types" value={requestTypes.length} active={totalActive.requestTypes} />

          <SummaryCard icon={DoorOpen} label="Gates" value={gates.length} active={totalActive.gates} />

          <SummaryCard icon={MonitorSmartphone} label="Devices" value={devices.length} active={totalActive.devices} />

          <SummaryCard icon={CalendarClock} label="Open Slots" value={slots.length} active={totalActive.slots} />

          <SummaryCard icon={ShieldAlert} label="Blacklist" value={totalActive.blacklist} active={totalActive.blacklist} accent="warning" />
        </div>

        {/* Section selector */}
        <div className="rounded-2xl border border-border/60 bg-card p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.key;

              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.key);
                    setSearch("");
                  }}
                  className={`group flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    active ? "border-primary/30 bg-primary/4 ring-1 ring-primary/20" : "border-transparent hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary"}`}>
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>{section.title}</p>

                    <p className="truncate text-xs text-muted-foreground">{section.description}</p>
                  </div>

                  {active && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current section */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/60 p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <currentSection.icon className="size-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-foreground">{currentSection.title}</h2>

                  <p className="mt-0.5 text-sm text-muted-foreground">{currentSection.description}</p>
                </div>
              </div>

              <div className="relative w-full lg:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${currentSection.title.toLowerCase()}...`} className="h-10 pl-9 pr-9" />

                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="size-9 animate-spin text-primary" />

                <p className="mt-4 text-sm font-semibold">Loading configuration...</p>

                <p className="mt-1 text-xs text-muted-foreground">Fetching the latest Gatepass settings</p>
              </div>
            ) : (
              <>
                {/* REQUEST TYPES */}
                {activeSection === "request-types" && (
                  <>
                    {filteredRequestTypes.length === 0 ? (
                      <EmptyState
                        icon={FileCog}
                        title={requestTypes.length === 0 ? "No Request Types" : "No Request Types Found"}
                        description={requestTypes.length === 0 ? "Create your first movement request type to define how Gatepass requests are handled." : "Try adjusting your search."}
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Request Type</TableHead>
                              <TableHead>Applies To</TableHead>
                              <TableHead>Slot Model</TableHead>
                              <TableHead>Approval Chain</TableHead>
                              <TableHead>Goods</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {filteredRequestTypes.map((item) => {
                              const approvals = getApprovalChain(item.approvalChain);

                              return (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-semibold text-foreground">{item.name}</p>
                                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.code}</p>
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{formatEnum(item.appliesTo)}</span>
                                  </TableCell>

                                  <TableCell>
                                    <span className="text-sm font-medium">{formatEnum(item.slotModel)}</span>
                                  </TableCell>

                                  <TableCell>
                                    {approvals.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {approvals.map((approval) => (
                                          <span key={approval} className="rounded-md border bg-muted/50 px-2 py-1 text-xs font-medium">
                                            {approval}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">No approval chain</span>
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${item.goodsTracking ? "text-emerald-600" : "text-muted-foreground"}`}>
                                      {item.goodsTracking ? <CheckCircle2 className="size-3.5" /> : <X className="size-3.5" />}

                                      {item.goodsTracking ? "Tracked" : "No"}
                                    </span>
                                  </TableCell>

                                  <TableCell>{item.maxDurationHours ? `${item.maxDurationHours} hrs` : "Unlimited"}</TableCell>

                                  <TableCell>
                                    <StatusPill active={item.isActive} />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}

                {/* GATES */}
                {activeSection === "gates" && (
                  <>
                    {filteredGates.length === 0 ? (
                      <EmptyState
                        icon={DoorOpen}
                        title={gates.length === 0 ? "No Gates Configured" : "No Gates Found"}
                        description={gates.length === 0 ? "Create the physical entry points that will be used by the Gatepass system." : "Try adjusting your search."}
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Gate</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Devices</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {filteredGates.map((gate) => {
                              const deviceCount = devices.filter((device) => device.gateId === gate.id).length;

                              return (
                                <TableRow key={gate.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <DoorOpen className="size-4" />
                                      </div>

                                      <div>
                                        <p className="font-semibold">{gate.name}</p>

                                        <p className="font-mono text-xs text-muted-foreground">{gate.id}</p>
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell>{gate.location || "—"}</TableCell>

                                  <TableCell>
                                    <span className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-semibold">{formatEnum(gate.type)}</span>
                                  </TableCell>

                                  <TableCell>
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <MonitorSmartphone className="size-4 text-muted-foreground" />
                                      {deviceCount}
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <StatusPill active={gate.isActive} />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}

                {/* DEVICES */}
                {activeSection === "devices" && (
                  <>
                    {filteredDevices.length === 0 ? (
                      <EmptyState
                        icon={MonitorSmartphone}
                        title={devices.length === 0 ? "No Gate Devices" : "No Devices Found"}
                        description={devices.length === 0 ? "Register gate tablets or scanner devices before using the Gate Scan feature." : "Try adjusting your search."}
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Device</TableHead>
                              <TableHead>Gate</TableHead>
                              <TableHead>Token</TableHead>
                              <TableHead>Last Sync</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {filteredDevices.map((device) => (
                              <TableRow key={device.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                      <MonitorSmartphone className="size-4" />
                                    </div>

                                    <div>
                                      <p className="font-semibold">{device.deviceName}</p>

                                      <p className="font-mono text-xs text-muted-foreground">{device.id}</p>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell>{device.gate?.name ?? gates.find((gate) => gate.id === device.gateId)?.name ?? "Unknown Gate"}</TableCell>

                                <TableCell>
                                  <span className="inline-flex max-w-60 truncate rounded-md bg-muted px-2 py-1 font-mono text-xs">{device.deviceToken}</span>
                                </TableCell>

                                <TableCell>{formatDateTime(device.lastSyncAt)}</TableCell>

                                <TableCell>
                                  <StatusPill active={device.status === "ACTIVE"} label={device.status === "ACTIVE" ? "Active" : "Revoked"} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}

                {/* SLOTS */}
                {activeSection === "slots" && (
                  <>
                    {filteredSlots.length === 0 ? (
                      <EmptyState
                        icon={CalendarClock}
                        title={slots.length === 0 ? "No Visiting Slots" : "No Slots Found"}
                        description={slots.length === 0 ? "Publish visiting and outing windows so movement requests can use fixed slots." : "Try adjusting your search."}
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Date</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Purpose</TableHead>
                              <TableHead>Capacity</TableHead>
                              <TableHead>Bookings</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {filteredSlots.map((slot) => (
                              <TableRow key={slot.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <CalendarClock className="size-4 text-primary" />
                                    <span className="font-semibold">{formatDate(slot.slotDate)}</span>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div className="flex items-center gap-1.5 text-sm font-medium">
                                    <Clock3 className="size-4 text-muted-foreground" />
                                    {slot.timeFrom} – {slot.timeTo}
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">{formatEnum(slot.slotPurpose)}</span>
                                </TableCell>

                                <TableCell>{slot.capacity}</TableCell>

                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <Users className="size-4 text-muted-foreground" />
                                    <span className="font-semibold">{slot.bookedCount}</span>

                                    <span className="text-xs text-muted-foreground">/ {slot.capacity}</span>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <StatusPill active={slot.status === "OPEN"} label={formatEnum(slot.status)} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}

                {/* BLACKLIST */}
                {activeSection === "blacklist" && (
                  <>
                    {filteredBlacklist.length === 0 ? (
                      <EmptyState
                        icon={ShieldAlert}
                        title={blacklist.length === 0 ? "Blacklist Is Clear" : "No Blacklist Entries Found"}
                        description={blacklist.length === 0 ? "Restricted people will appear here once a blacklist entry is created." : "Try adjusting your search."}
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Subject Type</TableHead>
                              <TableHead>Subject ID</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Active Until</TableHead>
                              <TableHead>Added</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {filteredBlacklist.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">{formatEnum(item.subjectType)}</span>
                                </TableCell>

                                <TableCell>
                                  <span className="font-mono text-xs">{item.subjectId}</span>
                                </TableCell>

                                <TableCell className="max-w-72">
                                  <span className="line-clamp-2 text-sm">{item.reason || "No reason provided"}</span>
                                </TableCell>

                                <TableCell>{item.activeUntil ? formatDate(item.activeUntil) : "Indefinite"}</TableCell>

                                <TableCell>{formatDate(item.createdAt)}</TableCell>

                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={saving} onClick={() => void deleteBlacklistEntry(item.id)}>
                                    <Trash2 className="size-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CREATE DIALOG */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);

          if (!open) {
            resetForms();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <currentSection.icon className="size-4" />
              </div>
              Add {currentSection.title.replace(/s$/, "")}
            </DialogTitle>

            <DialogDescription>
              Configure a new {currentSection.title.toLowerCase()}
              item for Gatepass.
            </DialogDescription>
          </DialogHeader>

          {/* REQUEST TYPE FORM */}
          {activeSection === "request-types" && (
            <div className="space-y-5 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="request-code">Code</Label>

                  <Input
                    id="request-code"
                    placeholder="student_day_outing"
                    value={requestTypeForm.code}
                    onChange={(event) =>
                      setRequestTypeForm((previous) => ({
                        ...previous,
                        code: event.target.value.toLowerCase().replace(/\s+/g, "_"),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request-name">Name</Label>

                  <Input
                    id="request-name"
                    placeholder="Student Day Outing"
                    value={requestTypeForm.name}
                    onChange={(event) =>
                      setRequestTypeForm((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Applies To</Label>

                  <Select
                    value={requestTypeForm.appliesTo}
                    onValueChange={(value) =>
                      setRequestTypeForm((previous) => ({
                        ...previous,
                        appliesTo: value as RequestType["appliesTo"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Slot Model</Label>

                  <Select
                    value={requestTypeForm.slotModel}
                    onValueChange={(value) =>
                      setRequestTypeForm((previous) => ({
                        ...previous,
                        slotModel: value as RequestType["slotModel"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Slot</SelectItem>
                      <SelectItem value="FREE_FORM">Free Form</SelectItem>
                      <SelectItem value="EITHER">Either</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-chain">Approval Chain</Label>

                <Input
                  id="approval-chain"
                  placeholder="Warden, Coordinator, Principal"
                  value={requestTypeForm.approvalChain}
                  onChange={(event) =>
                    setRequestTypeForm((previous) => ({
                      ...previous,
                      approvalChain: event.target.value,
                    }))
                  }
                />

                <p className="text-xs text-muted-foreground">Enter approver roles in order, separated by commas.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max-duration">Max Duration (hours)</Label>

                  <Input
                    id="max-duration"
                    type="number"
                    min="1"
                    placeholder="24"
                    value={requestTypeForm.maxDurationHours}
                    onChange={(event) =>
                      setRequestTypeForm((previous) => ({
                        ...previous,
                        maxDurationHours: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Goods Tracking</p>

                    <p className="text-xs text-muted-foreground">Record goods moving with this request.</p>
                  </div>

                  <Switch
                    checked={requestTypeForm.goodsTracking}
                    onCheckedChange={(checked) =>
                      setRequestTypeForm((previous) => ({
                        ...previous,
                        goodsTracking: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Active</p>

                  <p className="text-xs text-muted-foreground">Allow this request type to be used.</p>
                </div>

                <Switch
                  checked={requestTypeForm.isActive}
                  onCheckedChange={(checked) =>
                    setRequestTypeForm((previous) => ({
                      ...previous,
                      isActive: checked,
                    }))
                  }
                />
              </div>
            </div>
          )}

          {/* GATE FORM */}
          {activeSection === "gates" && (
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="gate-name">Gate Name</Label>

                <Input
                  id="gate-name"
                  placeholder="Main Gate"
                  value={gateForm.name}
                  onChange={(event) =>
                    setGateForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gate-location">Location</Label>

                  <Input
                    id="gate-location"
                    placeholder="Front campus"
                    value={gateForm.location}
                    onChange={(event) =>
                      setGateForm((previous) => ({
                        ...previous,
                        location: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gate Type</Label>

                  <Select
                    value={gateForm.type}
                    onValueChange={(value) =>
                      setGateForm((previous) => ({
                        ...previous,
                        type: value as Gate["type"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="MAIN">Main</SelectItem>
                      <SelectItem value="HOSTEL">Hostel</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Active Gate</p>

                  <p className="text-xs text-muted-foreground">Allow scans through this gate.</p>
                </div>

                <Switch
                  checked={gateForm.isActive}
                  onCheckedChange={(checked) =>
                    setGateForm((previous) => ({
                      ...previous,
                      isActive: checked,
                    }))
                  }
                />
              </div>
            </div>
          )}

          {/* DEVICE FORM */}
          {activeSection === "devices" && (
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label>Gate</Label>

                <Select
                  value={deviceForm.gateId}
                  onValueChange={(value) =>
                    setDeviceForm((previous) => ({
                      ...previous,
                      gateId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gate" />
                  </SelectTrigger>

                  <SelectContent>
                    {gates.map((gate) => (
                      <SelectItem key={gate.id} value={gate.id}>
                        {gate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-name">Device Name</Label>

                <Input
                  id="device-name"
                  placeholder="Main Gate Tablet 01"
                  value={deviceForm.deviceName}
                  onChange={(event) =>
                    setDeviceForm((previous) => ({
                      ...previous,
                      deviceName: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-token">Device Token</Label>

                <Input
                  id="device-token"
                  placeholder="Device registration token"
                  value={deviceForm.deviceToken}
                  onChange={(event) =>
                    setDeviceForm((previous) => ({
                      ...previous,
                      deviceToken: event.target.value,
                    }))
                  }
                />

                <p className="text-xs text-muted-foreground">The registered token used by the scanning device.</p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>

                <Select
                  value={deviceForm.status}
                  onValueChange={(value) =>
                    setDeviceForm((previous) => ({
                      ...previous,
                      status: value as GateDevice["status"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="REVOKED">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* SLOT FORM */}
          {activeSection === "slots" && (
            <div className="space-y-5 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slot-date">Slot Date</Label>

                  <Input
                    id="slot-date"
                    type="date"
                    value={slotForm.slotDate}
                    onChange={(event) =>
                      setSlotForm((previous) => ({
                        ...previous,
                        slotDate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Purpose</Label>

                  <Select
                    value={slotForm.slotPurpose}
                    onValueChange={(value) =>
                      setSlotForm((previous) => ({
                        ...previous,
                        slotPurpose: value as VisitingSlot["slotPurpose"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="VISITING">Visiting</SelectItem>
                      <SelectItem value="OUTING">Outing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="time-from">Time From</Label>

                  <Input
                    id="time-from"
                    type="time"
                    value={slotForm.timeFrom}
                    onChange={(event) =>
                      setSlotForm((previous) => ({
                        ...previous,
                        timeFrom: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-to">Time To</Label>

                  <Input
                    id="time-to"
                    type="time"
                    value={slotForm.timeTo}
                    onChange={(event) =>
                      setSlotForm((previous) => ({
                        ...previous,
                        timeTo: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>

                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={slotForm.capacity}
                    onChange={(event) =>
                      setSlotForm((previous) => ({
                        ...previous,
                        capacity: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>

                  <Select
                    value={slotForm.status}
                    onValueChange={(value) =>
                      setSlotForm((previous) => ({
                        ...previous,
                        status: value as VisitingSlot["status"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="FULL">Full</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-primary/10 bg-primary/2.5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Zap className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">Capacity control</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Fixed slots are used by routine visiting and outing requests. The system tracks bookings against the configured capacity.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BLACKLIST FORM */}
          {activeSection === "blacklist" && (
            <div className="space-y-5 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subject Type</Label>

                  <Select
                    value={blacklistForm.subjectType}
                    onValueChange={(value) =>
                      setBlacklistForm((previous) => ({
                        ...previous,
                        subjectType: value as PassBlacklist["subjectType"],
                      }))
                    }
                  >
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="VISITOR">Visitor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject-id">Subject ID</Label>

                  <Input
                    id="subject-id"
                    placeholder="UUID of student/staff/visitor"
                    value={blacklistForm.subjectId}
                    onChange={(event) =>
                      setBlacklistForm((previous) => ({
                        ...previous,
                        subjectId: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blacklist-reason">Reason</Label>

                <Input
                  id="blacklist-reason"
                  placeholder="Reason for restriction"
                  value={blacklistForm.reason}
                  onChange={(event) =>
                    setBlacklistForm((previous) => ({
                      ...previous,
                      reason: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="active-until">Active Until</Label>

                <Input
                  id="active-until"
                  type="date"
                  value={blacklistForm.activeUntil}
                  onChange={(event) =>
                    setBlacklistForm((previous) => ({
                      ...previous,
                      activeUntil: event.target.value,
                    }))
                  }
                />

                <p className="text-xs text-muted-foreground">Leave empty for an indefinite restriction.</p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <AlertTriangle className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-800">Security restriction</p>

                    <p className="mt-1 text-xs leading-5 text-red-700/80">Active blacklist entries are checked as part of the gate validation flow before a movement is allowed.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>

            <Button type="button" onClick={() => void handleCreate()} disabled={saving} className="min-w-32">
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function SummaryCard({ icon: Icon, label, value, active, accent = "primary" }: { icon: ElementType; label: string; value: number; active: number; accent?: "primary" | "warning" }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${accent === "warning" ? "bg-red-50 text-red-600" : "bg-primary/10 text-primary"}`}>
          <Icon className="size-5" />
        </div>

        <Activity className="size-4 text-muted-foreground/50" />
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>

        <div className="mt-1 flex items-end gap-2">
          <span className="text-2xl font-extrabold tracking-tight">{value}</span>

          <span className="mb-0.5 text-xs font-semibold text-emerald-600">{active} active</span>
        </div>
      </div>
    </div>
  );
}
