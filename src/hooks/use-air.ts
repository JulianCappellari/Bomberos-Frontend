"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { AirPage } from "@/types/air";
export function useAir<T>(kind: string, filters: { q?: string; page: number; retired?: string; compressorId?: string; cylinderId?: string }, enabled = true) {
  const { user } = useAuth();
  return useQuery({ queryKey: ["air", user?.id, user?.role, kind, filters], enabled: !!user && enabled,
    queryFn: async () => (await api.get<AirPage<T>>(`/air/${kind}`, { params: filters })).data });
}
export function useAirAction() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ path, body }: { path: string; body: Record<string, unknown> }) => (await api.post(`/air/${path}`, body, { timeout: 30000 })).data,
    onSuccess: async () => { await Promise.all(["air", "assets", "maintenance", "audit-logs"].map((key) => client.invalidateQueries({ queryKey: [key] }))); } });
}
