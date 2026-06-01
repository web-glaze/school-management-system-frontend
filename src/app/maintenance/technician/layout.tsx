import { RoleGuard } from "@/components/auth/RoleGuard";

// Admin / superadmin only.
export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard access="technicians">{children}</RoleGuard>;
}
