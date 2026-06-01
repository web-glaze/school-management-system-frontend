import { RoleGuard } from "@/components/auth/RoleGuard";

// Technicians + admins/managers/superadmins can all open this page.
// The backend filters to only return tickets actually assigned to the
// logged-in technician, so an admin opening the page just sees an empty
// list (they should use /maintenance/tickets instead).
export default function AssignedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard access="assigned-tickets">{children}</RoleGuard>;
}
