"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { EquipmentPage, EquipmentHistoryPage, EquipmentRequestsPage } from "@/types/personal-equipment";
export function usePersonalEquipment(filters: { q: string; view: string; category: string; page: number }) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["personal-equipment", user?.id, user?.role, filters], enabled: !!user,
    queryFn: async () => (await api.get<EquipmentPage>("/personal-equipment", { params: { ...filters, category: filters.category || undefined } })).data });
}
export function useEquipmentHistory(id: string, page: number) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["equipment-history", user?.id, user?.role, id, page], enabled: !!user,
    queryFn: async () => (await api.get<EquipmentHistoryPage>(`/personal-equipment/${encodeURIComponent(id)}/history`, { params: { page } })).data });
}
export function useEquipmentAction() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ id, action, body }: { id?: string; action: "create" | "edit" | "checks" | "issues" | "return" | "archive"; body: Record<string, unknown> }) => {
    const path = id ? `/personal-equipment/${encodeURIComponent(id)}${action === "edit" ? "" : `/${action}`}` : "/personal-equipment";
    return (await api.request({ url: path, method: action === "edit" ? "PUT" : "POST", data: body })).data;
  }, onSuccess: async () => {
    await Promise.all(["personal-equipment", "equipment-history", "equipment-requests", "assets", "maintenance", "audit-logs"].map((key) => client.invalidateQueries({ queryKey: [key] })));
  } });
}
export function useEquipmentRequests(filters: { status?: string; userId?: string; page: number }, enabled = true) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["equipment-requests", user?.id, user?.role, filters], enabled: !!user && enabled,
    queryFn: async () => (await api.get<EquipmentRequestsPage>("/equipment-requests", { params: { ...filters, status: filters.status || undefined, userId: filters.userId || undefined } })).data });
}
export function useEquipmentRequestAction() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ id, action, body }: { id?: string; action: "create" | "edit" | "review" | "cancel"; body: Record<string, unknown> }) => {
    const path = id ? `/equipment-requests/${encodeURIComponent(id)}${action === "edit" ? "" : `/${action}`}` : "/equipment-requests";
    return (await api.request({ url: path, method: action === "edit" ? "PUT" : "POST", data: body })).data;
  }, onSuccess: () => client.invalidateQueries({ queryKey: ["equipment-requests"] }) });
}
