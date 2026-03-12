"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAlertRequest,
  getAlertsRequest,
  resolveAlertRequest,
} from "@/services/alerts.service";

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: getAlertsRequest,
    refetchInterval: 15000,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAlertRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolveAlertRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}