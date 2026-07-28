"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssetRequest,
  deleteAssetRequest,
  getAssetByIdRequest,
  getAssetsRequest,
  updateAssetRequest,
  upsertVehicleDataRequest,
} from "@/services/assets.service";
import { CreateAssetPayload, UpdateAssetPayload, UpsertVehiclePayload } from "@/types/asset";

export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: getAssetsRequest,
  });
}

export function useAsset(vehicleId: string) {
  return useQuery({
    queryKey: ["asset", vehicleId],
    queryFn: () => getAssetByIdRequest(vehicleId),
    enabled: !!vehicleId,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAssetPayload) => createAssetRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useUpdateAsset(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAssetPayload) =>
      updateAssetRequest(vehicleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset", vehicleId] });
    },
  });
}

export function useUpsertVehicleData(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertVehiclePayload) =>
      upsertVehicleDataRequest(vehicleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset", vehicleId] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAssetRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}