import { api } from "@/lib/api-client";
import { AuditLog } from "@/types/audit";

export async function getAuditLogsRequest(params?: {
  limit?: number;
  entityType?: string;
  action?: string;
}) {
  const response = await api.get<AuditLog[]>("/audit-logs", { params });
  return response.data;
}
