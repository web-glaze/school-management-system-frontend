import apiClient from "./api";

type UserPayload = {
  name: string;
  userName: string;
  email?: string;
  phone?: string | null;
  password?: string;
};

export const userService = {
  getAll: () => apiClient.get("/users"),

  create: (data: UserPayload) => apiClient.post("/users", data),

  update: (id: string, data: UserPayload) => apiClient.patch(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete(`/users/${id}`),

  changePassword: (id: string, newPassword: string) => apiClient.patch(`/users/${id}/password`, { newPassword }),

  updateProfile: (data: UserPayload) => apiClient.patch("/users/profile", data),

  changeMyPassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch("/users/profile/password", {
      currentPassword,
      newPassword,
    }),
};
