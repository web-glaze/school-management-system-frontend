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