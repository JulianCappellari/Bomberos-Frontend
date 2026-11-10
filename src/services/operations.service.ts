import { api } from "@/lib/api-client";
import { AvailabilityInput, AvailabilityRecord, MaintenanceInput, MaintenanceJob, MaintenanceStatus, DocumentInput, OperationalDocument, DocumentKind, DocumentStatus } from "@/types/operations";

export async function getAvailabilityRequest(date: string) {
  return (await api.get<AvailabilityRecord[]>("/operations/availability", { params: { date } })).data;
}
export async function saveAvailabilityRequest(input: AvailabilityInput) {
  return (await api.put<AvailabilityRecord>("/operations/availability", input)).data;
}
export async function getMaintenanceRequest(assetId?: string) {
  return (await api.get<MaintenanceJob[]>("/operations/maintenance", { params: { assetId: assetId || undefined } })).data;
}
export async function createMaintenanceRequest(input: MaintenanceInput) {
  return (await api.post<MaintenanceJob>("/operations/maintenance", input)).data;
}
export async function transitionMaintenanceRequest(input: {
  id: string; revision: number; status: Exclude<MaintenanceStatus, "OPEN">; resolution?: string; costCents?: number | null;
}) {
  const { id, ...data } = input;
  return (await api.patch<MaintenanceJob>(`/operations/maintenance/${id}/status`, data)).data;
}
export async function getDocumentsRequest(params: { kind?: DocumentKind; status?: DocumentStatus }) {
  return (await api.get<OperationalDocument[]>("/operations/documents", { params })).data;
}
export async function saveDocumentRequest(input: DocumentInput & { id?: string; revision?: number }) {
  const { id, ...body } = input;
  return id
    ? (await api.put<OperationalDocument>(`/operations/documents/${id}`, body)).data
    : (await api.post<OperationalDocument>("/operations/documents", body)).data;
}
export async function transitionDocumentRequest(input: { id: string; revision: number; status: "PUBLISHED" | "ARCHIVED" }) {
  const { id, ...body } = input;
  return (await api.patch<OperationalDocument>(`/operations/documents/${id}/status`, body)).data;
}
