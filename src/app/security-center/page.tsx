"use client";
import { CountUp } from "@/components/ui/count-up";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Lock, LockOpen, ShieldAlert, ShieldCheck } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { OperationDialog } from "@/components/operations/work-ui";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";

type Overview = {
  protection: { auditAppendOnly: boolean; loginLock: { attempts: number; minutes: number }; measures: string[] };
  lockedAccounts: Array<{ userId: string; name: string; lockedUntil: string }>;
  counts: Record<string, number>;
  sessionsWarning: Array<{ userId: string; name: string; active: number }>;
  events: Array<{ id: string; action: string; createdAt: string; actor: string; target: string | null; metadata: Record<string, unknown> | null }>;
};
const labels: Record<string, [string, "red" | "amber" | "blue"]> = {
  AUTH_LOGIN_FAILED: ["Ingreso fallido", "amber"], AUTH_ACCOUNT_LOCKED: ["Cuenta bloqueada", "red"], AUTH_LOGIN_WHILE_LOCKED: ["Intento con cuenta bloqueada", "red"],
  AUTH_NEW_DEVICE: ["Ingreso desde dispositivo nuevo", "blue"], AUTH_REFRESH_REPLAY_BLOCKED: ["Sesión robada bloqueada", "red"],
  PRESENCE_GPS_SUSPICIOUS: ["Ubicación sospechosa", "amber"], ATTENDANCE_SHARED_DEVICE: ["Celular compartido al fichar", "red"],
  ALERT_BURST_DETECTED: ["Alertas en ráfaga", "amber"], SECURITY_ANOMALY_MASS_CHANGE: ["Borrado masivo", "red"], SECURITY_ANOMALY_BRUTE_FORCE: ["Ataque de contraseñas", "red"],
  SECURITY_ACCOUNT_UNLOCKED: ["Cuenta desbloqueada", "blue"], SECURITY_SESSIONS_REVOKED: ["Sesiones cerradas por administración", "blue"],
};
const tone = { red: "border-red-500/40 bg-red-500/10", amber: "border-amber-500/40 bg-amber-500/10", blue: "border-sky-500/30 bg-sky-500/10" };
const when = (v: string) => new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(v));
const detail = (m: Record<string, unknown> | null) => {
  if (!m) return "";
  const parts: string[] = [];
  if (m.device) parts.push(String(m.device));
  if (Array.isArray(m.reasons)) parts.push(m.reasons.join("; "));
  if (m.attempt) parts.push(`intento ${m.attempt}`);
  if (m.alertsInTenMinutes) parts.push(`${m.alertsInTenMinutes} alertas en 10 min`);
  if (m.actionsInTenMinutes) parts.push(`${m.actionsInTenMinutes} acciones en 10 min`);
  if (m.failedInTenMinutes) parts.push(`${m.failedInTenMinutes} fallos en 10 min`);
  if (m.reason) parts.push(String(m.reason));
  return parts.join(" · ");
};

