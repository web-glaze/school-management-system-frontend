"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function usePermission(permission: string) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const allowed =
      user?.permissions?.includes(permission);

    if (!allowed) {
      router.replace("/403");
      return;
    }

    setAuthorized(true);
  }, [permission, router]);

  return authorized;
}

/**
 * Same check as usePermission, but it never redirects. Use it for the
 * optional buttons on a page (create / edit / delete ...), so a user who
 * can only read the page is not sent to /403 for lacking those.
 */
export function useHasPermission(permission: string) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setAllowed(Boolean(user?.permissions?.includes(permission)));
    } catch {
      setAllowed(false);
    }
  }, [permission]);

  return allowed;
}
