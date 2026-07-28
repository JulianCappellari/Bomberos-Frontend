"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createAttendanceQrChallenge,
  getMyAttendances,
  getMyOpenAttendance,
  scanAttendanceQr,
} from "@/services/attendance.service";

export function useCreateAttendanceQrChallenge() {
  return useMutation({
    mutationFn: (stationId: string) => createAttendanceQrChallenge(stationId),
  });
}

export function useScanAttendanceQr() {
  return useMutation({
    mutationFn: scanAttendanceQr,
  });
}

export function useMyOpenAttendance() {
  return useQuery({
    queryKey: ["attendance", "me", "open"],
    queryFn: getMyOpenAttendance,
  });
}

export function useMyAttendances() {
  return useQuery({
    queryKey: ["attendance", "me"],
    queryFn: getMyAttendances,
  });
}
