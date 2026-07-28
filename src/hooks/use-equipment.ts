"use client";

import { useQuery } from "@tanstack/react-query";
import { getVehicleInventoryRequest } from "@/services/equipment.service";

export function useVehicleInventory(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicle-inventory", vehicleId],
    queryFn: () => getVehicleInventoryRequest(vehicleId),
    enabled: !!vehicleId,
  });
}