"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BellRing, CalendarDays, CheckCircle2, ChevronRight, Gauge, MapPin, ScanLine, Siren } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { MyTasksPanel } from "@/components/operations/my-tasks-panel";
import { NextControlBanner } from "@/components/operations/next-control-banner";
import { QuickAvailability } from "@/components/operations/operational-availability";
import { PresentPersonnelPanel } from "@/components/operations/present-personnel-panel";
import { FireRiskPanel } from "@/components/operations/fire-risk-panel";
import { ReviewQueue } from "./review-queue";
import { MissionBriefing } from "@/components/operations/mission-briefing";
import { PushStatusBanner } from "@/components/operations/push-status-banner";
import { useAuth } from "@/features/auth/auth-context";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { api } from "@/lib/api-client";
import { getAlertsRequest } from "@/services/alerts.service";
import { visibleNavItems } from "@/lib/navigation";
import { alertTypeLabels, firstName, label, priorityShort } from "@/lib/labels";
import type { DashboardShiftSummary } from "@/types/dashboard";

type Profile = "COMMAND" | "GUARD" | "FIREFIGHTER" | "CADET" | "BOARD";

function profileOf(role?: string, rank?: string | null): Profile {
  const r = (rank || "").toLocaleLowerCase();
  if (role === "GUARD") return "GUARD";
  if (role === "ADMIN" || role === "OPERATOR") return "COMMAND";
  if (r === "comision directiva") return "BOARD";
  if (r.startsWith("aspirante")) return "CADET";
  return "FIREFIGHTER";
}

// Accesos de cada cargo, en orden de uso. Solo se muestran los que el permiso habilita.
const shortcuts: Record<Profile, string[]> = {
  FIREFIGHTER: ["/attendance", "/tasks", "/calendar", "/vehicle-control", "/chat", "/me"],
  CADET: ["/attendance", "/tasks", "/calendar", "/documents", "/chat", "/me"],
  GUARD: ["/guard-qr", "/guard-log", "/station", "/incidents", "/calendar", "/air-equipment"],
  COMMAND: ["/incidents", "/readiness", "/tasks", "/calendar", "/station", "/command"],
  BOARD: ["/documents", "/contacts", "/chat", "/reports", "/me"],
};

