"use client";

import { useEffect, useState } from "react";

/**
 * Tells a page whether the logged-in account is a student/parent login and,
 * if so, which student it belongs to. Read-only pages use it to hide
 * selectors and edit controls. The backend still enforces the scoping.
 */
export function useStudentScope() {
  const [scope, setScope] = useState<{
    ready: boolean;
    isStudent: boolean;
    studentId: string | null;
  }>({ ready: false, isStudent: false, studentId: null });

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];

      setScope({
        ready: true,
        isStudent: roles.includes("STUDENT"),
        studentId: user?.studentId ?? null,
      });
    } catch {
      setScope({ ready: true, isStudent: false, studentId: null });
    }
  }, []);

  return scope;
}
