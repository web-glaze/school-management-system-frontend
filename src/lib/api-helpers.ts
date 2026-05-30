/**
 * Small helpers shared across maintenance pages.
 *
 * unwrapList — backend endpoints return either `{ data: T[] }` or `T[]`
 * depending on the controller. This helper hides the inconsistency at the
 * call site so pages don't all repeat the same `Array.isArray ? a : a.data`
 * branch.
 *
 * unwrap — same idea for single-object responses (e.g. POST replies).
 *
 * logError — non-fatal client error sink. Today it goes to console.error
 * gated by NODE_ENV; swap in Sentry/posthog later without touching pages.
 */

export function unwrapList<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "data" in payload) {
    const inner = (payload as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

export function unwrap<T = unknown>(payload: unknown): T | null {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data: T }).data ?? null) as T | null;
  }
  return (payload as T) ?? null;
}

type AnyAxiosError = {
  isAxiosError?: boolean;
  response?: { status?: number; data?: unknown };
  message?: string;
};

export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === "production") {
    // TODO: wire to Sentry / posthog / server log.
    return;
  }
  const err = error as AnyAxiosError;
  // eslint-disable-next-line no-console
  console.error(
    `[${context}]`,
    err?.response?.status ?? "",
    err?.response?.data ?? err?.message ?? error,
  );
}
