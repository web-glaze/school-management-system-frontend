import { create } from "zustand";
import {
  profileService,
  ProfileEntity,
  TemplateSection,
  PersonProfileSection,
  CreateProfileSectionPayload,
  UpdateProfileSectionPayload,
  CreateProfileFieldPayload,
  UpdateProfileFieldPayload,
  SaveProfileValuesPayload,
  UploadedMedia,
} from "@/services/profile.service";

interface ProfileStore {
  templates: Record<ProfileEntity, TemplateSection[]>;
  profile: PersonProfileSection[];
  templateLoading: boolean;
  profileLoading: boolean;

  fetchTemplate: (entity: ProfileEntity) => Promise<void>;
  createSection: (entity: ProfileEntity, data: CreateProfileSectionPayload) => Promise<void>;
  updateSection: (entity: ProfileEntity, sectionId: string, data: UpdateProfileSectionPayload) => Promise<void>;
  createTemplateField: (entity: ProfileEntity, data: CreateProfileFieldPayload) => Promise<void>;
  updateTemplateField: (entity: ProfileEntity, fieldId: string, data: UpdateProfileFieldPayload) => Promise<void>;

  fetchProfile: (entity: ProfileEntity, id: string, silent?: boolean) => Promise<void>;
  saveValues: (entity: ProfileEntity, id: string, data: SaveProfileValuesPayload) => Promise<void>;
  createCustomField: (entity: ProfileEntity, id: string, data: CreateProfileFieldPayload) => Promise<void>;
  updateCustomField: (entity: ProfileEntity, id: string, fieldId: string, data: UpdateProfileFieldPayload) => Promise<void>;
  addMedia: (entity: ProfileEntity, id: string, fieldId: string, files: UploadedMedia[]) => Promise<void>;
  removeMedia: (entity: ProfileEntity, id: string, mediaId: string) => Promise<void>;

  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  templates: { student: [], teacher: [] },
  profile: [],
  templateLoading: false,
  profileLoading: false,

  // ======================
  // Template
  // ======================

  fetchTemplate: async (entity) => {
    try {
      set({ templateLoading: true });

      const response = await profileService.getTemplate(entity);

      set((state) => ({
        templates: { ...state.templates, [entity]: response.data.data ?? [] },
      }));
    } catch (error) {
      console.error("Failed to fetch profile template", error);
      throw error;
    } finally {
      set({ templateLoading: false });
    }
  },

  createSection: async (entity, data) => {
    await profileService.createSection(entity, data);
    await get().fetchTemplate(entity);
  },

  updateSection: async (entity, sectionId, data) => {
    await profileService.updateSection(entity, sectionId, data);
    await get().fetchTemplate(entity);
  },

  createTemplateField: async (entity, data) => {
    await profileService.createTemplateField(entity, data);
    await get().fetchTemplate(entity);
  },

  updateTemplateField: async (entity, fieldId, data) => {
    await profileService.updateTemplateField(entity, fieldId, data);
    await get().fetchTemplate(entity);
  },

  // ======================
  // One person's profile
  // ======================

  fetchProfile: async (entity, id, silent = false) => {
    try {
      if (!silent) set({ profileLoading: true });

      const response = await profileService.getProfile(entity, id);

      set({ profile: response.data.data ?? [] });
    } catch (error) {
      console.error("Failed to fetch profile", error);
      throw error;
    } finally {
      if (!silent) set({ profileLoading: false });
    }
  },

  saveValues: async (entity, id, data) => {
    await profileService.saveValues(entity, id, data);
    await get().fetchProfile(entity, id, true);
  },

  createCustomField: async (entity, id, data) => {
    await profileService.createCustomField(entity, id, data);
    await get().fetchProfile(entity, id, true);
  },

  updateCustomField: async (entity, id, fieldId, data) => {
    await profileService.updateCustomField(entity, id, fieldId, data);
    await get().fetchProfile(entity, id, true);
  },

  addMedia: async (entity, id, fieldId, files) => {
    await profileService.addMedia(entity, id, fieldId, files);
    await get().fetchProfile(entity, id, true);
  },

  removeMedia: async (entity, id, mediaId) => {
    await profileService.removeMedia(entity, id, mediaId);
    await get().fetchProfile(entity, id, true);
  },

  clearProfile: () => set({ profile: [] }),
}));