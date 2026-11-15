"use client";

import { useQuery } from "@tanstack/react-query";
import { getVehicleInspectionHistory } from "@/services/inspections.service";

export function useVehicleInspectionHistory(vehicleId: string, page = 1) {
  return useQuery({
    queryKey: ["vehicle-inspection-history", vehicleId, page],
    queryFn: () => getVehicleInspectionHistory(vehicleId, page),
    enabled: !!vehicleId,
  });
}
