import apiClient from "./api";

export type ProfileEntity = "student" | "teacher";
export type ProfileFieldType = "TEXT" | "LONG_TEXT" | "NUMBER" | "DATE" | "DROPDOWN" | "YES_NO" | "MEDIA";
export type ProfileMediaType = "IMAGE" | "VIDEO";

export interface ProfileMedia {
  id: string;
  url: string;
  publicId: string;
  type: ProfileMediaType;
  createdAt: string;
}

export interface UploadedMedia {
  url: string;
  publicId: string;
  type: ProfileMediaType;
}

export interface TemplateField {
  id: string;
  sectionId: string;
  label: string;
  type: ProfileFieldType;
  options: string[] | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSection {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonProfileField {
  id: string;
  label: string;
  type: ProfileFieldType;
  options: string[] | null;
  displayOrder: number;
  isCustom: boolean;
  value: string | null;
  media: ProfileMedia[];
}

export interface PersonProfileSection {
  id: string;
  name: string;
  displayOrder: number;
  fields: PersonProfileField[];
}

export interface CreateProfileSectionPayload {
  name: string;
}

export interface UpdateProfileSectionPayload {
  name?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface CreateProfileFieldPayload {
  sectionId: string;
  label: string;
  type: ProfileFieldType;
  options?: string[];
}

export interface UpdateProfileFieldPayload {
  sectionId?: string;
  label?: string;
  options?: string[];
  isActive?: boolean;
  displayOrder?: number;
}

export interface SaveProfileValuesPayload {
  values: { fieldId: string; value: string | null }[];
}

const base = (entity: ProfileEntity) => `/academic/${entity}-profile`;

export const profileService = {
  getTemplate: (entity: ProfileEntity) => apiClient.get(`${base(entity)}/template`),

  createSection: (entity: ProfileEntity, data: CreateProfileSectionPayload) => apiClient.post(`${base(entity)}/template/sections`, data),

  updateSection: (entity: ProfileEntity, sectionId: string, data: UpdateProfileSectionPayload) => apiClient.patch(`${base(entity)}/template/sections/${sectionId}`, data),

  createTemplateField: (entity: ProfileEntity, data: CreateProfileFieldPayload) => apiClient.post(`${base(entity)}/template/fields`, data),

  updateTemplateField: (entity: ProfileEntity, fieldId: string, data: UpdateProfileFieldPayload) => apiClient.patch(`${base(entity)}/template/fields/${fieldId}`, data),

  getProfile: (entity: ProfileEntity, id: string) => apiClient.get(`${base(entity)}/${id}`),

  saveValues: (entity: ProfileEntity, id: string, data: SaveProfileValuesPayload) => apiClient.put(`${base(entity)}/${id}/values`, data),

  createCustomField: (entity: ProfileEntity, id: string, data: CreateProfileFieldPayload) => apiClient.post(`${base(entity)}/${id}/fields`, data),

  updateCustomField: (entity: ProfileEntity, id: string, fieldId: string, data: UpdateProfileFieldPayload) => apiClient.patch(`${base(entity)}/${id}/fields/${fieldId}`, data),

  addMedia: (entity: ProfileEntity, id: string, fieldId: string, files: UploadedMedia[]) => apiClient.post(`${base(entity)}/${id}/fields/${fieldId}/media`, { files }),

  removeMedia: (entity: ProfileEntity, id: string, mediaId: string) => apiClient.delete(`${base(entity)}/${id}/media/${mediaId}`),

  uploadMedia: async (entity: ProfileEntity, files: File[]): Promise<UploadedMedia[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await apiClient.post("/uploads/media", formData, {
      params: { folder: entity === "student" ? "students" : "teachers" },
      headers: { "Content-Type": "multipart/form-data" },
    });

    return (response.data?.data?.files ?? []) as UploadedMedia[];
  },
};