"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { stationDate } from "./operations-ui";

type Group = { id: string; name: string; members: Array<{ userId: string }>; next: { start: string; end: string; current: boolean } };
export function NextControlBanner() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["my-next-control", user?.id], queryFn: async () => (await api.get<Group[]>("/members/groups")).data, enabled: Boolean(user&&!user.mustChangePassword&&user.profile?.rank?.toLowerCase()!=="administrador"), refetchInterval: 60000 });
  const row = query.data?.filter((g) => g.members.some((m) => m.userId === user?.id)).sort((a, b) => a.next.start.localeCompare(b.next.start))[0];
  if (!row) return null;
  const today = new Date(`${stationDate()}T00:00:00Z`).getTime();
  const days = Math.max(0, Math.round((new Date(row.next.start).getTime() - today) / 86400000));
  const format = (value: number) => new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(value));
  return <Link href="/me#grupo-control" className="flex items-start gap-3 rounded-xl border border-[var(--bord)] border-l-4 border-l-sky-400 bg-[var(--card)] p-3"><CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" /><div className="min-w-0"><p className="text-xs text-[var(--mut)]">{row.next.current ? "Esta semana te toca el control de móviles" : "Tu próximo control de móviles"}</p><p className="mt-1 break-words text-sm font-bold">{row.name} · {format(new Date(row.next.start).getTime())} al {format(new Date(row.next.end).getTime() - 86400000)}</p><p className="mt-1 text-xs text-sky-200">{row.next.current ? "Semana en curso" : days === 1 ? "Mañana" : `En ${days} días`}</p></div></Link>;
}
