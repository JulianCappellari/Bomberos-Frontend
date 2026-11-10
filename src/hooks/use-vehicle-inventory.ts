"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInventoryItemRequest,
  createVehicleCompartmentRequest,
  deleteInventoryItemRequest,
  getVehicleInventoryRequest,
  updateInventoryItemRequest,
} from "@/services/equipment.service";
import {
  CreateInventoryItemPayload,
  CreateVehicleCompartmentPayload,
  UpdateInventoryItemPayload,
} from "@/types/equipment";

export function useVehicleInventory(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicle-inventory", vehicleId],
    queryFn: () => getVehicleInventoryRequest(vehicleId),
    enabled: !!vehicleId,
  });
}

export function useCreateVehicleCompartment(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVehicleCompartmentPayload) =>
      createVehicleCompartmentRequest(vehicleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useCreateInventoryItem(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      compartmentId,
      payload,
    }: {
      compartmentId: string;
      payload: CreateInventoryItemPayload;
    }) => createInventoryItemRequest(compartmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateInventoryItem(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: UpdateInventoryItemPayload;
    }) => updateInventoryItemRequest(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useDeleteInventoryItem(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, revision }: { itemId: string; revision: number }) => deleteInventoryItemRequest(itemId, revision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
