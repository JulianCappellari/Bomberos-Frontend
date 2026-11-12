"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Siren,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useOperationalReadiness } from "@/hooks/use-dashboard";
import { OperationalReadinessStatus } from "@/types/readiness";

const statusConfig: Record<
  OperationalReadinessStatus,
  { label: string; description: string; className: string }
> = {
  READY: {
    label: "Listos para responder",
    description: "Dotacion, mando y unidad verificados.",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  LIMITED: {
    label: "Respuesta limitada",
    description: "Hay capacidad de salida, pero existen advertencias.",
    className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-100",
  },
  NOT_READY: {
    label: "Sin alistamiento",
    description: "Hay bloqueos que impiden una salida segura.",
    className: "border-red-500/30 bg-red-500/10 text-red-200",
  },
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function phaseLabel(phase: "UPCOMING" | "ACTIVE" | "FINISHED") {
  if (phase === "ACTIVE") return "En curso";
  if (phase === "UPCOMING") return "Proxima";
  return "Finalizada";
}

export default function ReadinessPage() {
  const { data, isLoading, isError, isFetching, refetch } =
    useOperationalReadiness();

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="section-title mb-1 mt-0">
              Alistamiento operativo
            </div>
            <p className="text-sm text-[var(--mut)]">
              Capacidad real de respuesta del cuartel en este momento.
            </p>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Actualizar alistamiento"
            title="Actualizar"
          >
            <RefreshCw
              className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {isLoading && (
          <div className="card text-sm text-[var(--mut)]">
            Calculando alistamiento...
          </div>
        )}

        {isError && (
          <div className="card border-red-500/30 bg-red-500/10 text-sm text-red-200">
            No se pudo calcular el estado operativo.
          </div>
        )}

        {data && (
          <>
            <section
              className={`card border ${statusConfig[data.status].className}`}
            >
              <div className="flex items-start gap-3">
                {data.status === "READY" ? (
                  <CheckCircle2 className="h-8 w-8 shrink-0" />
                ) : data.status === "LIMITED" ? (
                  <AlertTriangle className="h-8 w-8 shrink-0" />
                ) : (
                  <XCircle className="h-8 w-8 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold uppercase">
                    {statusConfig[data.status].label}
                  </h1>
                  <p className="mt-1 text-sm opacity-80">
                    {statusConfig[data.status].description}
                  </p>
                  <p className="mt-2 text-xs opacity-70">
                    Actualizado a las {formatTime(data.generatedAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <Metric
                icon={<Users className="h-5 w-5" />}
                label="Presentes"
                value={`${data.personnel.presentCount}/${data.recommendedCrewSize}`}
              />
              <Metric
                icon={<ShieldCheck className="h-5 w-5" />}
                label="Mando"
                value={String(data.personnel.commandPresentCount)}
              />
              <Metric
                icon={<Truck className="h-5 w-5" />}
                label="Unidades listas"
                value={`${data.vehicles.readyCount}/${data.vehicles.total}`}
              />
              <Metric
                icon={<Siren className="h-5 w-5" />}
                label="Alertas activas"
                value={String(data.alerts.activeCount)}
              />
            </section>

            {(data.blockingReasons.length > 0 ||
              data.warnings.length > 0) && (
              <section className="card space-y-2">
                <div className="section-title mb-2 mt-0">Diagnóstico</div>
                {data.blockingReasons.map((reason) => (
                  <Notice key={reason} critical text={reason} />
                ))}
                {data.warnings.map((warning) => (
                  <Notice key={warning} text={warning} />
                ))}
              </section>
            )}

            <section className="grid gap-4 xl:grid-cols-2">
              <div className="card">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="section-title mb-0 mt-0">
                    Personal disponible
                  </div>
                  <Link
                    href="/station"
                    className="text-xs font-bold uppercase text-red-300"
                  >
                    Ver cuartel
                  </Link>
                </div>
                {data.personnel.items.length === 0 ? (
                  <Empty text="No hay personal presente." />
                ) : (
                  <div className="space-y-2">
                    {data.personnel.items.map((person) => (
                      <div
                        key={person.attendanceId}
                        className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--bord)] bg-[var(--card2)] p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-bold text-white">
                            {person.fullName}
                          </div>
                          <div className="text-xs text-[var(--mut)]">
                            {person.rank || "Sin cargo"} · Ingreso{" "}
                            {formatTime(person.checkInAt)}
                          </div>
                        </div>
                        {person.isCommand && (
                          <span className="badge badge-green shrink-0">
                            Mando
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="section-title mb-0 mt-0">
                    Cobertura de guardia
                  </div>
                  <Link
                    href="/calendar"
                    className="text-xs font-bold uppercase text-red-300"
                  >
                    Calendario
                  </Link>
                </div>
                {data.shifts.items.length === 0 ? (
                  <Empty text="No hay guardias programadas hoy." />
                ) : (
                  <div className="space-y-2">
                    {data.shifts.items.map((shift) => (
                      <div
                        key={shift.id}
                        className="rounded-[8px] border border-[var(--bord)] bg-[var(--card2)] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold text-white">
                            {shift.shiftType}
                          </div>
                          <span
                            className={`badge ${
                              shift.phase === "ACTIVE"
                                ? "badge-green"
                                : "badge-yellow"
                            }`}
                          >
                            {phaseLabel(shift.phase)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--mut)]">
                          {shift.startTime} - {shift.endTime} ·{" "}
                          {shift.presentAssignedCount}/{shift.assignedCount}{" "}
                          presentes
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
                          <div
                            className="h-full bg-red-500"
                            style={{
                              width: `${Math.min(100, shift.coveragePercent)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="card">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="section-title mb-0 mt-0">
                  Unidades para salida
                </div>
                <Link
                  href="/equipment"
                  className="text-xs font-bold uppercase text-red-300"
                >
                  Equipamiento
                </Link>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {data.vehicles.items.map((vehicle) => (
                  <Link
                    key={vehicle.vehicleId}
                    href={`/equipment/${vehicle.vehicleAssetId}`}
                    className="rounded-[8px] border border-[var(--bord)] bg-[var(--card2)] p-3 transition hover:border-red-500/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-white">
                          {vehicle.name}
                        </div>
                        <div className="text-xs text-[var(--mut)]">
                          Unidad {vehicle.unitNumber}
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          vehicle.ready ? "badge-green" : "badge-red"
                        }`}
                      >
                        {vehicle.ready ? "Lista" : "No disponible"}
                      </span>
                    </div>
                    {vehicle.blockers.length > 0 && (
                      <div className="mt-2 text-xs text-red-300">
                        {vehicle.blockers.join(" · ")}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>

            {data.alerts.items.length > 0 && (
              <section className="card">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="section-title mb-0 mt-0">
                    Respuesta a alertas
                  </div>
                  <Link
                    href="/alerts"
                    className="text-xs font-bold uppercase text-red-300"
                  >
                    Ver alertas
                  </Link>
                </div>
                <div className="space-y-2">
                  {data.alerts.items.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex flex-col gap-2 rounded-[8px] border border-[var(--bord)] bg-[var(--card2)] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-bold text-white">
                          {alert.location}
                        </div>
                        <div className="text-xs text-[var(--mut)]">
                          {({ FIRE: "Incendio", RESCUE: "Rescate", ACCIDENT: "Accidente", CHEMICAL: "Químico", MEDICAL: "Médico", FLOOD: "Inundación", OTHER: "Otro" } as Record<string, string>)[alert.type] ?? alert.type} · {formatTime(alert.createdAt)}
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="badge badge-yellow">
                          {alert.goingCount} confirmados
                        </span>
                        <span className="badge badge-green">
                          {alert.presentResponderCount} presentes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </ProtectedLayout>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-red-500/10 text-red-400">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs uppercase text-[var(--mut)]">{label}</div>
      </div>
    </div>
  );
}

function Notice({
  text,
  critical = false,
}: {
  text: string;
  critical?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-[8px] border p-3 text-sm ${
        critical
          ? "border-red-500/25 bg-red-500/10 text-red-200"
          : "border-yellow-500/25 bg-yellow-500/10 text-yellow-100"
      }`}
    >
      {critical ? (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {text}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[8px] border border-dashed border-[var(--bord)] p-3 text-sm text-[var(--mut)]">
      <Clock3 className="h-4 w-4" />
      {text}
    </div>
  );
}
