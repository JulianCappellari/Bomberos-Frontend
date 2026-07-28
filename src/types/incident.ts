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

export type Incident = {
  id: string;
  alertId: string | null;
  title: string;
  type: IncidentType;
  description: string;
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
  createdBy?: UserRosterItem | null;
  closedBy?: UserRosterItem | null;
};

export type CreateIncidentPayload = {
  alertId?: string;
  title: string;
  type: IncidentType;
  description: string;
  losses?: string;
  assignedUserIds?: string[];
};

export type UpdateIncidentPayload = {
  id: string;
  title?: string;
  type?: IncidentType;
  description?: string;
  losses?: string;
};
