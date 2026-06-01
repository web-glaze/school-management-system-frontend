/**
 * Resolve an upload URL coming back from the backend into something the
 * <img src="..."> attribute can actually load.
 *
 * The backend's local storage driver returns paths like
 * `/uploads/general/abc.png`. The frontend runs on a different port
 * (3001) and has no such files, so the browser 404s. We prefix any
 * relative `/uploads/...` path with NEXT_PUBLIC_API_URL so it hits the
 * backend at port 3000.
 *
 * Cloudinary URLs already start with https:// so they pass through.
 */
export function imageUrl(raw?: string | null): string {
  if (!raw) return "";
  // Already absolute (Cloudinary / S3 / external).
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  // Relative path served by the backend's static /uploads middleware.
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  // Strip trailing slash from base, leading slash from raw, then join.
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = raw.startsWith("/") ? raw : `/${raw}`;
  return `${cleanBase}${cleanPath}`;
}
