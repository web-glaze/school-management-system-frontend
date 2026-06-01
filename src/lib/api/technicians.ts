/**
 * Technician CRUD endpoints.
 *
 *   api.technicians.list()                   → all techs in the current school
 *   api.technicians.get(id)
 *   api.technicians.create({ name, phone?, email?, departmentId? })
 *   api.technicians.update(id, patch)
 *   api.technicians.remove(id)               → soft delete (isActive=false)
 */

import { request } from "./client";

export type TechnicianPosition =
  | "HEAD"
  | "SUB_HEAD"
  | "OFFICER"
  | "TECHNICIAN"
  | "HELPER";

export interface Technician {
  id: string;
  technicianCode?: string;
  name: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  department?: {
    id: string;
    name: string;
    departmentCode?: string;
  };
  // Org-chart fields
  position?: TechnicianPosition | null;
  reportsToId?: string | null;
  reportsTo?: {
    id: string;
    name: string;
    position?: string | null;
  } | null;
  reports?: Array<{
    id: string;
    name: string;
    position?: string | null;
  }>;
}

export interface UpsertTechnicianDto {
  name: string;
  phone?: string;
  email?: string;
  departmentId?: string;
  position?: TechnicianPosition;
  reportsToId?: string | null;
  /**
   * Provide together with email to also create a User login account
   * with role TECHNICIAN. Optional — leave out for a non-login profile.
   */
  password?: string;
}

export const technicians = {
  list() {
    return request.get<Technician[]>("/api/technicians");
  },
  get(id: string) {
    return request.get<Technician>(`/api/technicians/${id}`);
  },
  create(dto: UpsertTechnicianDto) {
    return request.post<Technician>("/api/technicians", dto);
  },
  update(id: string, dto: Partial<UpsertTechnicianDto>) {
    return request.patch<Technician>(`/api/technicians/${id}`, dto);
  },
  remove(id: string) {
    return request.delete<void>(`/api/technicians/${id}`);
  },
  /**
   * Set / reset the login password for the technician's linked User
   * (matched by email). Creates the User if it doesn't yet exist.
   */
  setPassword(id: string, newPassword: string) {
    return request.patch<{ ok: true; userId: string }>(
      `/api/technicians/${id}/password`,
      { newPassword },
    );
  },
};