const time = (value: string) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const shiftDay = (value: string) => { const text = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value.slice(0, 10)}T12:00:00`)); return text.charAt(0).toLocaleUpperCase() + text.slice(1); };

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-bold text-white">{children}</h2>{action}</div>;
}

export function HomeScreen() {
  const { user } = useAuth();
  const profile = profileOf(user?.role, user?.profile?.rank);
  const summary = useDashboardSummary();
  const alerts = useQuery({ queryKey: ["alerts", "home", user?.id], queryFn: getAlertsRequest, enabled: Boolean(user), refetchInterval: 20000 });
  const unread = useQuery({ queryKey: ["notification-count", user?.id], queryFn: async () => (await api.get<{ unread: number }>("/members/notifications")).data, enabled: Boolean(user), refetchInterval: 30000 });

  const active = (alerts.data || []).filter((alert) => alert.status === "ACTIVE");
  const awaitingResponse = active.filter((alert) => alert.viewerIsRecipient && !alert.responses?.some((response) => response.userId === user?.id));
  const presence = summary.data?.attendance.isCurrentlyInside;
  const operations = summary.data?.ops;
  const showStation = profile === "COMMAND" || profile === "GUARD";
  const links = shortcuts[profile].map((href) => visibleNavItems(user).find((item) => item.href === href)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const todayText = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const today = todayText.charAt(0).toLocaleUpperCase() + todayText.slice(1);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <header>
          <p className="text-sm text-white/60">{today}</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Hola, {firstName(user?.profile?.fullName, user?.username)}</h1>
          <p className="mt-1 text-sm text-white/60">{user?.profile?.rank || "Sin cargo"}{user?.profile?.badge ? ` · Legajo ${user.profile.badge}` : ""}{user?.role === "GUARD" ? " · En función de guardia" : ""}</p>
        </header>

        <PushStatusBanner />
        <MissionBriefing />

        {awaitingResponse.length > 0 && (
          <section aria-label="Alertas que esperan tu respuesta" className="space-y-2">
            {awaitingResponse.map((alert) => (
              <Link key={alert.id} href="/alerts" className="flex items-center gap-3 rounded-2xl border-2 border-red-500 bg-red-600/15 p-4 transition-colors hover:bg-red-600/25">
                <Siren className="h-7 w-7 shrink-0 text-red-400" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-white">{label(alertTypeLabels, alert.type)} · {label(priorityShort, alert.priority)}</span>
                  <span className="mt-0.5 flex items-center gap-1 truncate text-sm text-white/80"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />{alert.location}</span>
                </span>
                <span className="shrink-0 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white">Responder</span>
              </Link>
            ))}
          </section>
        )}

        {profile !== "BOARD" && (
          <section aria-label="Mi estado" className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Presencia en el cuartel</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-bold text-white">{summary.isLoading ? "Consultando…" : presence ? `En el cuartel desde ${summary.data?.myOpenAttendance?.checkInAt ? time(summary.data.myOpenAttendance.checkInAt) : "hoy"}` : "Fuera del cuartel"}</p>
                {profile !== "GUARD" && <Link href="/attendance" className="app-button w-auto shrink-0"><ScanLine className="h-4 w-4" aria-hidden />{presence ? "Registrar salida" : "Registrar ingreso"}</Link>}
              </div>
            </div>
            <QuickAvailability />
          </section>
        )}

        <FireRiskPanel />

        <section aria-label="Pendientes">
          <SectionTitle>Para hacer</SectionTitle>
          <div className="space-y-2">
            <NextControlBanner />
            {(unread.data?.unread ?? 0) > 0 && (
              <Link href="/notifications" className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[var(--card)] p-3 hover:border-white/20">
                <BellRing className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                <span className="flex-1 text-sm text-white">{unread.data!.unread === 1 ? "Tenés 1 notificación sin leer" : `Tenés ${unread.data!.unread} notificaciones sin leer`}</span>
                <ChevronRight className="h-4 w-4 text-white/40" aria-hidden />
              </Link>
            )}
            {!awaitingResponse.length && !(unread.data?.unread) && (
              <p className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[var(--card)] p-3 text-sm text-white/70"><CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />No tenés alertas ni avisos pendientes.</p>
            )}
          </div>
          <MyTasksPanel />
        </section>

        {profile === "COMMAND" && <ReviewQueue />}

        <section aria-label="Accesos rápidos">
          <SectionTitle>Accesos rápidos</SectionTitle>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {links.map(({ href, label: name, description, Icon }) => (
              <Link key={href} href={href} className="flex min-h-16 items-center gap-3 rounded-xl border border-white/[0.08] bg-[var(--card)] p-3 transition-colors hover:border-red-500/40 hover:bg-white/[0.04]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-300"><Icon className="h-5 w-5" aria-hidden /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold leading-tight text-white">{name}</span><span className="mt-0.5 hidden text-xs leading-snug text-white/55 sm:block">{description}</span></span>
              </Link>
            ))}
          </nav>
        </section>

        <MyShifts shifts={summary.data?.myUpcomingShifts ?? []} loading={summary.isLoading} />

        {showStation && operations && (
          <section aria-label="Estado del cuartel">
            <SectionTitle action={<Link href="/readiness" className="flex items-center gap-1 text-sm text-red-300 hover:text-red-200">Estado completo<ChevronRight className="h-4 w-4" aria-hidden /></Link>}>Estado del cuartel</SectionTitle>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Alertas activas", summary.data?.activeAlerts ?? 0, (summary.data?.activeAlerts ?? 0) > 0],
                ["Intervenciones abiertas", operations.openIncidents, operations.openIncidents > 0],
                ["Personal en el cuartel", operations.inStation, false],
                ["Móviles operativos", `${operations.vehicles.operational} de ${operations.vehicles.total}`, operations.vehicles.operational < operations.vehicles.total],
              ].map(([name, value, warn]) => (
                <div key={String(name)} className={`rounded-xl border p-3 ${warn ? "border-amber-500/40 bg-amber-500/10" : "border-white/[0.08] bg-[var(--card)]"}`}>
                  <dt className="text-xs text-white/60">{name}</dt>
                  <dd className="mt-1 text-2xl font-bold text-white">{value}</dd>
                </div>
              ))}
            </dl>
            {operations.operationalWarnings.length > 0 && (
              <ul className="mt-3 space-y-2">
                {operations.operationalWarnings.slice(0, 4).map((warning) => (
                  <li key={warning.code}><Link href={warning.href} className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${warning.severity === "HIGH" ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-amber-500/40 bg-amber-500/10 text-amber-100"}`}><Gauge className="h-4 w-4 shrink-0" aria-hidden /><span className="flex-1">{warning.message}</span><ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden /></Link></li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Pedido del cuartel: ultimas alertas junto al personal presente en tiempo real, para todos. */}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section aria-label="Últimas alertas">
            <SectionTitle action={<Link href="/alerts" className="flex items-center gap-1 text-sm text-red-300 hover:text-red-200">Ver todas<ChevronRight className="h-4 w-4" aria-hidden /></Link>}>Últimas alertas</SectionTitle>
            {alerts.isLoading ? <p role="status" className="text-sm text-white/60">Cargando…</p> : (alerts.data || []).length === 0 ? <p className="rounded-xl border border-white/[0.08] bg-[var(--card)] p-3 text-sm text-white/60">No hay alertas registradas.</p> : (
              <ul className="space-y-2">
                {(alerts.data || []).slice(0, 3).map((alert) => (
                  <li key={alert.id}><Link href="/alerts" className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[var(--card)] p-3 hover:border-white/20">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${alert.status === "ACTIVE" ? "bg-red-500" : "bg-white/25"}`} aria-hidden />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{label(alertTypeLabels, alert.type)} · {alert.location}</span><span className="block text-xs text-white/55">{alert.status === "ACTIVE" ? "Activa" : alert.status === "CANCELLED" ? "Cancelada" : "Resuelta"} · {new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(alert.createdAt))}</span></span>
                  </Link></li>
                ))}
              </ul>
            )}
          </section>
          <PresentPersonnelPanel />
        </div>
        {summary.isError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">No se pudo actualizar el resumen. Revisá la conexión; los datos se reintentan solos.</p>}
      </div>
    </ProtectedLayout>
  );
}

function MyShifts({ shifts, loading }: { shifts: DashboardShiftSummary[]; loading: boolean }) {
  return (
    <section aria-label="Mis próximas guardias">
      <SectionTitle action={<Link href="/calendar" className="flex items-center gap-1 text-sm text-red-300 hover:text-red-200">Calendario<ChevronRight className="h-4 w-4" aria-hidden /></Link>}>Mis próximas guardias</SectionTitle>
      {loading ? <p className="text-sm text-white/60" role="status">Cargando…</p> : shifts.length === 0 ? (
        <p className="rounded-xl border border-white/[0.08] bg-[var(--card)] p-3 text-sm text-white/60">No tenés guardias asignadas en los próximos 14 días.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {shifts.slice(0, 2).map((shift) => (
            <li key={shift.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-[var(--card)] p-3">
              <CalendarDays className="h-5 w-5 shrink-0 text-sky-300" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{shiftDay(shift.date)}</p>
                <p className="truncate text-xs text-white/60">{shift.startTime} a {shift.endTime} · {shift.assignedCount} {shift.assignedCount === 1 ? "persona" : "personas"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
