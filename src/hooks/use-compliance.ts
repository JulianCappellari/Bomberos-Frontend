"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createComplianceRecordRequest,
  deleteComplianceRecordRequest,
  getComplianceRecordsRequest,
  getComplianceSummaryRequest,
  updateComplianceRecordRequest,
} from "@/services/compliance.service";
import { ComplianceQuery } from "@/types/compliance";

function invalidateCompliance(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["compliance"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  queryClient.invalidateQueries({ queryKey: ["operational-readiness"] });
}

export function useComplianceRecords(params?: ComplianceQuery) {
  return useQuery({
    queryKey: ["compliance", "records", params],
    queryFn: () => getComplianceRecordsRequest(params),
  });
}

export function useComplianceSummary() {
  return useQuery({
    queryKey: ["compliance", "summary"],
    queryFn: getComplianceSummaryRequest,
  });
}

export function useCreateComplianceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComplianceRecordRequest,
    onSuccess: () => invalidateCompliance(queryClient),
  });
}

export function useUpdateComplianceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateComplianceRecordRequest,
    onSuccess: () => invalidateCompliance(queryClient),
  });
}

export function useDeleteComplianceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComplianceRecordRequest,
    onSuccess: () => invalidateCompliance(queryClient),
  });
}
