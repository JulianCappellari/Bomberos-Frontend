"use client";

import { useMemo, useState } from "react";
import { Activity, ClipboardList, Filter } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuditLogs } from "@/hooks/use-audit";
import { AuditLog } from "@/types/audit";

function actorName(log: AuditLog) {
  return log.actor?.profile?.fullName || log.actor?.username || "Sistema";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function metadataPreview(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "Sin metadata";

  const entries = Object.entries(metadata as Record<string, unknown>).slice(0, 3);
  if (entries.length === 0) return "Sin metadata";

  return entries
    .map(([key, value]) => `${key}: ${String(value).slice(0, 40)}`)
    .join(" · ");
}

export default function ActivityPage() {
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const params = useMemo(
    () => ({
      limit: 80,
      entityType: entityType.trim() || undefined,
      action: action.trim() || undefined,
    }),
    [action, entityType],
  );
  const { data: logs = [], isLoading, isError } = useAuditLogs(params);

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <section className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="section-title mb-1 mt-0">
                Actividad del sistema
              </div>
              <p className="text-sm text-[var(--mut)]">
                Auditoria operativa de cambios, cierres, asignaciones y controles.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniMetric label="Eventos" value={logs.length} />
            <MiniMetric
              label="Entidades"
              value={new Set(logs.map((log) => log.entityType)).size}
            />
          </div>
        </section>

        <section className="card">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <Filter className="h-4 w-4 text-red-400" />
            Filtros
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="app-label">Entidad</span>
              <input
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
                className="app-input"
                placeholder="Alert, Incident, Shift..."
              />
            </label>
            <label>
              <span className="app-label">Accion</span>
              <input
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="app-input"
                placeholder="INCIDENT_CLOSED..."
              />
            </label>
          </div>
        </section>

        {isLoading && (
          <div className="card text-sm text-[var(--mut)]">
            Cargando actividad...
          </div>
        )}

        {isError && (
          <div className="card border-red-500/30 bg-red-500/10 text-sm text-red-300">
            No se pudo cargar la auditoria. Solo ADMIN y OPERATOR pueden verla.
          </div>
        )}

        {!isLoading && !isError && logs.length === 0 && (
          <div className="card text-sm text-[var(--mut)]">
            No hay eventos para esos filtros.
          </div>
        )}

        <section className="space-y-3">
          {logs.map((log) => (
            <article key={log.id} className="card">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold text-white">
                        {formatAction(log.action)}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--mut)]">
                        {log.entityType} · {log.entityId}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--dim)]">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[var(--txt)]">
                    {actorName(log)}
                  </p>
                  <p className="mt-2 break-words text-xs text-[var(--mut)]">
                    {metadataPreview(log.metadata)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </ProtectedLayout>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3 text-center">
      <div className="font-['Bebas_Neue'] text-3xl text-red-400">
        {value}
      </div>
      <div className="text-xs uppercase tracking-[0.08em] text-[var(--mut)]">
        {label}
      </div>
    </div>
  );
}
