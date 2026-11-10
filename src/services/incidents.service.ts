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

export async function dispatchIncidentFromAlertRequest(payload: {
  alertId: string;
  autoAssignResponders?: boolean;
}) {
  const response = await api.post<Incident>(
    `/incidents/from-alert/${payload.alertId}`,
    { autoAssignResponders: payload.autoAssignResponders ?? true },
  );
  return response.data;
}

export async function updateIncidentRequest(payload: UpdateIncidentPayload) {
  const { id, ...data } = payload;
  const response = await api.patch<Incident>(`/incidents/${id}`, data);
  return response.data;
}

export async function closeIncidentRequest(payload: {
  id: string;
  closingReport: string;
  responseTimeMinutes?: number;
}) {
  const { id, ...data } = payload;
  const response = await api.patch<Incident>(`/incidents/${id}/close`, data);
  return response.data;
}

export async function createIncidentUpdateRequest(payload: { id: string; body: string }) {
  const response = await api.post(`/incidents/${payload.id}/updates`, { body: payload.body });
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
