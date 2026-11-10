import { api } from "@/lib/api-client";
import {
  ComplianceInput,
  ComplianceQuery,
  ComplianceRecord,
  ComplianceSummary,
} from "@/types/compliance";

export async function getComplianceRecordsRequest(params?: ComplianceQuery) {
  const response = await api.get<ComplianceRecord[]>("/compliance", { params });
  return response.data;
}

export async function getComplianceSummaryRequest() {
  const response = await api.get<ComplianceSummary>("/compliance/summary");
  return response.data;
}

export async function createComplianceRecordRequest(payload: ComplianceInput) {
  const response = await api.post<ComplianceRecord>("/compliance", payload);
  return response.data;
}

export async function updateComplianceRecordRequest(payload: {
  id: string;
  data: ComplianceInput;
}) {
  const response = await api.put<ComplianceRecord>(
    `/compliance/${payload.id}`,
    payload.data,
  );
  return response.data;
}

export async function deleteComplianceRecordRequest(id: string) {
  const response = await api.delete(`/compliance/${id}`);
  return response.data;
}
