"use client";

import { useEffect, useState } from "react";
import { Inbox, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { GateDashboard } from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import { StatusBadge, TYPE_LABEL, apiError, formatDateTime, fullName } from "./shared";

const REFRESH_MS = 30_000;

type OutNow = GateDashboard["outNow"][number];
type Recent = GateDashboard["recent"][number];

const RESULT_META: Record<string, { label: string; className: string }> = {
  ALLOWED: { label: "Allowed", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  DENIED_EXPIRED: { label: "Expired pass", className: "border-red-200 bg-red-50 text-red-700" },
  DENIED_INVALID: { label: "Not valid", className: "border-red-200 bg-red-50 text-red-700" },
};

function namesLabel(people: { firstName: string; lastName: string }[]) {
  const names = people.map(fullName);

  if (names.length <= 2) return names.join(", ");

  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

/** "2 h 10 min", counted from the time the student was due back. */
function overdueBy(due: string) {
  const minutes = Math.floor((Date.now() - new Date(due).getTime()) / 60000);

  if (minutes < 1) return "just now";

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${mins} min`;

  return `${mins} min`;
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "alert" }) {
  return (
    <div className={cn("rounded-lg border p-4", tone === "alert" && value > 0 && "border-red-200 bg-red-50")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold", tone === "alert" && value > 0 && "text-red-700")}>{value}</p>
    </div>
  );
}

export default function RecordsTab() {
  const dashboard = useGatepassStore((s) => s.dashboard);
  const loading = useGatepassStore((s) => s.loading.dashboard);
  const fetchDashboard = useGatepassStore((s) => s.fetchDashboard);

  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = (quiet: boolean) =>
    fetchDashboard()
      .then(() => setUpdatedAt(new Date()))
      .catch((error) => {
        if (!quiet) toast.error(apiError(error, "Could not load the records"));
      });

  useEffect(() => {
    void load(false);

    const timer = setInterval(() => void load(true), REFRESH_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDashboard]);

  if (!dashboard) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { outNow, recent } = dashboard;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Updates by itself every 30 seconds
          {updatedAt ? `. Last updated at ${updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}.
        </p>

        <Button variant="outline" className="gap-2" onClick={() => void load(false)} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Out now" value={outNow.length} />
        <Stat label="Overdue" value={dashboard.overdueCount} tone="alert" />
        <Stat label="Left today" value={dashboard.todayExits} />
        <Stat label="Returned today" value={dashboard.todayReturns} />
        <Stat label="Refused today" value={dashboard.todayDenied} tone="alert" />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Students out of campus</h2>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Left at</TableHead>
                <TableHead>Due back</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {outNow.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <Inbox className="mx-auto mb-2 size-6" />
                    Everyone is on campus.
                  </TableCell>
                </TableRow>
              ) : (
                outNow.map((row: OutNow) => {
                  const overdue = row.status === "OVERDUE";

                  return (
                    <TableRow key={row.id} className={cn(overdue && "bg-red-50/60")}>
                      <TableCell>
                        <p className="font-medium">{row.requestNo}</p>
                        <p className="text-xs text-muted-foreground">{TYPE_LABEL[row.type]}</p>
                      </TableCell>

                      <TableCell className="max-w-56 text-sm">
                        <p className="truncate">{namesLabel(row.students.map((s) => s.student))}</p>
                        {row.students.length === 1 && (
                          <p className="text-xs text-muted-foreground">Adm. no. {row.students[0].student.admissionNo}</p>
                        )}
                        {row.accompanyingPerson && (
                          <p className="text-xs text-muted-foreground">With {row.accompanyingPerson}</p>
                        )}
                      </TableCell>

                      <TableCell className="text-sm">{row.destination || "—"}</TableCell>

                      <TableCell className="text-sm">{formatDateTime(row.actualExitAt)}</TableCell>

                      <TableCell className="text-sm">
                        <p>{formatDateTime(row.requestedTo)}</p>
                        {overdue && <p className="font-medium text-red-700">Late by {overdueBy(row.requestedTo)}</p>}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent gate activity</h2>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead>Gate</TableHead>
                <TableHead>Picked up by</TableHead>
                <TableHead>Guard</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No gate activity yet.
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((log: Recent) => {
                  const request = log.pass?.movementRequest;
                  const result = RESULT_META[log.result] ?? { label: log.result, className: "" };

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateTime(log.scanTime)}</TableCell>

                      <TableCell className="text-sm">{request?.requestNo ?? "—"}</TableCell>

                      <TableCell className="max-w-48 truncate text-sm">
                        {request ? namesLabel(request.students.map((s) => s.student)) : "—"}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">{log.direction === "OUT" ? "Left" : "Returned"}</Badge>
                      </TableCell>

                      <TableCell className="text-sm">{log.gate?.name ?? "—"}</TableCell>

                      <TableCell className="text-sm">
                        {log.pickupPerson ? `${log.pickupPerson.name} (${log.pickupPerson.relation})` : "—"}
                      </TableCell>

                      <TableCell className="text-sm">{log.scannedBy?.name ?? "—"}</TableCell>

                      <TableCell>
                        <Badge variant="outline" className={result.className}>
                          {result.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}