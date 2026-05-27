"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /portal — legacy URL. The canonical complaint-raising flow is /raise-ticket.
 * This page just redirects so any old bookmark still works.
 */
export default function PortalRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/raise-ticket");
  }, [router]);
  return null;
}
