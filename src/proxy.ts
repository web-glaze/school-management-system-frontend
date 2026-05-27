import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Centralized auth guard — runs for every request matching `config.matcher`.
 *
 * Next.js 16 renamed `middleware.ts` → `proxy.ts` and the exported function
 * must be named `proxy` (or be the default export).
 *
 * Note: We currently store the JWT in localStorage from the client side,
 * so the proxy can only do a soft check using a non-httpOnly cookie mirror.
 * The actual hard auth check still happens on the backend for every API call
 * (via interceptor + 401 redirect).
 *
 * To make this fully server-side later, switch the backend to set the
 * access token as an httpOnly cookie and read it here directly.
 */

const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/manager",
  "/technician",
  "/user",
  "/raise-ticket",
  "/my-complaints",
  "/portal",
  "/new",
];

const PUBLIC_ONLY = ["/login"];

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Cookie mirror (optional — once backend writes it on login)
  const token = req.cookies.get("access_token")?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  // If a logged-in user (cookie present) hits /login, push them to dashboard.
  if (PUBLIC_ONLY.includes(path) && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If a guest hits a protected page, redirect to /login.
  // We only redirect when there is *no* token cookie — the client side
  // will still verify the localStorage token & redirect on 401.
  if (isProtected && !token) {
    // Allow through — client-side guard inside the page (axios 401 handler)
    // will redirect. This avoids an aggressive redirect loop when only
    // localStorage is used.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next/static
     * - _next/image
     * - favicon, public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
