import { api } from "@/lib/api-client";
import { DashboardSummary } from "@/types/dashboard";
import { OperationalReadiness } from "@/types/readiness";

export async function getDashboardSummaryRequest() {
  const response = await api.get<DashboardSummary>("/dashboard/summary");
  return response.data;
}

export async function getOperationalReadinessRequest() {
  const response = await api.get<OperationalReadiness>("/dashboard/readiness");
  return response.data;
}
