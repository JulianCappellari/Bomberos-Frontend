"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  useRespondAlert,
  useResolveAlert,
} from "@/hooks/use-alerts";
import { BackButton, HomeButton } from "@/components/layout/navigation-buttons";
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

type AlertStatus = "activa" | "resuelta";
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
  myResponse: "GOING" | "NOT_GOING" | null;
};

const filters = [
  { id: "todas", label: "Todas" },
  { id: "activa", label: "Activas" },
  { id: "resuelta", label: "Resueltas" },
  { id: "incendio", label: "Incendio" },
  { id: "rescate", label: "Rescate" },
] as const;

type FilterId = (typeof filters)[number]["id"];

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
  return status === "ACTIVE" ? "activa" : "resuelta";
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

  return {
    id: alert.id,
    type: mappedType,
    title:
      {
        incendio: "Incendio",
        rescate: "Rescate",
        accidente: "Accidente",
        quimico: "Químico",
        medico: "Médico",
        inundacion: "Inundación",
        otro: "Alerta",
      }[mappedType] || "Alerta",
    address: alert.location,
    description: alert.description || "Sin descripción",
    author: getAuthorName(alert),
    timeAgo: formatTimeAgo(alert.createdAt),
    priority: mapBackendPriority(alert.priority),
    status: mapBackendStatus(alert.status),
    responsesCount: alert.responses?.length ?? 0,
    myResponse:
      alert.responses?.find((response) => response.userId === userId)
        ?.response ?? null,
  };
}

export default function AlertsListPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useAlerts();
  const [activeFilter, setActiveFilter] = useState<FilterId>("todas");

  const alerts = useMemo(() => {
    return (data || []).map((alert) => mapAlert(alert, user?.id));
  }, [data, user?.id]);

  const filteredAlerts = useMemo(() => {
    if (activeFilter === "todas") return alerts;
    if (activeFilter === "activa" || activeFilter === "resuelta") {
      return alerts.filter((alert) => alert.status === activeFilter);
    }
    return alerts.filter((alert) => alert.type === activeFilter);
  }, [activeFilter, alerts]);

  const activeCount = alerts.filter((alert) => alert.status === "activa").length;

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto min-h-screen w-full max-w-4xl">
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0c0d10]/92 backdrop-blur-xl">
          <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
            <BackButton
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            />

            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#ff5349]" />
              <div className="text-center">
                <h1 className="text-base font-black uppercase tracking-[0.14em] text-[#ff5349] sm:text-lg">
                  Alertas
                </h1>
                <p className="text-[11px] text-white/40">
                  {activeCount} activas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <HomeButton className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10" />
              <Link
                href="/alerts/new"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff4d4f] text-white transition hover:brightness-110"
                aria-label="Nueva alerta"
              >
                <Plus className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>

        <section className="px-2.5 py-3 sm:px-4 sm:py-4">
          <div className="no-scrollbar -mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-2">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={[
                    "shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.05em] transition sm:text-sm",
                    isActive
                      ? "border-[#ff4d4f] bg-[#ff4d4f] text-white shadow-[0_10px_24px_rgba(255,77,79,0.24)]"
                      : "border-white/10 bg-[#15161a] text-white/55 hover:border-white/20 hover:text-white",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 px-2.5 pb-5 sm:px-4 sm:pb-6">
          {isLoading && (
            <PanelMessage message="Cargando alertas..." tone="neutral" />
          )}

          {isError && (
            <PanelMessage
              message="No se pudieron cargar las alertas."
              tone="error"
            />
          )}

          {!isLoading &&
            !isError &&
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                canResolve={user?.role === "ADMIN" || user?.role === "OPERATOR"}
              />
            ))}

          {!isLoading && !isError && filteredAlerts.length === 0 && (
            <PanelMessage
              message="No hay alertas para este filtro."
              tone="neutral"
            />
          )}
        </section>
      </div>
    </main>
  );
}

