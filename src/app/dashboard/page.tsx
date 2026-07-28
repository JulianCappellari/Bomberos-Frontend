"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Clock3,
  Radio,
  MessageCircle,
  ShieldCheck,
  Siren,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { DashboardAlert, VehicleControlReadiness } from "@/types/dashboard";

function formatTimeAgo(value: string) {
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return "sin fecha";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date) / 60000));
  if (diffMinutes < 1) return "recién";
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
}

function priorityClass(priority: DashboardAlert["priority"]) {
  if (priority === "HIGH") return "badge-red";
  if (priority === "MEDIUM") return "badge-yellow";
  return "badge-green";
}

function formatActionLabel(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function controlReadinessLabel(readiness: VehicleControlReadiness) {
  const labels: Record<VehicleControlReadiness, string> = {
    OK: "Al dia",
    ISSUES: "Con novedades",
    OVERDUE: "Vencido",
    DUE_SOON: "Por vencer",
    NO_CONTROL: "Sin control",
  };

  return labels[readiness];
}

function controlReadinessClass(readiness: VehicleControlReadiness) {
  if (readiness === "OK") return "badge-green";
  if (readiness === "DUE_SOON") return "badge-yellow";
  return "badge-red";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading, isError } = useDashboardSummary();
  const ops = summary?.ops ?? null;

  return (
    <ProtectedLayout>
      <div className="screen-body screen-body-no-nav">
        <section
          className="card"
          style={{
            background: "linear-gradient(135deg, var(--card), #1a0a0a)",
            borderColor: "rgba(230,60,60,.3)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[var(--mut)]">
                Bienvenido
              </div>
              <div className="text-[22px] font-bold uppercase tracking-[1px]">
                {user?.profile?.fullName || user?.username}
              </div>
              <div className="mt-1 text-[13px] text-[var(--mut)]">
                {user?.profile?.rank || "Sin rango"} ·{" "}
                {user?.profile?.badge || "Sin legajo"}
              </div>
            </div>

            <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px] border-[var(--red)] bg-[var(--card2)] text-red-400">
              <ShieldCheck className="h-9 w-9" />
            </div>
          </div>

          <div className="my-3 h-px bg-[var(--bord)]" />

          <div className="flex items-center justify-between">
            <span className="badge badge-green">
              {summary?.attendance.isCurrentlyInside
                ? "En cuartel"
                : "Activo"}
            </span>
            <span className="text-[12px] text-[var(--mut)]">
              {summary?.myOpenAttendance?.station.name || "Cuartel Sampacho"}
            </span>
          </div>
        </section>

        {isError && (
          <div className="card border-red-500/30 bg-red-500/10 text-sm text-red-300">
            No se pudo cargar el resumen operativo. Verificá que el backend esté
            activo.
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            icon={<Clock3 className="h-5 w-5" />}
            value={
              isLoading
                ? "..."
                : summary?.attendance.currentMonthFormatted ?? "0h 0m"
            }
            label="Horas este mes"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            value={isLoading ? "..." : String(summary?.activeAlerts ?? 0)}
            label="Alertas activas"
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            value={isLoading ? "..." : String(ops?.openIncidents ?? 0)}
            label="Incidentes abiertos"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            value={isLoading ? "..." : String(ops?.inStation ?? 0)}
            label="En cuartel"
          />
        </section>

        <QuickActionsGrid />

        {ops && (
          <section className="card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="section-title mb-0 mt-0">Estado operativo</div>
                <p className="text-sm text-[var(--mut)]">
                  Vehículos y dotación monitoreados en tiempo real.
                </p>
              </div>
              <Truck className="h-7 w-7 text-red-400" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <MiniMetric label="Vehículos" value={ops.vehicles.total} />
              <MiniMetric label="Operativos" value={ops.vehicles.operational} />
              <MiniMetric
                label="Mantenimiento"
                value={ops.vehicles.maintenance}
              />
              <MiniMetric label="Personal" value={ops.activeUsers} />
            </div>

            {ops.vehiclesNeedingAttention.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--mut)]">
                  Atención requerida
                </div>
                {ops.vehiclesNeedingAttention.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/equipment/${vehicle.id}`}
                    className="flex items-center justify-between rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">{vehicle.name}</span>
                    <span className="badge badge-yellow">{vehicle.status}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--mut)]">
                  Controles vehiculares
                </div>
                <span className="text-xs text-[var(--dim)]">
                  Cada {ops.vehicleControls.intervalDays} dias
                </span>
              </div>

              {ops.vehicleControls.items.length > 0 ? (
                ops.vehicleControls.items.map((control) => (
                  <Link
                    key={control.vehicleId}
                    href={`/equipment/${control.vehicleAssetId}`}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {control.name}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--mut)]">
                        {control.lastInspectionAt
                          ? `Ultimo control ${formatTimeAgo(
                              control.lastInspectionAt,
                            )}`
                          : "Sin control registrado"}
                      </div>
                    </div>
                    <span
                      className={`badge shrink-0 ${controlReadinessClass(
                        control.readiness,
                      )}`}
                    >
                      {controlReadinessLabel(control.readiness)}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  Todos los vehiculos tienen controles vigentes y sin
                  novedades.
                </div>
              )}
            </div>
          </section>
        )}

        <div className="section-title">Últimas alertas</div>

        <section className="space-y-2">
          {isLoading ? (
            <div className="card text-sm text-[var(--mut)]">
              Cargando alertas...
            </div>
          ) : summary?.recentAlerts.length ? (
            summary.recentAlerts.map((alert) => (
              <Link
                key={alert.id}
                href="/alerts"
                className="card flex items-start gap-3 transition hover:border-red-500/40"
              >
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-bold text-white">
                      {alert.title}
                    </h3>
                    <span className={`badge ${priorityClass(alert.priority)}`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--mut)]">
                    {alert.location}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--dim)]">
                    <span>
                      {alert.createdBy.fullName || alert.createdBy.username}
                    </span>
                    <span>{formatTimeAgo(alert.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="card text-sm text-[var(--mut)]">
              No hay alertas activas.
            </div>
          )}
        </section>

        {ops?.recentActivity.length ? (
          <section className="card">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="section-title mb-0 mt-0">Actividad reciente</div>
                <p className="text-sm text-[var(--mut)]">
                  Últimos cambios auditados del sistema.
                </p>
              </div>
              <ClipboardList className="h-7 w-7 text-red-400" />
            </div>

            <div className="space-y-2">
              {ops.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">
                        {formatActionLabel(activity.action)}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--mut)]">
                        {activity.entityType} ·{" "}
                        {activity.actor?.fullName ||
                          activity.actor?.username ||
                          "Sistema"}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--dim)]">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </ProtectedLayout>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="stat-card">
      <div className="mb-2 flex justify-center text-red-400">{icon}</div>
      <div className="stat-num">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3 text-center">
      <div className="font-['Bebas_Neue'] text-2xl text-red-400">{value}</div>
      <div className="text-xs uppercase tracking-[0.08em] text-[var(--mut)]">
        {label}
      </div>
    </div>
  );
}

function QuickActionsGrid() {
  return (
    <>
      <div className="section-title">Acciones rápidas</div>

      <div className="quick-grid">
        <QuickAction
          href="/alerts/new"
          label="Alertas"
          icon={<Radio className="h-7 w-7" />}
          danger
        />
        <QuickAction
          href="/attendance"
          label="Asistencia"
          icon={<Clock3 className="h-7 w-7" />}
        />
        <QuickAction
          href="/equipment"
          label="Equipamiento"
          icon={<Truck className="h-7 w-7" />}
        />
        <QuickAction
          href="/incidents"
          label="Incidentes"
          icon={<Siren className="h-7 w-7" />}
        />
        <QuickAction
          href="/chat"
          label="Chat"
          icon={<MessageCircle className="h-7 w-7" />}
        />
        <QuickAction
          href="/calendar"
          label="Guardias"
          icon={<CalendarDays className="h-7 w-7" />}
        />
        <QuickAction
          href="/station"
          label="Cuartel"
          icon={<UserCheck className="h-7 w-7" />}
        />
        <QuickAction
          href="/activity"
          label="Actividad"
          icon={<Activity className="h-7 w-7" />}
        />
      </div>
    </>
  );
}

function QuickAction({
  href,
  label,
  icon,
  danger = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Link href={href} className={`quick-btn ${danger ? "quick-btn-red" : ""}`}>
      <div className="quick-icon text-red-400">{icon}</div>
      <div className="quick-label">{label}</div>
    </Link>
  );
}
