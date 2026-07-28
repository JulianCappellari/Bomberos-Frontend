"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummaryRequest } from "@/services/dashboard.service";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummaryRequest,
    refetchInterval: 30000,
  });
}
