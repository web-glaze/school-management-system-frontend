import { RoleGuard } from "@/components/auth/RoleGuard";

// Admin / superadmin only.
export default function RolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard access="users">{children}</RoleGuard>;
}
