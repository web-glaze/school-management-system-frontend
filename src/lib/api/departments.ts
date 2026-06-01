/**
 * Department CRUD endpoints.
 *
 *   api.departments.list()
 *   api.departments.get(id)
 *   api.departments.create({ name })
 *   api.departments.update(id, { name })
 *   api.departments.remove(id)
 */

import { request } from "./client";

export interface TeamMemberStats {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

export interface DepartmentTeamMember {
  id: string;
  name: string;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  reportsToId?: string | null;
  stats: TeamMemberStats;
}

export interface Department {
  id: string;
  name: string;
  departmentCode?: string;
  // Hierarchy
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  children?: Array<{
    id: string;
    name: string;
    _count?: { technicians?: number };
  }>;
  // Head of department
  headTechnicianId?: string | null;
  headTechnician?: {
    id: string;
    name: string;
    position?: string | null;
    email?: string | null;
  } | null;
  // Counts the backend may include with the list
  _count?: {
    technicians?: number;
    children?: number;
  };
  // Only on findOne — full team with per-tech ticket stats.
  technicians?: DepartmentTeamMember[];
}

export interface UpsertDepartmentDto {
  name: string;
  parentId?: string | null;
  headTechnicianId?: string | null;
  departmentCode?: string;
}

export const departments = {
  list() {
    return request.get<Department[]>("/api/departments");
  },
  get(id: string) {
    return request.get<Department>(`/api/departments/${id}`);
  },
  create(dto: UpsertDepartmentDto) {
    return request.post<Department>("/api/departments", dto);
  },
  update(id: string, dto: Partial<UpsertDepartmentDto>) {
    return request.patch<Department>(`/api/departments/${id}`, dto);
  },
  remove(id: string) {
    return request.delete<void>(`/api/departments/${id}`);
  },
};
