import { RoleGuard } from "@/components/auth/RoleGuard";

// Admin / superadmin only.
export default function DepartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard access="departments">{children}</RoleGuard>;
}
