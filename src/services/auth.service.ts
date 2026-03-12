import { api } from "@/lib/api-client";
import { LoginResponse } from "@/types/auth";

export async function loginRequest(username: string, password: string) {
  const response = await api.post<LoginResponse>("/auth/login", {
    username,
    password,
  });

  return response.data;
}

export async function changePasswordRequest(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const response = await api.patch("/auth/change-password", data);
  return response.data;
}

export async function getMeRequest() {
  const response = await api.get("/auth/me");
  return response.data;
}