"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
export function EmergencyAvailability() {
  const { user } = useAuth(); const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const query = useQuery({ queryKey: ["emergency-availability", user?.id], queryFn: async () => (await api.get<{ available: boolean }>("/members/availability")).data, enabled: Boolean(user), refetchInterval: 30000 });
  async function toggle() { setBusy(true); setError(""); try { if (query.data?.available) await api.post("/members/availability", { startsAt: new Date().toISOString(), endsAt: null }); else await api.post("/members/availability/available-now"); await query.refetch(); } catch { setError("No se pudo guardar la disponibilidad."); } finally { setBusy(false); } }
  return <section className="my-4 border-y border-[var(--bord)] py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Mi disponibilidad para emergencias</h2><p className="mt-1 text-sm text-[var(--mut)]">{query.isError ? "No se pudo consultar" : query.data ? query.data.available ? "Disponible" : "No disponible" : "Consultando..."}</p></div><div className="flex flex-wrap gap-2"><button className="app-button w-auto" disabled={busy || !query.data} onClick={toggle}>{query.data?.available ? "No estoy disponible" : "Estoy disponible ahora"}</button><Link className="app-button w-auto" href="/me">Programar periodo</Link></div></div>{error && <p role="alert" className="mt-2 text-red-300">{error}</p>}</section>;
}
