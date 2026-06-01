/**
 * Complaint / ticket endpoints.
 *
 *   api.complaints.list()                    → all complaints (managers+)
 *   api.complaints.mine()                    → only the logged-in user's tickets
 *   api.complaints.get(id)                   → one ticket with items
 *   api.complaints.create(dto)               → single ticket (1+ items)
 *   api.complaints.createMany(dtos)          → bulk-create independent tickets
 *   api.complaints.update(id, patch)         → consolidated PATCH — pass any
 *                                              subset of { description,
 *                                              status, priority,
 *                                              assignedTechnicianId,
 *                                              managerRemark, ... }
 *   api.complaints.remove(id)                → soft delete
 *   api.complaints.setAdminImage(id, url)    → admin proof image
 *   api.complaints.removeImage(id)           → clear primary image
 *
 * Status / priority / assign each still have a sub-route on the backend for
 * backwards compatibility, but the consolidated `update()` should be used
 * from new code so one save fires one request.
 */

import { request } from "./client";

export interface ComplaintItem {
  id: string;
  description: string;
  priority: string;
  status?: string;
  imageUrl?: string | null;
}

export interface Complaint {
  id: string;
  ticketCode?: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: string;
  status: string;
  managerRemark?: string;
  technicianRemark?: string;
  imageUrl?: string | null;
  adminImageUrl?: string | null;
  createdAt: string;
  items?: ComplaintItem[];
  user?: { id: string; email: string };
  assignedTechnician?: { id: string; name: string };
}

export interface CreateComplaintItemDto {
  description: string;
  priority?: string;
  imageUrl?: string;
}

export interface CreateComplaintDto {
  locationType: string;
  subLocation: string;
  description?: string;
  priority?: string;
  imageUrl?: string;
  items?: CreateComplaintItemDto[];
}

export interface UpdateComplaintDto {
  description?: string;
  priority?: string;
  status?: string;
  assignedTechnicianId?: string | null;
  managerRemark?: string;
  technicianRemark?: string;
  adminImageUrl?: string | null;
  imageUrl?: string | null;
}

export const complaints = {
  list() {
    return request.get<Complaint[]>("/api/complaints");
  },
  mine() {
    return request.get<Complaint[]>("/api/complaints/my");
  },
  get(id: string) {
    return request.get<Complaint>(`/api/complaints/${id}`);
  },
  create(dto: CreateComplaintDto) {
    return request.post<Complaint>("/api/complaints", dto);
  },
  /** Fan-out: each dto becomes its own ticket with its own ticketCode. */
  createMany(dtos: CreateComplaintDto[]) {
    return request.post<{ count: number; tickets: Complaint[] }>(
      "/api/complaints/bulk",
      { tickets: dtos },
    );
  },
  update(id: string, patch: UpdateComplaintDto) {
    return request.patch<Complaint>(`/api/complaints/${id}`, patch);
  },
  remove(id: string) {
    return request.delete<void>(`/api/complaints/${id}`);
  },
  setAdminImage(id: string, adminImageUrl: string) {
    return request.patch<Complaint>(`/api/complaints/${id}/admin-image`, {
      adminImageUrl,
    });
  },
  removeImage(id: string) {
    return request.patch<Complaint>(`/api/complaints/${id}/remove-image`);
  },
};
