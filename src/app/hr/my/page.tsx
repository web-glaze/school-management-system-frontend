"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { AxiosError } from "axios";
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Eye, Loader2, Wallet, type LucideIcon } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermission } from "@/hooks/usePermission";
import { useHrStore, type Payslip } from "@/store/hrStore";
import { EmptyState, SegmentedTabs, currentPeriodKey, dateKey, daysText, formatDate, monthBounds, money, periodLabel, toastError } from "@/components/hr/shared";
import { EmployeeReportView, LeaveBalanceCards, PayslipDetailDialog } from "@/components/hr/parts";

type View = "attendance" | "leaves" | "payslips";

const VIEWS: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "leaves", label: "Leaves", icon: CalendarDays },
  { id: "payslips", label: "Payslips", icon: Wallet },
];

export default function MyHrPage() {
  const authorized = usePermission("hr-self.read");
  const { myProfile, myReport, myLeaves, myBalances, myPayslips, loading, fetchMyProfile, fetchMyReport, fetchMyLeaves, fetchMyBalances, fetchMyPayslips } = useHrStore();

  const [view, setView] = useState<View>("attendance");
  const [month, setMonth] = useState(currentPeriodKey());
  const [noProfile, setNoProfile] = useState(false);
  const [slip, setSlip] = useState<Payslip | null>(null);

  const handle = (error: unknown, fallback: string) => {
    if ((error as AxiosError)?.response?.status === 403) setNoProfile(true);
    else toastError(error, fallback);
  };

  useEffect(() => {
    if (!authorized) return;
    fetchMyProfile().catch((e) => handle(e, "Failed to load your profile"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  useEffect(() => {
    if (!authorized || noProfile || view !== "attendance") return;
    const { from, to } = monthBounds(month);
    fetchMyReport(from, to).catch((e) => handle(e, "Failed to load your attendance"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, view, month, noProfile]);

  useEffect(() => {
    if (!authorized || noProfile || view !== "leaves") return;
    fetchMyLeaves().catch((e) => handle(e, "Failed to load your leaves"));
    fetchMyBalances().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, view, noProfile]);

  useEffect(() => {
    if (!authorized || noProfile || view !== "payslips") return;
    fetchMyPayslips().catch((e) => handle(e, "Failed to load your payslips"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, view, noProfile]);

  function shiftMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    setMonth(format(new Date(y, m - 1 + delta, 1), "yyyy-MM"));
  }

  if (!authorized) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 mb-6 sm:mb-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Attendance</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {myProfile ? `${myProfile.name} • ${myProfile.employeeCode}${myProfile.designation ? ` • ${myProfile.designation}` : ""}` : "Your attendance, leaves and payslips"}
            </p>
          </div>
          <SegmentedTabs tabs={VIEWS} value={view} onChange={setView} />
        </div>

        {noProfile ? (
          <EmptyState icon={CalendarCheck} title="No employee profile is linked to your account" hint="Ask HR to link your login to your employee record." />
        ) : (
          <>
            {view === "attendance" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <p className="min-w-40 text-center text-base font-semibold">{periodLabel(month)}</p>
                  <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} disabled={month >= currentPeriodKey()}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>

                {loading && !myReport ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : myReport ? (
                  <EmployeeReportView report={myReport} />
                ) : null}
              </div>
            )}

            {view === "leaves" && (
              <div className="space-y-8">
                <section>
                  <h3 className="mb-3 text-base font-semibold">Leave balances</h3>
                  <LeaveBalanceCards balances={myBalances} />
                </section>

                <section>
                  <h3 className="mb-3 text-base font-semibold">Leaves taken</h3>
                  {myLeaves.length === 0 ? (
                    <EmptyState icon={CalendarDays} title="No leaves recorded" />
                  ) : (
                    <div className="overflow-x-auto rounded-xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Days</TableHead>
                            <TableHead>Pay</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myLeaves.map((l) => (
                            <TableRow key={l.id} className={l.status === "ACTIVE" ? "" : "opacity-60"}>
                              <TableCell className="font-medium">{l.leaveType.name}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                {formatDate(l.startDate)}
                                {dateKey(l.startDate) !== dateKey(l.endDate) ? ` – ${formatDate(l.endDate)}` : ""}
                              </TableCell>
                              <TableCell>{daysText(l.totalDays)}</TableCell>
                              <TableCell>{l.isPaid ? "Paid" : "Unpaid"}</TableCell>
                              <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{l.reason || "—"}</TableCell>
                              <TableCell>{l.status === "ACTIVE" ? "Active" : "Cancelled"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </section>
              </div>
            )}

            {view === "payslips" &&
              (myPayslips.length === 0 ? (
                <EmptyState icon={Wallet} title="No payslips yet" hint="Payslips appear here once HR finalizes them." />
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Net salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myPayslips.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{periodLabel(p.periodKey)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{money(p.netSalary)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                              Finalized
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => setSlip(p)}>
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
          </>
        )}

        <PayslipDetailDialog payslip={slip} onClose={() => setSlip(null)} />
      </div>
    </DashboardLayout>
  );
}