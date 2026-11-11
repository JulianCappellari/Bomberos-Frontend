import { api } from "@/lib/api-client";

export type BoardIncident = {
  id: string; title: string; type: string; location: string; occurredAt: string;
  alert: { priority: "HIGH" | "MEDIUM" | "LOW"; createdAt: string } | null;
  agencies: Array<{ id: string; agencyType: string; name: string; unit: string }>;
  movements: Array<{ id: string; departedAt: string; arrivedAt: string | null; vehicle: string; driver: string; leader: string; crew: number }>;
};
export const getBoard = async () => (await api.get<{ generatedAt: string; incidents: BoardIncident[] }>("/station/board")).data;

export type StationEvent = {
  id: string; title: string; description: string; kind: "TRAINING" | "MEETING" | "EVENT" | "OTHER"; location: string;
  startsAt: string; endsAt: string; cancelledAt: string | null; cancelReason: string | null; revision: number;
  createdBy: { id: string; name: string };
  counts: { GOING: number; MAYBE: number; NOT_GOING: number };
  myResponse: "GOING" | "NOT_GOING" | "MAYBE" | null;
  attendees?: Array<{ userId: string; name: string; response: "GOING" | "NOT_GOING" | "MAYBE" }>;
};
export const eventKinds: Record<StationEvent["kind"], string> = { TRAINING: "Capacitación", MEETING: "Reunión", EVENT: "Evento", OTHER: "Actividad" };
export const listEvents = async (scope: "upcoming" | "past") => (await api.get<StationEvent[]>("/station/events", { params: { scope } })).data;

export type GuardReport = {
  month: string;
  totals: { shifts: number; finishedAssignments: number; attended: number; missed: number; rate: number | null };
  people: Array<{ userId: string; name: string; rank: string; assigned: number; attended: number; missed: number; upcoming: number; rate: number | null; missedDates: string[] }>;
};
export type YearData = { year: number; incidents: number; alerts: number; jointIncidents: number; agencies: Record<string, number>; months: number[]; byType: Record<string, number>; medianDispatchMinutes: number | null; medianTravelMinutes: number | null; samples: { dispatch: number; travel: number } };
export type YearComparison = { current: YearData; previous: YearData; comparableMonths: number; comparable: { current: number; previous: number } };

export type PromotionRule = { rank: string; nextRank: string; minYearsInRank: number; minYearsService: number; minApprovedCourses: number };
export type SeniorityRow = { userId: string; name: string; badge: string; rank: string; joinDate: string | null; rankSince: string | null; rankSinceEstimated: boolean; yearsService: number | null; yearsInRank: number | null; approvedCourses: number; nextRank: string | null; eligible: boolean; missing: string[] };

export type DocumentReads = { document: { id: string; title: string; revision: number }; read: Array<{ userId: string; name: string; rank: string; readAt: string }>; pending: Array<{ userId: string; name: string; rank: string }> };
