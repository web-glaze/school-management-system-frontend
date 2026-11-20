"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { GateDashboard } from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import { StatusBadge, TH, THEAD_CLASS, TYPE_LABEL, TableCard, TableEmptyRow, apiError, formatDateTime, fullName } from "./shared";

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
    <div className={cn("rounded-xl border bg-card p-4", tone === "alert" && value > 0 && "border-red-200 bg-red-50")}>
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

        <TableCard>
          <Table>
            <TableHeader className={THEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`${TH} pl-4 sm:pl-6`}>Request</TableHead>
                <TableHead className={`${TH} hidden md:table-cell`}>Students</TableHead>
                <TableHead className={`${TH} hidden lg:table-cell`}>Destination</TableHead>
                <TableHead className={`${TH} hidden lg:table-cell`}>Left at</TableHead>
                <TableHead className={`${TH} hidden sm:table-cell`}>Due back</TableHead>
                <TableHead className={`${TH} pr-4 sm:pr-6`}>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/30">
              {outNow.length === 0 ? (
                <TableEmptyRow colSpan={6} title="Everyone is on campus" />
              ) : (
                outNow.map((row: OutNow) => {
                  const overdue = row.status === "OVERDUE";

                  return (
                    <TableRow key={row.id} className={cn(overdue && "bg-red-50/60")}>
                      <TableCell className="py-4 pl-4 align-middle sm:pl-6">
                        <div className="min-w-0 max-w-48 space-y-1 sm:max-w-none">
                          <p className="font-semibold leading-tight">{row.requestNo}</p>
                          <p className="text-xs text-muted-foreground">{TYPE_LABEL[row.type]}</p>
                          <p className="truncate text-sm text-foreground/60 md:hidden">{namesLabel(row.students.map((s) => s.student))}</p>
                          <p className="text-xs text-muted-foreground lg:hidden">
                            {row.destination ? `To ${row.destination} · ` : ""}Left {formatDateTime(row.actualExitAt)}
                          </p>
                          <p className={cn("text-xs sm:hidden", overdue ? "font-medium text-red-700" : "text-muted-foreground")}>
                            Due {formatDateTime(row.requestedTo)}
                            {overdue ? ` · Late by ${overdueBy(row.requestedTo)}` : ""}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="hidden max-w-56 py-4 align-middle text-sm md:table-cell">
                        <p className="truncate">{namesLabel(row.students.map((s) => s.student))}</p>
                        {row.students.length === 1 && <p className="text-xs text-muted-foreground">Adm. no. {row.students[0].student.admissionNo}</p>}
                        {row.accompanyingPerson && <p className="text-xs text-muted-foreground">With {row.accompanyingPerson}</p>}
                      </TableCell>

                      <TableCell className="hidden py-4 align-middle text-sm lg:table-cell">{row.destination || "—"}</TableCell>

                      <TableCell className="hidden py-4 align-middle text-sm lg:table-cell">{formatDateTime(row.actualExitAt)}</TableCell>

                      <TableCell className="hidden py-4 align-middle text-sm sm:table-cell">
                        <p>{formatDateTime(row.requestedTo)}</p>
                        {overdue && <p className="font-medium text-red-700">Late by {overdueBy(row.requestedTo)}</p>}
                      </TableCell>

                      <TableCell className="py-4 pr-4 align-middle sm:pr-6">
                        <StatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent gate activity</h2>

        <TableCard>
          <Table>
            <TableHeader className={THEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`${TH} hidden pl-4 sm:pl-6 md:table-cell`}>Time</TableHead>
                <TableHead className={`${TH} pl-4 md:pl-2`}>Request</TableHead>
                <TableHead className={`${TH} hidden md:table-cell`}>Students</TableHead>
                <TableHead className={`${TH} hidden lg:table-cell`}>Movement</TableHead>
                <TableHead className={`${TH} hidden lg:table-cell`}>Gate</TableHead>
                <TableHead className={`${TH} hidden xl:table-cell`}>Picked up by</TableHead>
                <TableHead className={`${TH} hidden xl:table-cell`}>Guard</TableHead>
                <TableHead className={`${TH} pr-4 sm:pr-6`}>Result</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/30">
              {recent.length === 0 ? (
                <TableEmptyRow colSpan={8} title="No gate activity yet" />
              ) : (
                recent.map((log: Recent) => {
                  const request = log.pass?.movementRequest;
                  const result = RESULT_META[log.result] ?? { label: log.result, className: "" };
                  const students = request ? namesLabel(request.students.map((s) => s.student)) : "—";

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="hidden whitespace-nowrap py-4 pl-4 align-middle text-sm sm:pl-6 md:table-cell">{formatDateTime(log.scanTime)}</TableCell>

                      <TableCell className="py-4 pl-4 align-middle md:pl-2">
                        <div className="min-w-0 max-w-48 space-y-1 sm:max-w-none">
                          <p className="font-semibold leading-tight">{request?.requestNo ?? "—"}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{formatDateTime(log.scanTime)}</p>
                          <p className="truncate text-sm text-foreground/60 md:hidden">{students}</p>
                          <p className="text-xs text-muted-foreground lg:hidden">
                            {log.direction === "OUT" ? "Left" : "Returned"}
                            {log.gate?.name ? ` · ${log.gate.name}` : ""}
                          </p>
                          {log.pickupPerson && (
                            <p className="text-xs text-muted-foreground xl:hidden">
                              Picked up by {log.pickupPerson.name} ({log.pickupPerson.relation})
                            </p>
                          )}
                          {log.scannedBy?.name && <p className="text-xs text-muted-foreground xl:hidden">Guard: {log.scannedBy.name}</p>}
                        </div>
                      </TableCell>

                      <TableCell className="hidden max-w-48 py-4 align-middle text-sm md:table-cell">
                        <p className="truncate">{students}</p>
                      </TableCell>

                      <TableCell className="hidden py-4 align-middle lg:table-cell">
                        <Badge variant="secondary">{log.direction === "OUT" ? "Left" : "Returned"}</Badge>
                      </TableCell>

                      <TableCell className="hidden py-4 align-middle text-sm lg:table-cell">{log.gate?.name ?? "—"}</TableCell>

                      <TableCell className="hidden py-4 align-middle text-sm xl:table-cell">{log.pickupPerson ? `${log.pickupPerson.name} (${log.pickupPerson.relation})` : "—"}</TableCell>

                      <TableCell className="hidden py-4 align-middle text-sm xl:table-cell">{log.scannedBy?.name ?? "—"}</TableCell>

                      <TableCell className="py-4 pr-4 align-middle sm:pr-6">
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
        </TableCard>
      </section>
    </div>
  );
}
