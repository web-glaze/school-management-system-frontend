/**
 * Location (campus tree) endpoints.
 *
 *   api.locations.list()
 *   api.locations.get(id)
 *   api.locations.create({ name, parentId? })
 *   api.locations.update(id, { name?, parentId? })
 *   api.locations.remove(id)              → cascades to children on the backend
 */

import { request } from "./client";

export interface Location {
  id: string;
  name: string;
  parentId?: string | null;
  locationCode?: string;
}

export const locations = {
  list() {
    return request.get<Location[]>("/api/locations");
  },
  get(id: string) {
    return request.get<Location>(`/api/locations/${id}`);
  },
  create(dto: { name: string; parentId?: string | null }) {
    return request.post<Location>("/api/locations", dto);
  },
  update(id: string, dto: { name?: string; parentId?: string | null }) {
    return request.patch<Location>(`/api/locations/${id}`, dto);
  },
  remove(id: string) {
    return request.delete<void>(`/api/locations/${id}`);
  },
};
