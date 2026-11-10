import { api } from "@/lib/api-client";
import {
  CreateInventoryItemPayload,
  CreateVehicleCompartmentPayload,
  UpdateInventoryItemPayload,
  VehicleCompartment,
  VehicleInventoryItem,
  VehicleInventoryResponse,
} from "@/types/equipment";

export async function getVehicleInventoryRequest(vehicleId: string) {
  const response = await api.get<VehicleInventoryResponse>(
    `/equipment/vehicles/${vehicleId}/inventory`
  );
  return response.data;
}

export async function createVehicleCompartmentRequest(
  vehicleId: string,
  payload: CreateVehicleCompartmentPayload,
) {
  const response = await api.post<VehicleCompartment>(
    `/equipment/vehicles/${vehicleId}/compartments`,
    payload,
  );
  return response.data;
}

export async function createInventoryItemRequest(
  compartmentId: string,
  payload: CreateInventoryItemPayload,
) {
  const response = await api.post<VehicleInventoryItem>(
    `/equipment/compartments/${compartmentId}/items`,
    payload,
  );
  return response.data;
}

export async function updateInventoryItemRequest(
  itemId: string,
  payload: UpdateInventoryItemPayload,
) {
  const response = await api.patch<VehicleInventoryItem>(
    `/equipment/items/${itemId}`,
    payload,
  );
  return response.data;
}

export async function deleteInventoryItemRequest(itemId: string, revision: number) {
  const response = await api.delete<{ message: string }>(
    `/equipment/items/${itemId}`,
    { data: { revision } },
  );
  return response.data;
}
