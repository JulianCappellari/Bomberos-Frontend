"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignIncidentUsersRequest,
  closeIncidentRequest,
  createIncidentRequest,
  getIncidentsRequest,
  updateIncidentRequest,
} from "@/services/incidents.service";
import { IncidentStatus } from "@/types/incident";

export function useIncidents(status?: IncidentStatus) {
  return useQuery({
    queryKey: ["incidents", status || "all"],
    queryFn: () => getIncidentsRequest(status ? { status } : undefined),
    refetchInterval: status === "OPEN" ? 12000 : undefined,
  });
}

function invalidateOperationalQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["incidents"] });
  queryClient.invalidateQueries({ queryKey: ["alerts"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIncidentRequest,
    onSuccess: () => invalidateOperationalQueries(queryClient),
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateIncidentRequest,
    onSuccess: () => invalidateOperationalQueries(queryClient),
  });
}

export function useCloseIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeIncidentRequest,
    onSuccess: () => invalidateOperationalQueries(queryClient),
  });
}

export function useAssignIncidentUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignIncidentUsersRequest,
    onSuccess: () => invalidateOperationalQueries(queryClient),
  });
}
