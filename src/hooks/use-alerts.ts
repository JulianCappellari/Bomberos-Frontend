"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelAlertRequest,
  createAlertRequest,
  getAlertsRequest,
  respondAlertRequest,
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useCancelAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelAlertRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useRespondAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: respondAlertRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
