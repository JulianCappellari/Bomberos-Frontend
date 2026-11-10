import { UserRosterItem } from "@/types/user";

export type AuditLog = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  actor: UserRosterItem | null;
};

export type AuditLogQuery = {
  limit?: number;
  entityType?: string;
  action?: string;
  q?: string;
  from?: string;
  to?: string;
};
