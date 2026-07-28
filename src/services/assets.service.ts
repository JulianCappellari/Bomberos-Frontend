import { api } from "@/lib/api-client";
import {
  Asset,
  CreateAssetPayload,
  UpdateAssetPayload,
  UpsertVehiclePayload,
} from "@/types/asset";

export async function getAssetsRequest() {
  const response = await api.get<Asset[]>("/assets");
  return response.data;
}

export async function getAssetByIdRequest(id: string) {
  const response = await api.get<Asset>(`/assets/${id}`);
  return response.data;
}

export async function createAssetRequest(payload: CreateAssetPayload) {
  const response = await api.post<Asset>("/assets", payload);
  return response.data;
}

export async function updateAssetRequest(id: string, payload: UpdateAssetPayload) {
  const response = await api.put<Asset>(`/assets/${id}`, payload);
  return response.data;
}

export async function upsertVehicleDataRequest(
  id: string,
  payload: UpsertVehiclePayload
) {
  const response = await api.put(`/assets/${id}/vehicle`, payload);
  return response.data;
}

export async function deleteAssetRequest(id: string) {
  const response = await api.delete(`/assets/${id}`);
  return response.data;
}