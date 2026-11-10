import { UserRosterItem } from "./user";
export type AvailabilityStatus = "AVAILABLE" | "ON_CALL" | "UNAVAILABLE";
export type AvailabilityRecord = {
  id: string; userId: string; date: string; period: "DAY" | "NIGHT";
  status: AvailabilityStatus; notes: string | null; revision: number; user: UserRosterItem;
};
export type AvailabilityInput = {
  userId?: string; date: string; period: "DAY" | "NIGHT"; status: AvailabilityStatus; notes: string; revision: number;
};
export type MaintenanceStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type MaintenanceInput = {
  publishTask?: boolean;
  assetId: string; title: string; description: string; blocksOperation: boolean;
  dueAt: string | null; responsibleUserId: string | null;
};
export type MaintenanceJob = MaintenanceInput & {
  publicTask?: { id: string; status: string } | null;
  id: string; status: MaintenanceStatus; resolution: string | null; costCents: number | null;
  resolvedAt: string | null; revision: number; createdAt: string;
  asset: { id: string; name: string; status: string; assetType: string };
  responsible: UserRosterItem | null; createdBy: UserRosterItem;
};
export type DocumentKind = "PROTOCOL" | "SHIFT_REPORT" | "INCIDENT_REPORT";
export type DocumentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type DocumentInput = {
  kind: DocumentKind; title: string; category: string; body: string;
  externalUrl: string; shiftId: string; incidentId: string;
};
export type OperationalDocument = Omit<DocumentInput, "externalUrl" | "shiftId" | "incidentId"> & {
  id: string; externalUrl: string | null; shiftId: string | null; incidentId: string | null;
  status: DocumentStatus; revision: number; publishedAt: string | null; updatedAt: string;
  createdBy: UserRosterItem;
  publicationContext: {
    shift?: { date: string; startTime: string; endTime: string; assignments: Array<{ user: UserRosterItem }> } | null;
    incident?: { title: string; location: string; assignments: Array<{ user: UserRosterItem }> } | null;
  } | null;
};
