"use client";

import { create } from "zustand";

interface UiState {
  // Mobile sidebar drawer
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // Notification dropdown
  notificationsOpen: boolean;
  toggleNotifications: () => void;
  closeNotifications: () => void;
}

/**
 * UI store — ephemeral UI state shared across components.
 * Not persisted (resets on reload).
 */
export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  notificationsOpen: false,
  toggleNotifications: () =>
    set((s) => ({ notificationsOpen: !s.notificationsOpen })),
  closeNotifications: () => set({ notificationsOpen: false }),
}));
