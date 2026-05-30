import { redirect } from "next/navigation";

// /admin previously held a placeholder file. The actual admin surface lives
// under /dashboard, so this page just forwards the user there to avoid a
// broken Next route and keep tsc happy with a valid module.
export default function AdminIndexPage() {
  redirect("/dashboard");
}
