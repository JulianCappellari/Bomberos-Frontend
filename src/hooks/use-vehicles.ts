"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssetsRequest } from "@/services/assets.service";

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const assets = await getAssetsRequest();
      return assets.filter((asset) => asset.assetType === "VEHICLE");
    },
  });
}
