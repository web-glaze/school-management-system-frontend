"use client";

/**
 * Department detail — admin / super-admin only.
 *
 * Shows the whole team in one place:
 *   • Parent + sub-departments (with a click-through to drill in)
 *   • Head of department badge
 *   • Every active technician with their ticket workload
 *     (open / in-progress / resolved / total), tenure, contact info
 *   • New-joiner badge (≤ 14 days since createdAt)
 *
 * Admin can reset the technician's login password right from each row,
 * provided a User account with the same email exists. We hit the
 * existing /api/user-management/:id/password endpoint after locating the
 * user by email — no schema change needed.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Crown,
  Loader2,
  Mail,
  Phone,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  api,
  type Department,
  type DepartmentTeamMember,
  type User,
} from "@/lib/api";
import { logError } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";

const NEW_JOINER_DAYS = 14;

function isNewJoiner(createdAt: string): boolean {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return days <= NEW_JOINER_DAYS;
}

function positionLabel(p?: string | null): string {
  if (!p) return "Member";
  return p
    .split("_")
    .map((s) => s[0] + s.slice(1).toLowerCase())
    .join(" ");
}

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [department, setDepartment] = useState<Department | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pwInputs, setPwInputs] = useState<Record<string, string>>({});
  const [savingPwForTech, setSavingPwForTech] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        // Fetch the department + the user list in parallel so we can match
        // each technician to their User account by email for password reset.
        const [dept, usersList] = await Promise.all([
          api.departments.get(id),
          api.users.list().catch(() => [] as User[]),
        ]);
        setDepartment(dept);
        setUsers(usersList);
      } catch (error) {
        logError("department.detail", error);
        notify.error(error, "Failed to load department");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // email → user.id, used to wire password reset against the right account.
  const userIdByEmail = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) if (u.email) map.set(u.email.toLowerCase(), u.id);
    return map;
  }, [users]);

  const setPw = (techId: string, value: string) =>
    setPwInputs((prev) => ({ ...prev, [techId]: value }));

  const resetPassword = async (tech: DepartmentTeamMember) => {
    const email = tech.email?.toLowerCase();
    const newPassword = pwInputs[tech.id]?.trim();
    if (!email) {
      notify.error("This technician has no email — can't link to a User account.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      notify.error("Enter a password of at least 6 characters.");
      return;
    }
    const userId = userIdByEmail.get(email);
    if (!userId) {
      notify.error(
        `No User account exists for ${email}. Create one in the Users page first.`,
      );
      return;
    }
    try {
      setSavingPwForTech(tech.id);
      await api.users.changePassword(userId, newPassword);
      setPw(tech.id, "");
      notify.success(`Password updated for ${tech.name}`);
    } catch (error) {
      logError("department.detail.resetPw", error);
      notify.error(error, "Failed to update password");
    } finally {
      setSavingPwForTech(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button + hero */}
        <Link
          href="/maintenance/departments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="size-3.5" />
          Back to departments
        </Link>

        <PageHero
          title={department?.name ?? "Department"}
          subtitle={
            department?.parent
              ? `Sub-department of ${department.parent.name}`
              : "Top-level department"
          }
        />

        {loading ? (
          <div className="bg-white rounded-2xl border p-10 flex items-center justify-center">
            <Loader2 className="size-5 animate-spin text-gray-400" />
          </div>
        ) : !department ? (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <p className="text-sm font-semibold text-gray-700">
              Department not found
            </p>
            <p className="text-xs text-gray-500 mt-1">
              It may have been deleted. Go back and pick another one.
            </p>
          </div>
        ) : (
          <>
            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile
                label="Team Size"
                value={department.technicians?.length ?? 0}
                icon={Users}
                tone="text-blue-600 bg-blue-50"
              />
              <StatTile
                label="Sub-Departments"
                value={department.children?.length ?? 0}
                icon={Users}
                tone="text-cyan-600 bg-cyan-50"
              />
              <StatTile
                label="Tickets In Progress"
                value={
                  department.technicians?.reduce(
                    (acc, t) => acc + (t.stats?.inProgress ?? 0),
                    0,
                  ) ?? 0
                }
                icon={TrendingUp}
                tone="text-amber-600 bg-amber-50"
              />
              <StatTile
                label="Tickets Resolved"
                value={
                  department.technicians?.reduce(
                    (acc, t) => acc + (t.stats?.resolved ?? 0),
                    0,
                  ) ?? 0
                }
                icon={CheckCircle2}
                tone="text-emerald-600 bg-emerald-50"
              />
            </div>

            {/* Head of department */}
            {department.headTechnician && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-[#00AEF2] to-[#5DD3FB] text-white flex items-center justify-center font-bold">
                  {department.headTechnician.name?.charAt(0) ?? "H"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">
                      {department.headTechnician.name}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      <Crown className="size-3" />
                      Head
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {department.headTechnician.email ?? "no email on record"}
                  </p>
                </div>
              </div>
            )}

            {/* Sub-departments */}
            {department.children && department.children.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h2 className="text-sm font-bold text-gray-800 mb-3">
                  Sub-Departments
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {department.children.map((c) => (
                    <Link
                      key={c.id}
                      href={`/maintenance/departments/${c.id}`}
                      className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {c._count?.technicians ?? 0} members
                        </p>
                      </div>
                      <ArrowLeft className="size-4 rotate-180 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Team list */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">
                  Team Members
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Every active technician in this department with their
                  workload and contact details.
                </p>
              </div>

              {!department.technicians || department.technicians.length === 0 ? (
                <div className="p-10 text-center">
                  <Users className="size-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">
                    No team members yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add a technician in /maintenance/technician and pick this
                    department.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {department.technicians.map((t) => {
                    const userId = t.email
                      ? userIdByEmail.get(t.email.toLowerCase())
                      : undefined;
                    const newJoin = isNewJoiner(t.createdAt);
                    return (
                      <li key={t.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          {/* Identity */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {t.name?.charAt(0) ?? "T"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-gray-800">
                                  {t.name}
                                </p>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                  {positionLabel(t.position)}
                                </span>
                                {department.headTechnicianId === t.id && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                    <Crown className="size-3" />
                                    Head
                                  </span>
                                )}
                                {newJoin && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                    <UserPlus className="size-3" />
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-gray-500">
                                {t.email && (
                                  <span className="inline-flex items-center gap-1">
                                    <Mail className="size-3" />
                                    {t.email}
                                  </span>
                                )}
                                {t.phone && (
                                  <span className="inline-flex items-center gap-1">
                                    <Phone className="size-3" />
                                    {t.phone}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  Joined{" "}
                                  {new Date(t.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stats badges */}
                          <div className="flex items-center gap-2">
                            <Pill tone="amber" label="Open" value={t.stats?.open ?? 0} />
                            <Pill
                              tone="blue"
                              label="In Progress"
                              value={t.stats?.inProgress ?? 0}
                            />
                            <Pill
                              tone="emerald"
                              label="Resolved"
                              value={t.stats?.resolved ?? 0}
                            />
                          </div>
                        </div>

                        {/* Password reset */}
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                          <Input
                            type="text"
                            placeholder={
                              userId
                                ? "Set a new password for their login"
                                : "No User account linked"
                            }
                            disabled={!userId}
                            value={pwInputs[t.id] ?? ""}
                            onChange={(e) => setPw(t.id, e.target.value)}
                            className="h-9 text-xs flex-1 max-w-md"
                          />
                          <Button
                            size="sm"
                            className="h-9 text-xs"
                            disabled={
                              !userId ||
                              savingPwForTech === t.id ||
                              !(pwInputs[t.id]?.trim())
                            }
                            onClick={() => resetPassword(t)}
                          >
                            {savingPwForTech === t.id ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Saving…
                              </>
                            ) : (
                              "Change Password"
                            )}
                          </Button>
                          {!userId && t.email && (
                            <span className="text-[11px] text-gray-500">
                              Tip: create a User with email{" "}
                              <code className="bg-gray-100 px-1 py-0.5 rounded">
                                {t.email}
                              </code>{" "}
                              to link their login.
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ─── small UI helpers ─── */

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`size-8 rounded-lg flex items-center justify-center ${tone}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-3">{value}</p>
    </div>
  );
}

function Pill({
  tone,
  label,
  value,
}: {
  tone: "amber" | "blue" | "emerald";
  label: string;
  value: number;
}) {
  const cls =
    tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : tone === "blue"
        ? "bg-blue-50 text-blue-700"
        : "bg-emerald-50 text-emerald-700";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${cls}`}
    >
      {label} · {value}
    </span>
  );
}
