import { api } from "@/lib/api-client";

export type BackendAlert = {
  viewerIsRecipient?: boolean;
  id: string;
  type: "FIRE" | "RESCUE" | "ACCIDENT" | "CHEMICAL" | "MEDICAL" | "FLOOD" | "OTHER";
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "RESOLVED" | "CANCELLED";
  title?: string | null;
  description?: string | null;
  location: string;
  contactPhone?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    username: string;
    profile?: {
      fullName?: string | null;
    } | null;
  } | null;
  responses?: Array<{
    id: string;
    response: "GOING" | "NOT_GOING";
    attendanceOutcome?: "NO_SHOW" | null;
    userId: string;
    respondedAt: string;
  }>;
  incident?: {
    id: string;
    title: string;
    status: "OPEN" | "CLOSED";
  } | null;
};

export async function getAlertsRequest() {
  const response = await api.get<BackendAlert[]>("/alerts");
  return response.data;
}

export async function createAlertRequest(payload: {
  type: "FIRE" | "RESCUE" | "ACCIDENT" | "CHEMICAL" | "MEDICAL" | "FLOOD" | "OTHER";
  priority: "HIGH" | "MEDIUM" | "LOW";
  description?: string;
  location: string;
  contactPhone?: string;
}) {
  const response = await api.post("/alerts", payload);
  return response.data;
}

export async function resolveAlertRequest(id: string) {
  const response = await api.patch(`/alerts/${id}/resolve`);
  return response.data;
}

export async function cancelAlertRequest(payload: { id: string; reason: string }) {
  const response = await api.patch(`/alerts/${payload.id}/cancel`, { reason: payload.reason });
  return response.data;
}

export async function respondAlertRequest(payload: {
  id: string;
  response: "GOING" | "NOT_GOING";
}) {
  const response = await api.post(`/alerts/${payload.id}/respond`, {
    response: payload.response,
  });
  return response.data;
}
