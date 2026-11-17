import { api } from "@/lib/api-client";
import { DemoProfilesResponse, LoginResponse } from "@/types/auth";

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

export async function demoProfilesRequest() {
  const response = await api.get<DemoProfilesResponse>("/demo/profiles");
  return response.data;
}

export async function demoLoginRequest(profile: string) {
  const response = await api.post<LoginResponse>("/demo/login", { profile });
  return response.data;
}
