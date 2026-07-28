"use client";

import { useQuery } from "@tanstack/react-query";
import { getVehicleInspectionHistory } from "@/services/inspections.service";

export function useVehicleInspectionHistory(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicle-inspection-history", vehicleId],
    queryFn: () => getVehicleInspectionHistory(vehicleId),
    enabled: !!vehicleId,
  });
}
