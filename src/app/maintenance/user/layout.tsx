import { RoleGuard } from "@/components/auth/RoleGuard";

// Admin / superadmin only. Anyone else gets bounced back to /maintenance.
export default function UserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard access="users">{children}</RoleGuard>;
}
