/**
 * Thin wrapper around react-hot-toast so call sites read like a story:
 *   notify.success("Ticket updated");
 *   notify.error("Couldn't load departments");
 *
 * Centralising the wrapper means we can later swap out the toast library
 * (sonner, radix toast, whatever) without touching every page.
 */

import toast from "react-hot-toast";

type Falsy = false | 0 | "" | null | undefined;

function pickMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const resp = (err as { response?: { data?: { message?: unknown } } }).response;
    const msg = resp?.data?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
    if (Array.isArray(msg)) return msg.join(", ");
  }
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}

export const notify = {
  success(message: string): void {
    toast.success(message, { duration: 2500 });
  },
  /**
   * Show an error. Pass an axios/Error object and the helper picks the
   * server message; pass a plain string for full control.
   */
  error(messageOrError: string | unknown, fallback = "Something went wrong"): void {
    const text =
      typeof messageOrError === "string"
        ? messageOrError
        : pickMessage(messageOrError, fallback);
    toast.error(text, { duration: 3500 });
  },
  info(message: string): void {
    toast(message, { duration: 2500 });
  },
  /**
   * For async ops — gives the user a spinner while in flight, swaps to
   * a success/error toast when the promise settles.
   *   await notify.promise(api.save(), {
   *     loading: "Saving…", success: "Saved", error: "Save failed",
   *   });
   */
  async promise<T>(
    p: Promise<T>,
    opts: { loading: string; success: string; error: string },
  ): Promise<T> {
    return toast.promise(p, opts);
  },
};

// Re-export the base toast for the (rare) place that needs custom rendering.
export { toast };

export type { Falsy };
