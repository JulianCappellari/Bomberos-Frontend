import { api } from "@/lib/api-client";
import { AuditLog, AuditLogQuery } from "@/types/audit";

export async function getAuditLogsRequest(params?: AuditLogQuery) {
  const response = await api.get<AuditLog[]>("/audit-logs", { params });
  return response.data;
}
