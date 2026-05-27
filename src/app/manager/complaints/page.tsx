"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Manager uses the same powerful complaints management as admin —
// just redirect to /admin/complaints (it's role-protected to allow manager).
export default function ManagerComplaintsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/complaints");
  }, [router]);
  return null;
}
