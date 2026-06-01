/**
 * File upload endpoints.
 *
 *   api.uploads.image(file)          → POST /api/uploads/image
 *                                      → { url, ... } returned by backend
 *   api.uploads.images(files[])      → POST /api/uploads/images (max 5)
 *
 * Defensive response handling: backend has historically returned either
 * { data: { url } } or { url } directly — the unwrap helper here works for
 * both so callers can just read `.url`.
 */

import { request } from "./client";

export interface UploadedFile {
  url: string;
  path?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
}

function singleFromAnyShape(raw: unknown): UploadedFile {
  if (!raw || typeof raw !== "object") {
    throw new Error("Upload succeeded but server returned no payload");
  }
  // Already-unwrapped shape: { url, ... }
  if ("url" in raw) return raw as UploadedFile;
  // Wrapped shape: { data: { url, ... } }
  if ("data" in raw && (raw as { data: { url?: string } }).data?.url) {
    return (raw as { data: UploadedFile }).data;
  }
  throw new Error("Upload succeeded but no URL in response");
}

export const uploads = {
  async image(file: File): Promise<UploadedFile> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await request.upload<unknown>("/api/uploads/image", fd);
    return singleFromAnyShape(res);
  },
  async images(files: File[]): Promise<UploadedFile[]> {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    const res = await request.upload<{ files: UploadedFile[] }>(
      "/api/uploads/images",
      fd,
    );
    return res?.files ?? [];
  },
};
