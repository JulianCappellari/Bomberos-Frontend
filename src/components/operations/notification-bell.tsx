"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
export function NotificationBell() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["notification-count", user?.id], queryFn: async () => (await api.get<{ unread: number }>("/members/notifications")).data, enabled: Boolean(user), refetchInterval: 30000, refetchOnWindowFocus: true });
  return <Link href="/notifications" title="Mis notificaciones" aria-label={`Mis notificaciones${query.data ? `: ${query.data.unread} sin leer` : ""}`} className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white/80"><Bell className="h-5 w-5" />{Boolean(query.data?.unread) && <span key={query.data?.unread} className="badge-bump absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{Math.min(query.data!.unread, 99)}</span>}</Link>;
}
