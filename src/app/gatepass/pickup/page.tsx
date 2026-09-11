"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, DoorOpen, History, Loader2, ScanLine, ShieldAlert, ShieldCheck, Smartphone, UserRound, XCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gatepassService, GateScanPayload } from "@/services/gatepass.service";
import { usePermission } from "@/hooks/usePermission";

interface Gate {
  id: string;
  name: string;
  location?: string | null;
  type?: string | null;
  isActive: boolean;
}

interface GateDevice {
  id: string;
  gateId: string;
  deviceName: string;
  deviceToken: string;
  status: string;
  lastSyncAt?: string | null;
  gate?: Gate;
}

interface GateLog {
  id: string;
  passId: string;
  gateId: string;
  deviceId: string;
  direction: "IN" | "OUT";
  scanTime: string;
  result: string;
  gate?: Gate;
}

interface GateDashboard {
  recent: GateLog[];
  todayAllowed: number;
  todayDenied: number;
}

interface ScanResult {
  allowed: boolean;
  result: string;
  message: string;
  logId?: string | null;
  holder?: {
    id?: string;
    name?: string;
    photoUrl?: string | null;
    holderType?: string;
  } | null;
}

interface ApiEnvelope<T> {
  data?: T;
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

function statusClasses(result: string) {
  if (result === "ALLOWED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export default function GateScanPage() {
  const authorized = usePermission("gate.scan");

  const [gates, setGates] = useState<Gate[]>([]);
  const [devices, setDevices] = useState<GateDevice[]>([]);
  const [dashboard, setDashboard] = useState<GateDashboard>({
    recent: [],
    todayAllowed: 0,
    todayDenied: 0,
  });

  const [deviceToken, setDeviceToken] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [gateId, setGateId] = useState("");
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [gatesResponse, devicesResponse, dashboardResponse] = await Promise.all([gatepassService.configuration.gates.getAll(), gatepassService.configuration.devices.getAll(), gatepassService.gateScan.dashboard()]);

      const gatesPayload = gatesResponse.data as ApiEnvelope<Gate[]> | Gate[];
      const devicesPayload = devicesResponse.data as ApiEnvelope<GateDevice[]> | GateDevice[];
      const dashboardPayload = dashboardResponse.data as ApiEnvelope<GateDashboard> | GateDashboard;

      const nextGates = Array.isArray(gatesPayload) ? gatesPayload : (gatesPayload.data ?? []);

      const nextDevices = Array.isArray(devicesPayload) ? devicesPayload : (devicesPayload.data ?? []);

      const nextDashboard =
        "recent" in dashboardPayload
          ? dashboardPayload
          : (dashboardPayload.data ?? {
              recent: [],
              todayAllowed: 0,
              todayDenied: 0,
            });

      setGates(nextGates);
      setDevices(nextDevices);
      setDashboard(nextDashboard);

      if (!gateId && nextGates.length > 0) {
        setGateId(nextGates[0].id);
      }

      if (!deviceToken && nextDevices.length > 0) {
        const activeDevice = nextDevices.find((device) => device.status === "ACTIVE");

        if (activeDevice) {
          setDeviceToken(activeDevice.deviceToken);
        }
      }
    } catch (error) {
      console.error("Failed to load gate scan data", error);
      toast.error("Failed to load gate scan data");
    } finally {
      setLoading(false);
    }
  }, [deviceToken, gateId]);

  useEffect(() => {
    if (authorized) {
      void loadData();
    }
  }, [authorized, loadData]);

  const selectedGate = useMemo(() => gates.find((gate) => gate.id === gateId), [gateId, gates]);

  const activeDevices = useMemo(() => devices.filter((device) => device.status === "ACTIVE"), [devices]);

  const handleDeviceChange = (value: string) => {
    const device = devices.find((item) => item.id === value);

    if (!device) return;

    setDeviceToken(device.deviceToken);
    setGateId(device.gateId);
  };

  const handleScan = async () => {
    if (!deviceToken.trim()) {
      toast.error("Select or enter a gate device");
      return;
    }

    if (!qrToken.trim()) {
      toast.error("Enter the QR token");
      return;
    }

    if (!gateId) {
      toast.error("Select a gate");
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      const payload: GateScanPayload = {
        deviceToken: deviceToken.trim(),
        qrToken: qrToken.trim(),
        direction,
        gateId,
      };

      const response = await gatepassService.gateScan.scan(payload);

      const responseData = response.data as ApiEnvelope<ScanResult> | ScanResult;

      const scanResult =
        "allowed" in responseData
          ? responseData
          : (responseData.data ?? {
              allowed: false,
              result: "DENIED_INVALID",
              message: "Scan failed",
            });

      setResult(scanResult);

      if (scanResult.allowed) {
        toast.success(scanResult.message || "Access allowed");
      } else {
        toast.error(scanResult.message || "Access denied");
      }

      const dashboardResponse = await gatepassService.gateScan.dashboard();

      const dashboardPayload = dashboardResponse.data as ApiEnvelope<GateDashboard> | GateDashboard;

      const updatedDashboard =
        "recent" in dashboardPayload
          ? dashboardPayload
          : (dashboardPayload.data ?? {
              recent: [],
              todayAllowed: 0,
              todayDenied: 0,
            });

      setDashboard(updatedDashboard);
    } catch (error) {
      console.error("Gate scan failed", error);
      toast.error("Gate scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleClear = () => {
    setQrToken("");
    setResult(null);
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

            <p className="mt-1 text-sm text-muted-foreground">You do not have permission to use Gate Scan.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ScanLine className="size-5" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Gatepass</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight">Gate Scan</h1>

            <p className="mt-1 text-sm text-muted-foreground">Verify gate passes and monitor gate activity in real time.</p>
          </div>

          <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <History className="mr-2 size-4" />}
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Allowed Today</p>
                  <p className="mt-1 text-2xl font-bold">{dashboard.todayAllowed}</p>
                </div>

                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Denied Today</p>
                  <p className="mt-1 text-2xl font-bold">{dashboard.todayDenied}</p>
                </div>

                <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <ShieldAlert className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Devices</p>
                  <p className="mt-1 text-2xl font-bold">{activeDevices.length}</p>
                </div>

                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Smartphone className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-2xl border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="size-5 text-primary" />
                Scan Gate Pass
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gate Device</Label>

                  <Select value={devices.find((device) => device.deviceToken === deviceToken)?.id ?? ""} onValueChange={handleDeviceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>

                    <SelectContent>
                      {activeDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.deviceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gate</Label>

                  <Select value={gateId} onValueChange={setGateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gate" />
                    </SelectTrigger>

                    <SelectContent>
                      {gates
                        .filter((gate) => gate.isActive)
                        .map((gate) => (
                          <SelectItem key={gate.id} value={gate.id}>
                            {gate.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>QR Token</Label>

                  <Input value={qrToken} onChange={(event) => setQrToken(event.target.value)} placeholder="Paste or scan the gate pass QR token" className="font-mono" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Direction</Label>

                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant={direction === "IN" ? "default" : "outline"} onClick={() => setDirection("IN")}>
                      Entry
                    </Button>

                    <Button type="button" variant={direction === "OUT" ? "default" : "outline"} onClick={() => setDirection("OUT")}>
                      Exit
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={handleClear} disabled={scanning}>
                  Clear
                </Button>

                <Button type="button" onClick={() => void handleScan()} disabled={scanning} className="sm:min-w-40">
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ScanLine className="mr-2 size-4" />
                      Verify Pass
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60">
            <CardHeader>
              <CardTitle>Verification Result</CardTitle>
            </CardHeader>

            <CardContent>
              {!result ? (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                    <ScanLine className="size-6 text-muted-foreground" />
                  </div>

                  <h3 className="font-semibold">Waiting for scan</h3>

                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">Enter a valid QR token and verify the pass to see the result here.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className={`rounded-2xl border p-5 ${statusClasses(result.result)}`}>
                    <div className="flex items-start gap-3">
                      {result.allowed ? <CheckCircle2 className="mt-0.5 size-6" /> : <XCircle className="mt-0.5 size-6" />}

                      <div>
                        <p className="font-bold">{result.allowed ? "Access Allowed" : "Access Denied"}</p>

                        <p className="mt-1 text-sm">{result.message}</p>
                      </div>
                    </div>
                  </div>

                  {result.holder && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <UserRound className="size-5" />
                        </div>

                        <div>
                          <p className="font-semibold">{result.holder.name ?? "Unknown Holder"}</p>

                          <p className="text-xs text-muted-foreground">{formatEnum(result.holder.holderType)}</p>
                        </div>
                      </div>

                      <Separator />
                    </>
                  )}

                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Gate</span>
                      <span className="font-medium">{selectedGate?.name ?? "—"}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Direction</span>
                      <span className="font-medium">{direction === "IN" ? "Entry" : "Exit"}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Result</span>
                      <span className="font-medium">{formatEnum(result.result)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Log ID</span>
                      <span className="max-w-48 truncate font-mono text-xs">{result.logId ?? "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5 text-primary" />
              Recent Gate Activity
            </CardTitle>
          </CardHeader>

          <CardContent>
            {dashboard.recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Clock3 className="mb-3 size-8 text-muted-foreground" />
                <p className="font-semibold">No gate activity</p>
                <p className="mt-1 text-sm text-muted-foreground">Recent scan activity will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recent.map((log) => (
                  <div key={log.id} className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <DoorOpen className="size-4" />
                      </div>

                      <div>
                        <p className="font-semibold">{log.gate?.name ?? gates.find((gate) => gate.id === log.gateId)?.name ?? "Unknown Gate"}</p>

                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(log.scanTime)} · {log.direction === "IN" ? "Entry" : "Exit"}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(log.result)}`}>{formatEnum(log.result)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="size-4 shrink-0" />
          Gate verification checks the registered device, signed QR, pass status, validity, blacklist, anti-passback and usage limits.
        </div>
      </div>
    </DashboardLayout>
  );
}
