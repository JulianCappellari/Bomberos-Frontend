import { api } from "@/lib/api-client";
import {
  CreateInspectionPayload,
  InspectionHistoryEntry,
} from "@/types/inspection";

export async function createInspection(payload: CreateInspectionPayload) {
  const { data } = await api.post<InspectionHistoryEntry>(
    "/inspections",
    payload,
  );
  return data;
}

export async function getVehicleInspectionHistory(vehicleId: string, page: number) {
  const { data } = await api.get<InspectionHistoryEntry[]>(
    `/inspections/vehicle/${vehicleId}/history`,
    { params: { page } },
  );
  return data;
}
