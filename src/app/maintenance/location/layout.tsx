import { RoleGuard } from "@/components/auth/RoleGuard";

// Admin / superadmin only.
export default function LocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard access="locations">{children}</RoleGuard>;
}
