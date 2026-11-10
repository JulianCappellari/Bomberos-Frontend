import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";

export type ScanAttendanceQrPayload = {
  qrToken: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  deviceFingerprint: string;
};

export type AttendanceSummary = {
  totalMinutes: number;
  totalHours: number;
  totalHoursFormatted: string;
  totalAttendances: number;
  currentMonthMinutes: number;
  currentMonthFormatted: string;
  isCurrentlyInside: boolean;
};

export type PresentPersonnelItem = {
  id: string;
  checkInAt: string;
  checkInTrust: "HIGH" | "MEDIUM" | "REJECTED" | null;
  station: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    username: string;
    role: "ADMIN" | "FIREFIGHTER" | "OPERATOR" | "GUARD";
    profile: {
      fullName: string;
      rank: string;
      badge: string;
      avatarUrl?: string | null;
    } | null;
  };
};

export async function createAttendanceQrChallenge(stationId: string) {
  const response = await api.post<{
    id: string;
    qrToken: string;
    expiresAt: string;
    stationId: string;
  }>("/attendance/qr-challenges", { stationId });

  return response.data;
}

export async function scanAttendanceQr(payload: ScanAttendanceQrPayload) {
  try {
    const response = await api.post<{
      action: "CHECK_IN" | "CHECK_OUT";
      shouldPromptAvailability: boolean;
      station: {
        id: string;
        name: string;
      };
      workedMinutes: number;
      distanceMeters: number;
    }>("/attendance/scan", payload);

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(error, "No se pudo registrar la asistencia."),
    );
  }
}

export async function getMyOpenAttendance() {
  const response = await api.get("/attendance/me/open");
  return response.data;
}

export async function getMyAttendances() {
  const response = await api.get("/attendance/me");
  return response.data;
}

export async function getMyAttendanceSummary() {
  const response = await api.get<AttendanceSummary>("/attendance/me/summary");
  return response.data;
}

export async function getPresentPersonnelRequest() {
  const response =
    await api.get<PresentPersonnelItem[]>("/attendance/present");
  return response.data;
}
