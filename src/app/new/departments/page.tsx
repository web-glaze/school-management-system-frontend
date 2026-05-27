"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /new/departments — legacy URL. Canonical page is /admin/departments.
 */
export default function NewDepartmentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/departments");
  }, [router]);
  return null;
}
