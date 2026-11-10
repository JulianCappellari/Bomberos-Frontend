"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardSummaryRequest,
  getOperationalReadinessRequest,
} from "@/services/dashboard.service";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummaryRequest,
    refetchInterval: 30000,
  });
}

export function useOperationalReadiness() {
  return useQuery({
    queryKey: ["operational-readiness"],
    queryFn: getOperationalReadinessRequest,
    refetchInterval: 15000,
  });
}
