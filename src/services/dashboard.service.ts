import { api } from "@/lib/api-client";
import { DashboardSummary } from "@/types/dashboard";

export async function getDashboardSummaryRequest() {
  const response = await api.get<DashboardSummary>("/dashboard/summary");
  return response.data;
}
