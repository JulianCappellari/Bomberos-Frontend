import { useQuery } from "@tanstack/react-query";
import { getMyAttendanceSummary } from "@/services/attendance.service";

export function useMyAttendanceSummary() {
  return useQuery({
    queryKey: ["attendance", "me", "summary"],
    queryFn: getMyAttendanceSummary,
  });
}