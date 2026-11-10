"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogsRequest } from "@/services/audit.service";
import { AuditLogQuery } from "@/types/audit";
import { useAuth } from "@/features/auth/auth-context";

export function useAuditLogs(params?: AuditLogQuery) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["audit-logs", user?.id, params],
    enabled: user?.role === "ADMIN",
    queryFn: () => getAuditLogsRequest(params),
    staleTime: 15_000,
  });
}
