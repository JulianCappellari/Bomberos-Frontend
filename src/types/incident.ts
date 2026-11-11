import { BackendAlert } from "@/services/alerts.service";
import { UserRosterItem } from "@/types/user";

export type IncidentType =
  | "FIRE"
  | "RESCUE"
  | "ACCIDENT"
  | "CHEMICAL"
  | "MEDICAL"
  | "FLOOD"
  | "OTHER";

export type IncidentStatus = "OPEN" | "CLOSED";

export type IncidentAssignment = {
  id: string;
  incidentId: string;
  userId: string;
  assignedAt: string;
  user: UserRosterItem;
};

export type IncidentVehicle = {
  id: string;
  assetId: string;
  asset: { id: string; name: string; status: string; vehicle?: { unitNumber: string } | null };
};

export type IncidentUpdate = {
  id: string;
  body: string;
  createdAt: string;
  authorUserId: string;
  author: UserRosterItem;
};

export type Incident = {
  id: string;
  requestNumber?: number | null;
  requestYear?: number | null;
  alertId: string | null;
  title: string;
  type: IncidentType;
  description: string;
  location: string;
  responseTimeMinutes: number | null;
  closingReport: string | null;
  status: IncidentStatus;
  occurredAt: string;
  losses: string | null;
  createdByUserId: string;
  closedByUserId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  alert: BackendAlert | null;
  assignments: IncidentAssignment[];
  vehicles: IncidentVehicle[];
  updates: IncidentUpdate[];
  createdBy?: UserRosterItem | null;
  closedBy?: UserRosterItem | null;
};

export type CreateIncidentPayload = {
  alertId?: string;
  title: string;
  type: IncidentType;
  description: string;
  location: string;
  responseTimeMinutes?: number;
  losses?: string;
  assignedUserIds?: string[];
  vehicleAssetIds?: string[];
};

export type UpdateIncidentPayload = {
  id: string;
  title?: string;
  type?: IncidentType;
  description?: string;
  location?: string;
  responseTimeMinutes?: number | null;
  losses?: string;
};
