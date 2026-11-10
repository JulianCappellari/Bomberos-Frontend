"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailabilityRequest, saveAvailabilityRequest, getMaintenanceRequest, createMaintenanceRequest,
  transitionMaintenanceRequest, getDocumentsRequest, saveDocumentRequest, transitionDocumentRequest,
} from "@/services/operations.service";
import { DocumentKind, DocumentStatus } from "@/types/operations";
import { useAuth } from "@/features/auth/auth-context";

export function useOperationsInvalidation() {
  const client = useQueryClient();
  return () => {
    for (const key of ["operations", "assets", "asset", "vehicle-inventory", "operational-readiness", "dashboard-summary", "shifts", "audit-logs"]) {
      client.invalidateQueries({ queryKey: [key] });
    }
  };
}
export function useAvailability(date: string) {
  const { isAuthenticated, user } = useAuth();
  return useQuery({ queryKey: ["operations", "availability", date, user?.id, user?.role], queryFn: () => getAvailabilityRequest(date), enabled: isAuthenticated && /^\d{4}-\d{2}-\d{2}$/.test(date) });
}
export function useSaveAvailability() {
  const refresh = useOperationsInvalidation();
  return useMutation({ mutationFn: saveAvailabilityRequest, onSuccess: refresh });
}
export function useMaintenance(assetId?: string) {
  const { isAuthenticated, user } = useAuth();
  return useQuery({ queryKey: ["operations", "maintenance", assetId || "all", user?.id, user?.role], queryFn: () => getMaintenanceRequest(assetId), enabled: isAuthenticated });
}
export function useCreateMaintenance() {
  const refresh = useOperationsInvalidation();
  return useMutation({ mutationFn: createMaintenanceRequest, onSuccess: refresh });
}
export function useTransitionMaintenance() {
  const refresh = useOperationsInvalidation();
  return useMutation({ mutationFn: transitionMaintenanceRequest, onSuccess: refresh });
}
export function useDocuments(params: { kind?: DocumentKind; status?: DocumentStatus }) {
  const { isAuthenticated, user } = useAuth();
  return useQuery({ queryKey: ["operations", "documents", params, user?.id, user?.role], queryFn: () => getDocumentsRequest(params), enabled: isAuthenticated });
}
export function useSaveDocument() {
  const refresh = useOperationsInvalidation();
  return useMutation({ mutationFn: saveDocumentRequest, onSuccess: refresh });
}
export function useTransitionDocument() {
  const refresh = useOperationsInvalidation();
  return useMutation({ mutationFn: transitionDocumentRequest, onSuccess: refresh });
}
