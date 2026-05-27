"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export interface UploadedFile {
  url: string;
  publicId: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  driver?: string;
}

interface PhotoUploadProps {
  /** Currently uploaded photos */
  value: UploadedFile[];
  /** Called when photos are added/removed */
  onChange: (files: UploadedFile[]) => void;
  /** Max number of photos allowed */
  max?: number;
  /** Subfolder on backend storage */
  folder?: string;
  /** Disable interaction */
  disabled?: boolean;
}

/**
 * Reusable photo upload component.
 *
 * Calls POST /api/uploads/images with multipart/form-data.
 * Backend returns { count, files: [{url, publicId, ...}] }.
 * URLs may be relative (local storage) or absolute (Cloudinary).
 */
export function PhotoUpload({
  value,
  onChange,
  max = 5,
  disabled,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${max} photos allowed`);
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);

    // Validate
    for (const f of toUpload) {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) {
        toast.error(`${f.name}: only JPEG, PNG, WEBP, GIF allowed`);
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: max 5 MB per image`);
        return;
      }
    }

    const fd = new FormData();
    toUpload.forEach((f) => fd.append("files", f));

    try {
      setUploading(true);
      const res = await api.post("/api/uploads/images", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Response is wrapped by TransformInterceptor: { data: { count, files } }
      // Or raw on direct: { count, files }
      const body = res.data?.data ?? res.data;
      const newFiles: UploadedFile[] = body?.files ?? [];
      onChange([...value, ...newFiles]);
      toast.success(`${newFiles.length} photo${newFiles.length > 1 ? "s" : ""} uploaded`);
    } catch (err: unknown) {
      const msg =
        (err as { displayMessage?: string })?.displayMessage ||
        "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = (publicId: string) => {
    onChange(value.filter((f) => f.publicId !== publicId));
  };

  /** Resolve URL — prefix relative paths with API base for local storage. */
  const resolveUrl = (url: string) =>
    url.startsWith("http") ? url : `${apiBase}${url}`;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {value.map((f) => (
          <div
            key={f.publicId}
            className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveUrl(f.url)}
              alt={f.originalName ?? "attachment"}
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(f.publicId)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition shadow-lg"
                title="Remove"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {value.length < max && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center text-gray-500 transition disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs">Uploading...</span>
              </>
            ) : (
              <>
                <span className="text-3xl mb-1">📷</span>
                <span className="text-xs font-semibold">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        {value.length}/{max} photos · JPG, PNG, WEBP, GIF · max 5 MB each
      </p>
    </div>
  );
}

/** Read-only photo gallery for displaying complaint attachments. */
export function PhotoGallery({ files }: { files: UploadedFile[] }) {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const resolveUrl = (url: string) =>
    url.startsWith("http") ? url : `${apiBase}${url}`;

  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!files || files.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {files.map((f) => (
          <button
            key={f.publicId}
            type="button"
            onClick={() => setLightbox(resolveUrl(f.url))}
            className="aspect-square rounded-2xl overflow-hidden border border-gray-100 hover:border-blue-400 transition cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveUrl(f.url)}
              alt={f.originalName ?? "attachment"}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="full"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/20 text-white text-xl"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
