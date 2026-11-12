"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, Truck } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";

type Note = { level: "critical" | "warning" | "info"; text: string; detail?: string };
type Briefing = { movementId: string; incident: { id: string; title: string; location: string }; vehicle: string; vehicleName: string; departedAt: string; arrivedAt: string | null; role: string; lastControl: string | null; fuelType?: string | null; counts?: { critical: number; warning: number; info: number }; notes: Note[]; hiddenNotes: number };
const style = {
  critical: { Icon: AlertOctagon, box: "border-red-500/50 bg-red-500/10", icon: "text-red-400", tag: "Importante" },
  warning: { Icon: AlertTriangle, box: "border-amber-500/40 bg-amber-500/10", icon: "text-amber-400", tag: "Atención" },
  info: { Icon: Info, box: "border-[var(--bord)] bg-[var(--card2)]", icon: "text-sky-400", tag: "Dato" },
} as const;
const hour = (v: string) => new Date(v).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

// Inicio: si saliste a una emergencia, lo que tenés que saber del movil (fallas, faltantes, vencimientos).
// Se actualiza solo y desaparece cuando el movil vuelve al cuartel.
export function MissionBriefing() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["mission-briefing", user?.id], queryFn: async () => (await api.get<Briefing[]>("/incidents/logistics/briefing")).data, enabled: Boolean(user && !user.mustChangePassword), refetchInterval: 30000, refetchOnWindowFocus: true });
  if (!query.data?.length) return null;
  return <section aria-label="Tu móvil en salida" className="space-y-3">
    {query.data.map((b) => <article key={b.movementId} className="rounded-2xl border-2 border-red-500/60 bg-[var(--card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-300"><Truck className="h-4 w-4" aria-hidden /> En salida · {b.role}</p>
          <h2 className="mt-1 text-xl font-bold">Móvil {b.vehicle}</h2>
          <p className="truncate text-sm text-[var(--mut)]">{b.incident.title} · {b.incident.location}</p>
          <p className="text-xs text-[var(--mut)]">Salió {hour(b.departedAt)}{b.arrivedAt ? ` · llegó ${hour(b.arrivedAt)}` : " · en camino"}</p>
        </div>
        <Link href={`/incidents/${b.incident.id}/sheet`} className="app-button app-button-outline w-auto shrink-0 px-3 py-2 text-sm">Planilla</Link>
      </div>
      <h3 className="mt-3 text-sm font-semibold">Lo que tenés que saber del móvil</h3>
      {b.notes.length === 0
        ? <p className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />Sin fallas ni faltantes registrados{b.lastControl ? ` (último control ${new Date(b.lastControl).toLocaleDateString("es-AR")})` : ""}.</p>
        : <BriefingNotes b={b} />}
    </article>)}
  </section>;
}

function NoteItem({ n }: { n: Note }) {
  const s = style[n.level];
  return <li className={`flex gap-3 rounded-xl border p-3 ${s.box}`}>
    <s.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.icon}`} aria-hidden />
    <div className="min-w-0"><p className="font-semibold leading-snug"><span className="sr-only">{s.tag}: </span>{n.text}</p>{n.detail && <p className="mt-0.5 break-words text-sm text-[var(--mut)]">{n.detail}</p>}</div>
  </li>;
}

// Primero lo que puede afectar la intervencion (fallas, faltantes, ERA, combustible); los datos menores, plegados.
function BriefingNotes({ b }: { b: Briefing }) {
  const main = b.notes.filter((n) => n.level !== "info"), minor = b.notes.filter((n) => n.level === "info");
  const counts = b.counts ?? { critical: b.notes.filter((n) => n.level === "critical").length, warning: main.length - b.notes.filter((n) => n.level === "critical").length, info: minor.length };
  return <>
    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
      {counts.critical > 0 && <span className="rounded-full border border-red-500/50 bg-red-500/10 px-2.5 py-1 text-red-400">{counts.critical} {counts.critical === 1 ? "importante" : "importantes"}</span>}
      {counts.warning > 0 && <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[var(--warn-text)]">{counts.warning} para tener en cuenta</span>}
      {counts.info > 0 && <span className="rounded-full border border-[var(--bord)] bg-[var(--card2)] px-2.5 py-1 text-[var(--mut)]">{counts.info} {counts.info === 1 ? "dato" : "datos"}</span>}
      {b.fuelType && <span className="rounded-full border border-[var(--bord)] bg-[var(--card2)] px-2.5 py-1 text-[var(--mut)]">Carga {b.fuelType}</span>}
    </div>
    {main.length > 0 && <ul className="mt-2 space-y-2">{main.map((n, i) => <NoteItem key={i} n={n} />)}</ul>}
    {minor.length > 0 && (main.length === 0
      ? <ul className="mt-2 space-y-2">{minor.map((n, i) => <NoteItem key={i} n={n} />)}</ul>
      : <details className="group mt-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-xl border border-[var(--bord)] px-3 text-sm font-semibold text-[var(--mut)]">Ver {minor.length} {minor.length === 1 ? "dato más" : "datos más"} (vencimientos, pedidos, observaciones)</summary>
          <ul className="mt-2 space-y-2">{minor.map((n, i) => <NoteItem key={i} n={n} />)}</ul>
        </details>)}
    {b.hiddenNotes > 0 && <p className="mt-2 text-xs text-[var(--mut)]">Y {b.hiddenNotes} novedades más en la ficha del móvil.</p>}
  </>;
}
