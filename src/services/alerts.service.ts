import { api } from "@/lib/api-client";

export type BackendAlert = {
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
      firstName?: string | null;
      lastName?: string | null;
    } | null;
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