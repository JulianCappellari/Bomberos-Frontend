"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { isCommand, isDutyManager } from "@/lib/permissions";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  Droplets,
  Flame,
  MapPin,
  Plus,
  ShieldPlus,
  Siren,
  Stethoscope,
  TestTube2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/get-error-message";
import {
  useAlerts,
  useCancelAlert,
  useRespondAlert,
  useResolveAlert,
} from "@/hooks/use-alerts";
import { useDispatchIncidentFromAlert } from "@/hooks/use-incidents";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedPage } from "@/components/ui/animated-layout";
import type { BackendAlert } from "@/services/alerts.service";

type EmergencyType =
  | "todas"
  | "incendio"
  | "rescate"
  | "accidente"
  | "quimico"
  | "medico"
  | "inundacion"
  | "otro";

type AlertStatus = "activa" | "resuelta" | "cancelada";
type AlertPriority = "alta" | "media" | "baja";

type AlertItem = {
  id: string;
  type: Exclude<EmergencyType, "todas">;
  title: string;
  address: string;
  description: string;
  author: string;
  timeAgo: string;
  priority: AlertPriority;
  status: AlertStatus;
  responsesCount: number;
  goingCount: number;
  notGoingCount: number;
  myResponse: "GOING" | "NOT_GOING" | null;
  canRespond: boolean;
  myAttendanceOutcome: "NO_SHOW" | null;
  incident: BackendAlert["incident"];
};

// Estado y tipo son filtros independientes: antes compartian una fila de chips cortada en celular.
const statusFilters = [
  { id: "activa", label: "Activas" },
  { id: "resuelta", label: "Resueltas" },
  { id: "cancelada", label: "Canceladas" },
  { id: "todas", label: "Todas" },
] as const;
type StatusFilter = (typeof statusFilters)[number]["id"];
const typeOptions: Array<{ id: EmergencyType; label: string }> = [
  { id: "todas", label: "Todos los tipos" }, { id: "incendio", label: "Incendio" }, { id: "rescate", label: "Rescate" },
  { id: "accidente", label: "Accidente" }, { id: "quimico", label: "Riesgo químico" }, { id: "medico", label: "Emergencia médica" },
  { id: "inundacion", label: "Inundación / clima" }, { id: "otro", label: "Otra emergencia" },
];

function mapBackendType(type: BackendAlert["type"]): AlertItem["type"] {
  switch (type) {
    case "FIRE":
      return "incendio";
    case "RESCUE":
      return "rescate";
    case "ACCIDENT":
      return "accidente";
    case "CHEMICAL":
      return "quimico";
    case "MEDICAL":
      return "medico";
    case "FLOOD":
      return "inundacion";
    default:
      return "otro";
  }
}

function mapBackendPriority(priority: BackendAlert["priority"]): AlertPriority {
  if (priority === "HIGH") return "alta";
  if (priority === "LOW") return "baja";
  return "media";
}

function mapBackendStatus(status: BackendAlert["status"]): AlertStatus {
  if (status === "ACTIVE") return "activa";
  return status === "CANCELLED" ? "cancelada" : "resuelta";
}

function formatTimeAgo(dateString: string) {
  const created = new Date(dateString).getTime();
  if (Number.isNaN(created)) return "sin fecha";

  const minutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
}

function getAuthorName(alert: BackendAlert) {
  return (
    alert.createdBy?.profile?.fullName?.trim() ||
    alert.createdBy?.username ||
    "Sistema"
  );
}

function mapAlert(alert: BackendAlert, userId?: string): AlertItem {
  const mappedType = mapBackendType(alert.type);

  const myVote = alert.responses?.find((response) => response.userId === userId);
  return {
    id: alert.id,
    type: mappedType,
    title:
      {
        incendio: "Incendio",
        rescate: "Rescate",
        accidente: "Accidente",
        quimico: "Riesgo Químico",
        medico: "Emergencia Médica",
        inundacion: "Inundación / Clima",
        otro: "Alerta Operativa",
      }[mappedType] || "Alerta",
    address: alert.location,
    description: alert.description || "Sin descripción proporcionada",
    author: getAuthorName(alert),
    timeAgo: formatTimeAgo(alert.createdAt),
    priority: mapBackendPriority(alert.priority),
    status: mapBackendStatus(alert.status),
    responsesCount: alert.responses?.length ?? 0,
    goingCount: alert.responses?.filter((response) => response.response === "GOING").length ?? 0,
    notGoingCount: alert.responses?.filter((response) => response.response === "NOT_GOING").length ?? 0,
    myResponse: myVote?.response ?? null,
    canRespond: Boolean(alert.viewerIsRecipient),
    myAttendanceOutcome: myVote?.attendanceOutcome ?? null,
    incident: alert.incident ?? null,
  };
}

