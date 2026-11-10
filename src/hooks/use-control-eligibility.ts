"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { UserRosterItem } from "@/types/user";
export function useControlEligibility() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["control-eligibility", user?.id], queryFn: async () => (await api.get<{ allowed: boolean; reason: string | null; group: { name: string; members: Array<{ userId: string; user: UserRosterItem }> } | null; week: { start: string; end: string; current: boolean } | null }>("/members/control-eligibility")).data, enabled: Boolean(user), refetchInterval: 30000 });
}
