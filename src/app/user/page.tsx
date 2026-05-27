"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /user — legacy URL. Normal users land on /dashboard.
 */
export default function UserRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
