import apiClient from "./api";

export const userService = {
  getAll: () => apiClient.get("/users"),

  create: (data: any) => apiClient.post("/users", data),

  update: (id: string, data: any) => apiClient.patch(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete(`/users/${id}`),

  changePassword: (id: string, newPassword: string) => apiClient.patch(`/users/${id}/password`, { newPassword }),

  updateProfile: (data: any) => apiClient.patch("/users/profile", data),

  changeMyPassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch("/users/profile/password", {
      currentPassword,
      newPassword,
    }),
};