function AlertCard({
  alert,
  canResolve,
}: {
  alert: AlertItem;
  canResolve: boolean;
}) {
  const respondMutation = useRespondAlert();
  const resolveMutation = useResolveAlert();
  const { icon: Icon, accentClass, badgeClass } = getTypeStyles(alert.type);
  const priorityClass = getPriorityClass(alert.priority);
  const statusClass = getStatusClass(alert.status);
  const isActive = alert.status === "activa";

  async function respond(response: "GOING" | "NOT_GOING") {
    try {
      await respondMutation.mutateAsync({ id: alert.id, response });
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo responder la alerta."));
    }
  }

  async function resolve() {
    try {
      await resolveMutation.mutateAsync(alert.id);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo resolver la alerta."));
    }
  }

  return (
    <article
      className={[
        "overflow-hidden rounded-[22px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_18px_50px_rgba(0,0,0,0.26)]",
        accentClass,
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
              badgeClass,
            ].join(" ")}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-black leading-none text-white">
                  {alert.title}
                </h2>
                <div className="mt-1 flex items-start gap-1.5 text-sm text-white/45">
                  <MapPin className="mt-[2px] h-3.5 w-3.5 shrink-0 text-[#ff4d8d]" />
                  <span className="truncate sm:whitespace-normal">
                    {alert.address}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                <span
                  className={[
                    "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em]",
                    priorityClass,
                  ].join(" ")}
                >
                  {alert.priority}
                </span>
                <span
                  className={[
                    "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em]",
                    statusClass,
                  ].join(" ")}
                >
                  {alert.status}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/68 sm:text-[15px]">
              {alert.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/35 sm:text-sm">
              <span>{alert.author}</span>
              <span>·</span>
              <span>{alert.timeAgo}</span>
              <span>·</span>
              <span>{alert.responsesCount} respuestas</span>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-3">
            <ActionButton
              active={alert.myResponse === "GOING"}
              disabled={respondMutation.isPending}
              onClick={() => respond("GOING")}
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={alert.myResponse === "GOING" ? "Vas" : "Voy"}
              tone="green"
            />
            <ActionButton
              active={alert.myResponse === "NOT_GOING"}
              disabled={respondMutation.isPending}
              onClick={() => respond("NOT_GOING")}
              icon={<XCircle className="h-4 w-4" />}
              label={alert.myResponse === "NOT_GOING" ? "No vas" : "No voy"}
              tone="gray"
            />
            {canResolve && (
              <ActionButton
                active={false}
                disabled={resolveMutation.isPending}
                onClick={resolve}
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Resolver"
                tone="red"
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ActionButton({
  active,
  disabled,
  onClick,
  icon,
  label,
  tone,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "green" | "gray" | "red";
}) {
  const toneClass = {
    green: active
      ? "border-emerald-500 bg-emerald-500 text-white"
      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    gray: active
      ? "border-slate-400 bg-slate-500 text-white"
      : "border-white/10 bg-white/5 text-slate-300",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
  }[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-xs font-black uppercase tracking-[0.1em] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
        toneClass,
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function PanelMessage({
  message,
  tone,
}: {
  message: string;
  tone: "neutral" | "error";
}) {
  return (
    <div
      className={[
        "rounded-[22px] border px-5 py-12 text-center",
        tone === "error"
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-white/10 bg-[#111214] text-white/75",
      ].join(" ")}
    >
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}

function getTypeStyles(type: AlertItem["type"]) {
  switch (type) {
    case "incendio":
      return {
        icon: Flame,
        accentClass:
          "border-l-4 border-l-[#ff4d4f] border-y-white/10 border-r-white/10",
        badgeClass: "border-[#ff4d4f]/20 bg-[#2b1719] text-[#ff8a83]",
      };
    case "rescate":
      return {
        icon: ShieldPlus,
        accentClass:
          "border-l-4 border-l-[#d1b300] border-y-white/10 border-r-white/10",
        badgeClass: "border-[#d1b300]/20 bg-[#2c2712] text-[#f0d74a]",
      };
    case "accidente":
      return {
        icon: Siren,
        accentClass:
          "border-l-4 border-l-[#6f7685] border-y-white/10 border-r-white/10",
        badgeClass: "border-[#6f7685]/20 bg-[#22252c] text-[#d6dae4]",
      };
    case "quimico":
      return {
        icon: TestTube2,
        accentClass:
          "border-l-4 border-l-[#b27cff] border-y-white/10 border-r-white/10",
        badgeClass: "border-[#b27cff]/20 bg-[#241a34] text-[#c9a2ff]",
      };
    case "medico":
      return {
        icon: Stethoscope,
        accentClass:
          "border-l-4 border-l-[#5fa8ff] border-y-white/10 border-r-white/10",
        badgeClass: "border-[#5fa8ff]/20 bg-[#182332] text-[#8fc0ff]",
      };
    case "inundacion":
      return {
        icon: Droplets,
        accentClass:
          "border-l-4 border-l-[#16c784] border-y-white/10 border-r-white/10",
        badgeClass: "border-[#16c784]/20 bg-[#112921] text-[#53d9a4]",
      };
    case "otro":
      return {
        icon: Bell,
        accentClass:
          "border-l-4 border-l-[#ff7a2f] border-y-white/10 border-r-white/10",
        badgeClass: "border-[#ff7a2f]/20 bg-[#2c2118] text-[#ffad78]",
      };
  }
}

function getPriorityClass(priority: AlertPriority) {
  switch (priority) {
    case "alta":
      return "border-[#7f2426] bg-[#2b1618] text-[#ff6669]";
    case "media":
      return "border-[#75620f] bg-[#2b2511] text-[#d9bc1b]";
    case "baja":
      return "border-[#196b49] bg-[#11271f] text-[#31d18b]";
  }
}

function getStatusClass(status: AlertStatus) {
  switch (status) {
    case "activa":
      return "border-[#7f2426] bg-[#1d1f25] text-[#ff5256]";
    case "resuelta":
      return "border-white/10 bg-[#1a1d22] text-white/45";
  }
}
