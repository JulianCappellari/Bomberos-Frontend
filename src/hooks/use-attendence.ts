import { useQuery } from "@tanstack/react-query";
import {
  getMyAttendanceSummary,
  getPresentPersonnelRequest,
} from "@/services/attendance.service";

export function useMyAttendanceSummary() {
  return useQuery({
    queryKey: ["attendance", "me", "summary"],
    queryFn: getMyAttendanceSummary,
  });
}

export function usePresentPersonnel() {
  return useQuery({
    queryKey: ["attendance", "present"],
    queryFn: getPresentPersonnelRequest,
    refetchInterval: 10000,
  });
}
