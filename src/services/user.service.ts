import { api } from "@/lib/api-client";
import { User, UserRosterItem } from "@/types/user";

export async function getUsersRequest() {
  const response = await api.get<User[]>("/users");
  return response.data;
}

export async function getUserRosterRequest() {
  const response = await api.get<UserRosterItem[]>("/users/roster");
  return response.data;
}

export async function getUserByIdRequest(id: string) {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

export async function createUserRequest(data: {
  username: string;
  email?: string;
  password: string;
  role: "ADMIN" | "FIREFIGHTER" | "OPERATOR";
}) {
  const response = await api.post("/users", data);
  return response.data;
}

export async function updateUserRequest(
  id: string,
  data: Partial<{
    username: string;
    email: string;
    role: "ADMIN" | "FIREFIGHTER" | "OPERATOR";
    isActive: boolean;
  }>
) {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
}
