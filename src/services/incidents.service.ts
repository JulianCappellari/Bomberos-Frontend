import { api } from "@/lib/api-client";
import {
  CreateIncidentPayload,
  Incident,
  IncidentStatus,
  UpdateIncidentPayload,
} from "@/types/incident";

export async function getIncidentsRequest(params?: {
  status?: IncidentStatus;
}) {
  const response = await api.get<Incident[]>("/incidents", { params });
  return response.data;
}

export async function createIncidentRequest(payload: CreateIncidentPayload) {
  const response = await api.post<Incident>("/incidents", payload);
  return response.data;
}

export async function updateIncidentRequest(payload: UpdateIncidentPayload) {
  const { id, ...data } = payload;
  const response = await api.patch<Incident>(`/incidents/${id}`, data);
  return response.data;
}

export async function closeIncidentRequest(id: string) {
  const response = await api.patch<Incident>(`/incidents/${id}/close`);
  return response.data;
}

export async function assignIncidentUsersRequest(payload: {
  id: string;
  userIds: string[];
}) {
  const response = await api.post<Incident>(
    `/incidents/${payload.id}/assign-users`,
    { userIds: payload.userIds },
  );

  return response.data;
}
