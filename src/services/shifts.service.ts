import { api } from "@/lib/api-client";
import { CreateShiftPayload, Shift, UpdateShiftPayload } from "@/types/shift";

export async function getShiftsRequest(params?: {
  date?: string;
  from?: string;
  to?: string;
}) {
  const response = await api.get<Shift[]>("/shifts", { params });
  return response.data;
}

export async function createShiftRequest(payload: CreateShiftPayload) {
  const response = await api.post<Shift>("/shifts", payload);
  return response.data;
}

export async function deleteShiftRequest(id: string) {
  const response = await api.delete<{ message: string }>(`/shifts/${id}`);
  return response.data;
}

export async function updateShiftRequest(payload: UpdateShiftPayload) {
  const { id, ...data } = payload;
  const response = await api.put<Shift>(`/shifts/${id}`, data);
  return response.data;
}
