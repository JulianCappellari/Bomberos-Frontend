"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { MapPin, Siren, ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useAlerts, useRespondAlert } from "@/hooks/use-alerts";
import { getErrorMessage } from "@/lib/get-error-message";
import { toast } from "@/lib/toast";

type GateAlert = { id: string; type: string; priority: "HIGH" | "MEDIUM" | "LOW"; status: string; location: string; description?: string | null; createdAt: string; viewerIsRecipient?: boolean; responses?: Array<{ userId: string }>; createdBy?: { username: string; profile?: { fullName?: string | null } | null } | null };
const typeLabels: Record<string, string> = { FIRE: "Incendio", RESCUE: "Rescate", ACCIDENT: "Accidente", CHEMICAL: "Riesgo químico", MEDICAL: "Emergencia médica", FLOOD: "Inundación", OTHER: "Emergencia" };
const priorityLabels = { HIGH: "Prioridad alta", MEDIUM: "Prioridad media", LOW: "Prioridad baja" } as const;
const order = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
function elapsed(from: string, now: number) {
  const minutes = Math.max(0, Math.floor((now - new Date(from).getTime()) / 60000));
  return minutes < 1 ? "recién" : minutes < 60 ? `hace ${minutes} min` : `hace ${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

// Con una alerta activa sin responder, la persona convocada ve solo esta tarjeta hasta contestar Voy / No voy.
// Desaparece sola cuando la alerta deja de estar activa (al cerrar la planilla de la intervención o cancelarla).
export function AlertGate() {
  const { user } = useAuth(), pathname = usePathname();
  const alerts = useAlerts(), respond = useRespondAlert();
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const pending = ((alerts.data ?? []) as GateAlert[])
    .filter((a) => a.status === "ACTIVE" && a.viewerIsRecipient && !a.responses?.some((r) => r.userId === user?.id))
    .sort((a, b) => order[a.priority] - order[b.priority] || +new Date(a.createdAt) - +new Date(b.createdAt));
  const alert = pending[0];
  const active = Boolean(alert && user && !user.mustChangePassword && pathname !== "/security");

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.clearInterval(timer); document.documentElement.style.overflow = previous; };
  }, [active]);

  if (!active || !alert) return null;
  async function answer(response: "GOING" | "NOT_GOING") {
    if (response === "NOT_GOING" && !window.confirm("¿Confirmás que NO vas? La respuesta no se puede cambiar.")) return;
    setError("");
    try { await respond.mutateAsync({ id: alert!.id, response }); toast.success(response === "GOING" ? "Confirmaste que vas" : "Avisaste que no vas", alert!.location); }
    catch (err) { setError(getErrorMessage(err, "No se pudo registrar tu respuesta. Probá de nuevo.")); }
  }
  const urgent = alert.priority === "HIGH";
  const author = alert.createdBy ? alert.createdBy.profile?.fullName || alert.createdBy.username : null;
  // Portal al <body>: asi queda por encima de todo (encabezado, menu y barra inferior), sin depender de la pagina.
  return createPortal(<div role="alertdialog" aria-modal="true" aria-labelledby="alert-gate-title" aria-describedby="alert-gate-place" className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[var(--bg)]/95 p-4 backdrop-blur-sm" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
    <section className={`w-full max-w-md rounded-3xl border-2 bg-[var(--card)] p-5 shadow-2xl ${urgent ? "border-red-500" : "border-amber-500/70"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${urgent ? "bg-red-600 text-white" : "bg-amber-500/20 text-amber-200"}`}><Siren className={`h-4 w-4 ${urgent ? "animate-pulse" : ""}`} aria-hidden /> {priorityLabels[alert.priority]}</span>
        {pending.length > 1 && <span className="text-xs text-[var(--mut)]">1 de {pending.length} alertas</span>}
      </div>
      <h1 id="alert-gate-title" className="mt-4 text-3xl font-bold text-[var(--txt)]">{typeLabels[alert.type] ?? "Emergencia"}</h1>
      <p id="alert-gate-place" className="mt-2 flex items-start gap-2 text-lg font-semibold text-[var(--txt)]"><MapPin className="mt-1 h-5 w-5 shrink-0 text-red-400" aria-hidden />{alert.location}</p>
      <p className="mt-1 text-sm text-[var(--mut)]">Emitida {elapsed(alert.createdAt, now)}{author ? ` por ${author}` : ""}</p>
      {alert.description && <p className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-[var(--card2)] p-3 text-sm">{alert.description}</p>}
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alert.location)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm text-sky-300 underline">Ver en el mapa</a>
      <p className="mt-5 text-center text-sm font-semibold">¿Vas a la emergencia?</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button type="button" disabled={respond.isPending} onClick={() => void answer("GOING")} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"><ThumbsUp className="h-6 w-6" aria-hidden /> Voy</button>
        <button type="button" disabled={respond.isPending} onClick={() => void answer("NOT_GOING")} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[var(--bord)] text-lg font-bold text-[var(--txt)] transition active:scale-[0.98] disabled:opacity-60"><ThumbsDown className="h-6 w-6" aria-hidden /> No voy</button>
      </div>
      {error && <p role="alert" className="mt-3 text-center text-sm text-red-300">{error}</p>}
      <p className="mt-4 text-center text-xs text-[var(--mut)]">Tu respuesta queda registrada y no se puede cambiar. El resto de la app se habilita al responder.</p>
    </section>
  </div>, document.body);
}