// Centro de seguridad: medidas activas, cuentas bloqueadas y eventos de los ultimos 7 dias.
export default function SecurityCenterPage() {
  const { user } = useAuth(), client = useQueryClient();
  const [filter, setFilter] = useState("ALL"), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [revoking, setRevoking] = useState<{ userId: string; name: string } | null>(null), [reason, setReason] = useState("");
  const query = useQuery({ queryKey: ["security-overview", user?.id], queryFn: async () => (await api.get<Overview>("/security/overview")).data, refetchInterval: 30000 });
  const d = query.data;
  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError("");
    try { await fn(); await client.invalidateQueries({ queryKey: ["security-overview"] }); return true; }
    catch (err) { setError(getErrorMessage(err, "No se pudo completar la acción")); return false; } finally { setBusy(false); }
  }
  async function revoke(e: FormEvent) { e.preventDefault(); if (revoking && await run(() => api.post(`/security/users/${revoking.userId}/revoke-sessions`, { reason }))) { setRevoking(null); setReason(""); } }
  const events = (d?.events ?? []).filter((e) => filter === "ALL" || (labels[e.action]?.[1] ?? "blue") === filter);
  const alarms = d ? ["AUTH_ACCOUNT_LOCKED", "AUTH_REFRESH_REPLAY_BLOCKED", "ATTENDANCE_SHARED_DEVICE", "SECURITY_ANOMALY_MASS_CHANGE", "SECURITY_ANOMALY_BRUTE_FORCE", "AUTH_LOGIN_WHILE_LOCKED"].reduce((s, a) => s + (d.counts[a] ?? 0), 0) : 0;

  return <ProtectedLayout><main className="screen-body space-y-5">
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-6 w-6 text-red-400" aria-hidden /> Centro de seguridad</h1>
      <p className="mt-1 text-sm text-[var(--mut)]">Intentos de ingreso, fraudes posibles y medidas activas. Se actualiza cada 30 segundos; cada evento queda en la auditoría inalterable.</p>
    </header>
    {query.isLoading && <ListSkeleton label="Cargando" />}
    {query.isError && <ErrorNotice>No se pudo cargar el centro de seguridad. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {d && <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Alarmas (7 días)", alarms, alarms ? "text-red-300" : "text-emerald-300"], ["Ingresos fallidos", d.counts.AUTH_LOGIN_FAILED ?? 0, ""], ["Cuentas bloqueadas ahora", d.lockedAccounts.length, d.lockedAccounts.length ? "text-amber-300" : ""], ["Ubicaciones sospechosas", d.counts.PRESENCE_GPS_SUSPICIOUS ?? 0, ""]].map(([l, v, t]) => <div key={String(l)} className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3"><p className="text-xs text-[var(--mut)]">{l}</p><p className={`text-2xl font-black ${t}`}>{typeof v === "number" ? <CountUp value={v} /> : v}</p></div>)}
      </div>

      <section className={`rounded-xl border p-3 text-sm ${d.protection.auditAppendOnly ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10"}`}>
        <p className="flex items-center gap-2 font-bold">{d.protection.auditAppendOnly ? <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden /> : <ShieldAlert className="h-4 w-4 text-red-300" aria-hidden />}{d.protection.auditAppendOnly ? "Auditoría protegida: ningún registro se puede modificar ni borrar" : "¡Atención! La protección de la auditoría no está activa en la base de datos"}</p>
        <details className="mt-2"><summary className="cursor-pointer text-[var(--mut)]">Medidas de seguridad activas ({d.protection.measures.length})</summary><ul className="mt-2 list-disc space-y-1 pl-5">{d.protection.measures.map((m) => <li key={m}>{m}</li>)}</ul></details>
      </section>

      {d.lockedAccounts.length > 0 && <section aria-labelledby="locked-title"><h2 id="locked-title" className="mb-2 font-bold">Cuentas bloqueadas</h2><ul className="space-y-2">{d.lockedAccounts.map((u) => <li key={u.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3"><span className="flex items-center gap-2"><Lock className="h-4 w-4" aria-hidden /><strong>{u.name}</strong><span className="text-sm text-[var(--mut)]">hasta las {when(u.lockedUntil).slice(-5)}</span></span><button type="button" disabled={busy} className="app-button app-button-outline w-auto" onClick={() => run(() => api.post(`/security/users/${u.userId}/unlock`))}><LockOpen className="h-4 w-4" /> Desbloquear</button></li>)}</ul></section>}

      {d.sessionsWarning.length > 0 && <section aria-labelledby="sessions-title"><h2 id="sessions-title" className="mb-2 font-bold">Cuentas con muchas sesiones abiertas</h2><p className="mb-2 text-sm text-[var(--mut)]">Cuatro o más dispositivos con la misma cuenta puede indicar una contraseña compartida.</p><ul className="space-y-2">{d.sessionsWarning.map((s) => <li key={s.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3"><span><strong>{s.name}</strong> <span className="text-sm text-[var(--mut)]">· {s.active} sesiones activas</span></span>{s.userId !== user?.id && <button type="button" className="app-button app-button-outline w-auto" onClick={() => { setReason(""); setRevoking({ userId: s.userId, name: s.name }); }}>Cerrar todas</button>}</li>)}</ul></section>}

      <section aria-labelledby="events-title">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 id="events-title" className="font-bold">Eventos de los últimos 7 días</h2>
          <div role="tablist" aria-label="Gravedad" className="inline-flex rounded-xl border border-[var(--bord)] bg-[var(--card)] p-1">{([["ALL", "Todos"], ["red", "Graves"], ["amber", "Atención"], ["blue", "Info"]] as const).map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`rounded-lg px-3 py-1 text-sm font-semibold ${filter === v ? "bg-red-600 text-white" : "text-white/65"}`}>{l}</button>)}</div>
        </div>
        {!events.length && <p className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-4 text-center text-sm text-[var(--mut)]">Sin eventos en este período.</p>}
        <ul className="space-y-2">{events.map((e) => { const [label, t] = labels[e.action] ?? [e.action, "blue"]; return <li key={e.id} className={`rounded-xl border p-3 text-sm ${tone[t]}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2"><strong>{label}</strong><time className="text-xs text-[var(--mut)]">{when(e.createdAt)}</time></div>
          <p className="mt-0.5">{e.target ? <>Cuenta: <strong>{e.target}</strong></> : <>Por: <strong>{e.actor}</strong></>}{detail(e.metadata) ? <span className="text-[var(--mut)]"> · {detail(e.metadata)}</span> : null}</p>
        </li>; })}</ul>
      </section>
    </>}

    {revoking && <OperationDialog title="Cerrar todas las sesiones" pending={busy} onClose={() => setRevoking(null)}><form onSubmit={revoke}><fieldset disabled={busy} className="space-y-3">
      <p className="text-sm">Se cerrarán todas las sesiones de <strong>{revoking.name}</strong> en todos sus dispositivos y se le avisará.</p>
      <Field label="Motivo"><textarea autoFocus className="app-input min-h-20" required minLength={10} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <button className="app-button app-button-red">Cerrar sesiones</button>
    </fieldset></form></OperationDialog>}
  </main></ProtectedLayout>;
}
