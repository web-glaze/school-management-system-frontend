import { RoleGuard } from "@/components/auth/RoleGuard";

// Admin / superadmin only — the page exposes per-technician workload and
// password reset links which a manager / technician shouldn't see.
export default function DepartmentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard access="departments">{children}</RoleGuard>;
}
