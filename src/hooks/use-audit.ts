"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogsRequest } from "@/services/audit.service";

export function useAuditLogs(params?: {
  limit?: number;
  entityType?: string;
  action?: string;
}) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogsRequest(params),
    staleTime: 15_000,
  });
}
