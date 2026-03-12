import { api } from "@/lib/api-client";
import axios from "axios";

export type ScanAttendanceQrPayload = {
  qrToken: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  deviceFingerprint: string;
};

export async function createAttendanceQrChallenge(stationId: string) {
  console.log("[SERVICE] createAttendanceQrChallenge() -> request:", { stationId });

  const response = await api.post("/attendance/qr-challenges", { stationId });

  console.log("[SERVICE] createAttendanceQrChallenge() -> raw response:", response.data);

  return response.data as {
    id: string;
    qrToken: string;
    expiresAt: string;
    stationId: string;
  };
}

export async function scanAttendanceQr(payload: ScanAttendanceQrPayload) {
  try {
    console.log("[SERVICE] scanAttendanceQr() -> request payload:", payload);

    const response = await api.post("/attendance/scan", payload);

    console.log("[SERVICE] scanAttendanceQr() -> raw response:", response.data);

    return response.data as {
      action: "CHECK_IN" | "CHECK_OUT";
      station: {
        id: string;
        name: string;
      };
      workedMinutes: number;
      distanceMeters: number;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "No se pudo registrar la asistencia.",
      );
    }

    throw new Error("Ocurrió un error inesperado al registrar la asistencia.");
  }
}

export async function getMyOpenAttendance() {
  console.log("[SERVICE] getMyOpenAttendance() -> request");
  const response = await api.get("/attendance/me/open");
  console.log("[SERVICE] getMyOpenAttendance() -> raw response:", response.data);
  return response.data;
}

export async function getMyAttendances() {
  console.log("[SERVICE] getMyAttendances() -> request");
  const response = await api.get("/attendance/me");
  console.log("[SERVICE] getMyAttendances() -> raw response:", response.data);
  return response.data;
}


export async function getMyAttendanceSummary() {
  const response = await api.get("/attendance/me/summary");
  return response.data as {
    totalMinutes: number;
    totalHours: number;
    totalHoursFormatted: string;
    totalAttendances: number;
    currentMonthMinutes: number;
    currentMonthFormatted: string;
    isCurrentlyInside: boolean;
  };
}