export default function AlertsListPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useAlerts();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("activa");
  const [typeFilter, setTypeFilter] = useState<EmergencyType>("todas");

  const alerts = useMemo(() => {
    return (data || []).map((alert) => mapAlert(alert, user?.id));
  }, [data, user?.id]);

  const filteredAlerts = useMemo(
    () => alerts.filter((alert) => (statusFilter === "todas" || alert.status === statusFilter) && (typeFilter === "todas" || alert.type === typeFilter)),
    [statusFilter, typeFilter, alerts],
  );

  const activeCount = alerts.filter((alert) => alert.status === "activa").length;

  return (
    <ProtectedLayout>
      <AnimatedPage className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Alertas"
          subtitle="Convocatorias de emergencia: respondé si vas y seguí su estado"
          icon={<Bell className="h-6 w-6" />}
          actions={
            <Link href="/alerts/new">
              <Button variant="primary" size="md" icon={<Plus className="h-4 w-4" />}>
                Nueva alerta
              </Button>
            </Link>
          }
        />

        <div className="space-y-3">
          <div role="tablist" aria-label="Estado de las alertas" className="flex gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
            {statusFilters.map((filter) => {
              const selected = statusFilter === filter.id;
              const count = filter.id === "activa" ? activeCount : null;
              return (
                <button key={filter.id} type="button" role="tab" aria-selected={selected} onClick={() => setStatusFilter(filter.id)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-1 py-2 text-sm font-semibold transition-colors ${selected ? "bg-red-600 text-white" : "text-white/70 hover:bg-white/[0.06]"}`}>
                  {filter.label}{count !== null && count > 0 ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="min-w-0 flex-1 sm:max-w-xs"><span className="sr-only">Tipo de emergencia</span>
              <select className="app-input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as EmergencyType)}>
                {typeOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
            {user && isDutyManager(user.role) && <Link className="app-button app-button-outline w-auto" href="/alerts/notices">Registro de llamadas</Link>}
          </div>
        </div>

        {/* Error message */}
        {isError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            No se pudieron cargar las alertas. Verificá la conectividad con el servidor.
          </div>
        )}

        {/* Alerts List */}
        <section className="grid gap-4 xl:grid-cols-2">
          {isLoading && (
            <div className="xl:col-span-2 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                />
              ))}
            </div>
          )}

          {!isLoading &&
            !isError &&
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                canResolve={isCommand(user?.role)}
                canCancel={isDutyManager(user?.role)}
              />
            ))}

          {!isLoading && !isError && filteredAlerts.length === 0 && (
            <div className="xl:col-span-2">
              <EmptyState
                icon={<Bell className="h-8 w-8" />}
                title={statusFilter === "activa" && typeFilter === "todas" ? "No hay emergencias activas" : "No hay alertas con estos filtros"}
                description={statusFilter === "activa" && typeFilter === "todas" ? "Cuando se emita una alerta vas a verla acá y en tu inicio." : "Probá con otro estado o tipo de emergencia."}
              />
            </div>
          )}
        </section>
      </AnimatedPage>
    </ProtectedLayout>
  );
}

function AlertCard({
  alert,
  canResolve,
  canCancel,
}: {
  alert: AlertItem;
  canResolve: boolean;
  canCancel: boolean;
}) {
  const respondMutation = useRespondAlert();
  const [pendingResponse, setPendingResponse] = useState<"GOING" | "NOT_GOING" | null>(null);
  const resolveMutation = useResolveAlert();
  const cancelMutation = useCancelAlert();
  const dispatchMutation = useDispatchIncidentFromAlert();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activating, setActivating] = useState(false);
  const [actionError, setActionError] = useState("");

  // F09/D04: quien no figuraba disponible puede activarse y recibir la convocatoria en el momento.
  async function becomeAvailable() {
    setActivating(true); setActionError("");
    try {
      await api.post("/members/availability/available-now", {});
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["alerts"] }), queryClient.invalidateQueries({ queryKey: ["emergency-availability"] })]);
    } catch (error: unknown) { setActionError(getErrorMessage(error, "No se pudo activar tu disponibilidad.")); }
    finally { setActivating(false); }
  }
  const { icon: Icon, borderColor, badgeBg } = getTypeStyles(alert.type);
  const isActive = alert.status === "activa";

  async function respond(response: "GOING" | "NOT_GOING") {
    if (alert.myResponse === response) return;
    try {
      await respondMutation.mutateAsync({ id: alert.id, response });
      setPendingResponse(null);
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, "No se pudo registrar tu respuesta."));
    }
  }

  async function resolve() {
    try {
      await resolveMutation.mutateAsync(alert.id);
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, "No se pudo resolver la alerta."));
    }
  }

  async function cancel() {
    const reason = window.prompt(
      `${alert.incident ? "Se conservará la intervención y su acta de salida. " : ""}Motivo para cancelar la alerta (mínimo 10 caracteres):`
    )?.trim();
    if (!reason) return;
    if (reason.length < 10) {
      window.alert("El motivo debe tener al menos 10 caracteres.");
      return;
    }
    try {
      await cancelMutation.mutateAsync({ id: alert.id, reason });
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, "No se pudo cancelar la alerta."));
    }
  }

  async function dispatchIncident() {
    const confirmed = window.confirm(
      "Se abrirá la planilla de intervención de esta emergencia. Las dotaciones se cargan desde la planilla cuando sale cada móvil. ¿Continuar?"
    );
    if (!confirmed) return;

    try {
      const incident = await dispatchMutation.mutateAsync({
        alertId: alert.id,
        autoAssignResponders: true,
      });
      if (incident?.id) router.push(`/incidents/${incident.id}/sheet`);
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, "No se pudo abrir la intervención."));
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121316] p-5 shadow-xl transition-all hover:border-white/20 ${
        isActive ? borderColor : "opacity-75"
      }`}
    >
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${badgeBg} shadow-inner`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h3 className="font-[family-name:var(--font-bebas)] text-2xl uppercase tracking-wider text-white">
                  {alert.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-white/50 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span className="truncate">{alert.address}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={
                    alert.priority === "alta"
                      ? "red"
                      : alert.priority === "media"
                      ? "yellow"
                      : "green"
                  }
                  size="sm"
                >
                  Prioridad {alert.priority}
                </Badge>
                <Badge
                  variant={alert.status === "activa" ? "red" : "gray"}
                  pulse={alert.status === "activa"}
                  size="sm"
                >
                  {alert.status}
                </Badge>
              </div>
            </div>

            <p className="mt-3 text-sm text-white/70 leading-relaxed font-[family-name:var(--font-barlow)]">
              {alert.description}
            </p>
            {alert.myAttendanceOutcome === "NO_SHOW" && (
              <p className="mt-2 text-sm font-semibold text-amber-300">
                Resultado de asistencia: No asististe
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40 border-t border-white/[0.04] pt-3 font-[family-name:var(--font-barlow-condensed)] uppercase tracking-wider">
              <span>Despachó: {alert.author}</span>
              <span>·</span>
              <span>{alert.timeAgo}</span>
              <span>·</span>
              <span className="text-white/70 font-bold">{alert.goingCount} {alert.goingCount === 1 ? "va" : "van"} · {alert.notGoingCount} no {alert.notGoingCount === 1 ? "va" : "van"}</span>
            </div>
          </div>
        </div>

        {isActive && !alert.canRespond && (
          <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-3">
            <p className="min-w-0 flex-1 text-sm text-white/70">No estás convocado porque no figurabas disponible.</p>
            <button type="button" disabled={activating} onClick={() => void becomeAvailable()} className="app-button app-button-green w-auto">{activating ? "Activando…" : "Estoy disponible"}</button>
          </div>
        )}
        {/* Respuesta personal */}
        {isActive && alert.canRespond && (
          <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              disabled={respondMutation.isPending || alert.myResponse === "GOING"}
              onClick={() => setPendingResponse("GOING")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-barlow-condensed)] transition-all ${
                alert.myResponse === "GOING"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-400"
                  : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {alert.myResponse === "GOING" ? "Confirmado (Voy)" : "Voy"}
            </button>

            <button
              type="button"
              disabled={respondMutation.isPending || alert.myResponse === "NOT_GOING"}
              onClick={() => setPendingResponse("NOT_GOING")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-barlow-condensed)] transition-all ${
                alert.myResponse === "NOT_GOING"
                  ? "bg-white/20 text-white ring-1 ring-white/40"
                  : "border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <XCircle className="h-4 w-4" />
              {alert.myResponse === "NOT_GOING" ? "No voy (Registrado)" : "No voy"}
            </button>
            {pendingResponse && pendingResponse !== alert.myResponse && <div role="group" aria-label="Confirmar respuesta a la alerta" className="col-span-2 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm sm:order-last sm:w-full"><span className="flex-1">{alert.myResponse ? "Cambiarás tu respuesta anterior; el cambio quedará registrado en el historial." : `Confirmar “${pendingResponse === "GOING" ? "Voy" : "No voy"}”. Podrás corregirla mientras la alerta siga activa.`}</span><button type="button" disabled={respondMutation.isPending} className="app-button app-button-red w-auto" onClick={() => void respond(pendingResponse)}>{respondMutation.isPending ? "Registrando..." : alert.myResponse ? "Confirmar cambio" : "Confirmar"}</button><button type="button" disabled={respondMutation.isPending} className="app-button app-button-outline w-auto" onClick={() => setPendingResponse(null)}>Cancelar</button></div>}

          </div>
        )}
        {/* Gestion de la emergencia: no depende de haber sido convocado */}
        {isActive && (canResolve || canCancel) && (
          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
            {canResolve && (
              <>
                {alert.incident ? (
                  <Link
                    href={`/incidents/${alert.incident.id}/sheet`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/20 transition-all font-[family-name:var(--font-barlow-condensed)]"
                  >
                    <Siren className="h-4 w-4" />
                    Ver planilla de intervención
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={dispatchMutation.isPending}
                    onClick={dispatchIncident}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/30 hover:bg-red-700 transition-all font-[family-name:var(--font-barlow-condensed)]"
                  >
                    <ShieldPlus className="h-4 w-4" />
                    {dispatchMutation.isPending ? "Abriendo…" : "Abrir intervención"}
                  </button>
                )}
                {!alert.incident && (
                  <button
                    type="button"
                    disabled={resolveMutation.isPending}
                    onClick={resolve}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/70 hover:bg-white/[0.08] transition-all font-[family-name:var(--font-barlow-condensed)]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Resolver
                  </button>
                )}
              </>
            )}
            {canCancel && (
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => void cancel()}
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-200 hover:bg-amber-500/20 transition-all font-[family-name:var(--font-barlow-condensed)]"
              >
                {cancelMutation.isPending ? "Cancelando..." : alert.incident ? "Cancelar alerta y conservar acta" : "Cancelar falsa alarma"}
              </button>
            )}
          </div>
        )}
        {actionError && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{actionError}</p>}
      </div>
    </motion.article>
  );
}

function getTypeStyles(type: AlertItem["type"]) {
  switch (type) {
    case "incendio":
      return {
        icon: Flame,
        borderColor: "border-l-4 border-l-red-500",
        badgeBg: "bg-red-500/15 border border-red-500/30 text-red-400",
      };
    case "rescate":
      return {
        icon: ShieldPlus,
        borderColor: "border-l-4 border-l-amber-500",
        badgeBg: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
      };
    case "accidente":
      return {
        icon: Siren,
        borderColor: "border-l-4 border-l-blue-500",
        badgeBg: "bg-blue-500/15 border border-blue-500/30 text-blue-400",
      };
    case "quimico":
      return {
        icon: TestTube2,
        borderColor: "border-l-4 border-l-purple-500",
        badgeBg: "bg-purple-500/15 border border-purple-500/30 text-purple-400",
      };
    case "medico":
      return {
        icon: Stethoscope,
        borderColor: "border-l-4 border-l-sky-500",
        badgeBg: "bg-sky-500/15 border border-sky-500/30 text-sky-400",
      };
    case "inundacion":
      return {
        icon: Droplets,
        borderColor: "border-l-4 border-l-emerald-500",
        badgeBg: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400",
      };
    default:
      return {
        icon: Bell,
        borderColor: "border-l-4 border-l-orange-500",
        badgeBg: "bg-orange-500/15 border border-orange-500/30 text-orange-400",
      };
  }
}
