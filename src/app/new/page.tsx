"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /new — legacy shadcn template page. Redirect to dashboard.
 */
export default function NewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
