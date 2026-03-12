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
    mutationFn: async (stationId: string) => {
      console.log(
        "[HOOK] createAttendanceQrChallenge() -> stationId:",
        stationId,
      );
      const result = await createAttendanceQrChallenge(stationId);
      console.log("[HOOK] createAttendanceQrChallenge() -> response:", result);
      return result;
    },
    onError: (error) => {
      console.error("[HOOK] createAttendanceQrChallenge() -> error:", error);
    },
  });
}

export function useScanAttendanceQr() {
  return useMutation({
    mutationFn: async (payload: {
      qrToken: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      deviceFingerprint: string;
    }) => {
      console.log("[HOOK] useScanAttendanceQr() -> payload:", payload);
      const result = await scanAttendanceQr(payload);
      console.log("[HOOK] useScanAttendanceQr() -> response:", result);
      return result;
    },
    onError: (error) => {
      console.warn("[HOOK] useScanAttendanceQr() -> error:", error.message);
    },
  });
}

export function useMyOpenAttendance() {
  return useQuery({
    queryKey: ["attendance", "me", "open"],
    queryFn: async () => {
      console.log("[HOOK] getMyOpenAttendance()");
      const result = await getMyOpenAttendance();
      console.log("[HOOK] getMyOpenAttendance() -> response:", result);
      return result;
    },
  });
}

export function useMyAttendances() {
  return useQuery({
    queryKey: ["attendance", "me"],
    queryFn: async () => {
      console.log("[HOOK] getMyAttendances()");
      const result = await getMyAttendances();
      console.log("[HOOK] getMyAttendances() -> response:", result);
      return result;
    },
  });
}
