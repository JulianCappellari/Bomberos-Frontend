"use client";
import { useState } from "react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { useAuditLogs } from "@/hooks/use-audit";
import { AuditLog } from "@/types/audit";
import { useAuth } from "@/features/auth/auth-context";
import { auditAction, auditDate, auditEntities, auditEntity, auditMetadata } from "@/lib/audit-presentation";

function LogDetail({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  return <article className="border-b border-[var(--bord)] py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-bold">{auditAction(log.action)}</h2><p className="mt-1 text-sm">{log.actor?.profile?.fullName || log.actor?.username || "Sistema"}{log.actor?.profile?.rank ? ` · ${log.actor.profile.rank}` : ""}</p><p className="mt-1 text-xs text-[var(--mut)]">{auditEntity(log.entityType)}</p></div><time className="text-xs text-[var(--mut)]">{auditDate(log.createdAt)}</time></div>
    <details className="mt-3" onToggle={e => setOpen(e.currentTarget.open)}><summary className="cursor-pointer text-sm font-semibold">Ver detalle de la accion</summary>{open && <div className="mt-3"><dl className="divide-y divide-[var(--bord)]">{auditMetadata(log.metadata).map((row, index) => <div key={index} className="grid gap-1 py-2 text-sm sm:grid-cols-[minmax(130px,0.4fr)_minmax(0,1fr)]"><dt className="break-words text-[var(--mut)]">{row.label}</dt><dd className="whitespace-pre-wrap break-words">{row.value}</dd></div>)}</dl>{!log.metadata && <p className="text-sm text-[var(--mut)]">No se registraron datos adicionales para esta accion.</p>}<p className="mt-4 break-all text-xs text-[var(--mut)]">Referencia del registro: {log.entityId}<br />Referencia de auditoria: {log.id}</p></div>}</details>
  </article>;
}
export default function ActivityPage() {
  const { user } = useAuth();
  const [entityType, setEntity] = useState(""), [action, setAction] = useState(""), [query, setQuery] = useState(""), [from, setFrom] = useState(""), [to, setTo] = useState("");
  const logs = useAuditLogs({ limit: 100, entityType: entityType || undefined, action: action || undefined, q: query || undefined, from: from ? `${from}T00:00:00-03:00` : undefined, to: to ? `${to}T23:59:59.999-03:00` : undefined });
  if (user?.role !== "ADMIN") return <ProtectedLayout><main className="screen-body"><ErrorNotice>Solo administracion puede consultar la auditoria.</ErrorNotice></main></ProtectedLayout>;
  return <ProtectedLayout><main className="screen-body"><h1 className="text-2xl font-bold">Auditoria del sistema</h1><p className="my-3 text-sm text-[var(--mut)]">Quien realizo cada accion, cuando y que datos cambiaron.</p>
    <form className="my-5 grid gap-3 border-y border-[var(--bord)] py-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={e => e.preventDefault()}>
      <Field label="Buscar persona o referencia"><input className="app-input" type="search" value={query} onChange={e => setQuery(e.target.value)} /></Field>
      <Field label="Tipo de registro"><select className="app-input" value={entityType} onChange={e => setEntity(e.target.value)}><option value="">Todos los registros</option>{Object.entries(auditEntities).sort((a, b) => a[1].localeCompare(b[1], "es")).map(([code, text]) => <option key={code} value={code}>{text}</option>)}</select></Field>
      <Field label="Desde"><input type="date" className="app-input" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} /></Field><Field label="Hasta"><input type="date" className="app-input" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">{[["", "Todas las acciones"], ["CREATED", "Altas"], ["UPDATED", "Modificaciones"], ["PAYMENT", "Pagos"], ["ARCHIVED", "Bajas de cuenta"], ["ACKNOWLEDGED", "Lecturas confirmadas"], ["HTTP_ACCESS_DENIED", "Accesos rechazados"]].map(([code, text]) => <button type="button" key={code} aria-pressed={action === code} className={`app-button w-auto ${action === code ? "app-button-red" : ""}`} onClick={() => setAction(code)}>{text}</button>)}<button type="button" className="text-sm underline" onClick={() => { setEntity(""); setAction(""); setQuery(""); setFrom(""); setTo(""); }}>Limpiar filtros</button></div>
    </form>
    {logs.isLoading && <p>Consultando auditoria...</p>}{logs.isError && <ErrorNotice>No se pudo cargar la auditoria. <button className="underline" onClick={() => logs.refetch()}>Reintentar</button></ErrorNotice>}
    {logs.data && <><p className="mb-3 text-xs text-[var(--mut)]">{logs.data.length} registros mostrados · Hasta 100 coincidencias mas recientes</p>{!logs.data.length && <p className="py-6 text-sm text-[var(--mut)]">No hay acciones que coincidan con los filtros.</p>}{logs.data.map(log => <LogDetail key={log.id} log={log} />)}</>}
  </main></ProtectedLayout>;
}
