/**
 * Public API surface for the entire frontend.
 *
 * Usage from any page / component:
 *
 *   import { api } from "@/lib/api";
 *   const tickets = await api.complaints.list();
 *   await api.complaints.update(id, { status: "RESOLVED" });
 *
 * Everything goes through this one entry point. Don't import axios directly
 * anywhere else in the codebase — if you need a new endpoint, add it to the
 * corresponding domain file (auth.ts / complaints.ts / ...) and it'll be
 * available here automatically.
 *
 * The client already handles:
 *   • baseURL from NEXT_PUBLIC_API_URL
 *   • Bearer token injection from localStorage
 *   • Auto-unwrap of { data } envelope
 *   • 401 → redirect to /login
 *
 * For UI side effects (toast on success / error), wrap the call at the
 * component level with `notify.promise(...)` or notify.error/success after
 * try/catch. The API layer itself stays presentation-agnostic.
 */

import { auth } from "./auth";
import { complaints } from "./complaints";
import { departments } from "./departments";
import { locations } from "./locations";
import { roles } from "./roles";
import { technicians } from "./technicians";
import { uploads } from "./uploads";
import { users } from "./users";

export const api = {
  auth,
  complaints,
  departments,
  locations,
  roles,
  technicians,
  uploads,
  users,
};

// Re-export types so pages don't have to dig into individual files.
export type {
  AuthUser,
  LoginResponse,
} from "./auth";
export type {
  Complaint,
  ComplaintItem,
  CreateComplaintDto,
  CreateComplaintItemDto,
  TicketTransfer,
  UpdateComplaintDto,
} from "./complaints";
export type { Department } from "./departments";
export type { Location } from "./locations";
export type { Permission, Role } from "./roles";
export type { Technician, UpsertTechnicianDto } from "./technicians";
export type { UploadedFile } from "./uploads";
export type { User } from "./users";
