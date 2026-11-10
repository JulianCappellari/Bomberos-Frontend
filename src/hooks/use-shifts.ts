"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserRosterRequest } from "@/services/user.service";
import {
  createShiftRequest,
  deleteShiftRequest,
  getShiftsRequest,
  updateShiftRequest,
} from "@/services/shifts.service";

export function useShifts(params?: {
  date?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ["shifts", params],
    queryFn: () => getShiftsRequest(params),
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShiftRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["operational-readiness"] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShiftRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["operational-readiness"] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShiftRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["operational-readiness"] });
    },
  });
}

export function useUserRoster() {
  return useQuery({
    queryKey: ["users", "roster"],
    queryFn: getUserRosterRequest,
    staleTime: 60_000,
  });
}
