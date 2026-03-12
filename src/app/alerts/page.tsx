"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Droplets,
  Flame,
  MapPin,
  ShieldPlus,
  Siren,
  Stethoscope,
  TestTube2,
  Bell,
} from "lucide-react";
import { useAlerts } from "@/hooks/use-alerts";
import type { BackendAlert } from "@/services/alerts.service";

type EmergencyType =
  | "todas"
  | "incendio"
  | "rescate"
  | "accidente"
  | "quimico"
  | "medico"
  | "inundacion";

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
      return "incendio";
  }
}

function mapBackendPriority(priority: BackendAlert["priority"]): AlertPriority {
  switch (priority) {
    case "HIGH":
      return "alta";
    case "MEDIUM":
      return "media";
    case "LOW":
      return "baja";
    default:
      return "media";
  }
}

function mapBackendStatus(status: BackendAlert["status"]): AlertStatus {
  switch (status) {
    case "ACTIVE":
      return "activa";
    case "RESOLVED":
      return "resuelta";
    case "CANCELLED":
      return "resuelta";
    default:
      return "activa";
  }
}

function formatTimeAgo(dateString: string) {
  const now = new Date().getTime();
  const created = new Date(dateString).getTime();
  const diffMs = now - created;

  const minutes = Math.floor(diffMs / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `hace ${days} día${days > 1 ? "s" : ""}`;
  }

  if (hours > 0) {
    return `hace ${hours}h ${minutes % 60}min`;
  }

  if (minutes > 0) {
    return `hace ${minutes}min`;
  }

  return "recién";
}

function getAuthorName(alert: BackendAlert) {
  const firstName = alert.createdBy?.profile?.firstName?.trim();
  const lastName = alert.createdBy?.profile?.lastName?.trim();

  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ");
  }

  return alert.createdBy?.username || "Sistema";
}

function mapAlert(alert: BackendAlert): AlertItem {
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
      }[mappedType] || "Alerta",
    address: alert.location,
    description: alert.description || "Sin descripción",
    author: getAuthorName(alert),
    timeAgo: formatTimeAgo(alert.createdAt),
    priority: mapBackendPriority(alert.priority),
    status: mapBackendStatus(alert.status),
  };
}

export default function AlertsListPage() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("todas");
  const { data, isLoading, isError } = useAlerts();

  const alerts = useMemo(() => {
    return (data || []).map(mapAlert);
  }, [data]);

  const filteredAlerts = useMemo(() => {
    if (activeFilter === "todas") return alerts;
    if (activeFilter === "activa" || activeFilter === "resuelta") {
      return alerts.filter((alert) => alert.status === activeFilter);
    }
    return alerts.filter((alert) => alert.type === activeFilter);
  }, [activeFilter, alerts]);

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto min-h-screen w-full max-w-4xl">
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0c0d10]/92 backdrop-blur-xl">
          <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
            <Link
              href="/dashboard"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#ff5349]" />
              <h1 className="text-base font-black uppercase tracking-[0.14em] text-[#ff5349] sm:text-lg">
                Alertas
              </h1>
            </div>

            <div className="w-11" />
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
            <div className="rounded-[22px] border border-white/10 bg-[#111214] px-5 py-12 text-center">
              <p className="text-sm font-semibold text-white/75">Cargando alertas...</p>
            </div>
          )}

          {isError && (
            <div className="rounded-[22px] border border-red-500/20 bg-red-500/10 px-5 py-12 text-center">
              <p className="text-sm font-semibold text-red-300">
                No se pudieron cargar las alertas.
              </p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}

          {!isLoading && !isError && filteredAlerts.length === 0 && (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-[#111214] px-5 py-12 text-center">
              <p className="text-sm font-semibold text-white/75">
                No hay alertas para este filtro.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AlertCard({ alert }: { alert: AlertItem }) {
  const { icon: Icon, accentClass, badgeClass } = getTypeStyles(alert.type);
  const priorityClass = getPriorityClass(alert.priority);
  const statusClass = getStatusClass(alert.status);

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
                  <span className="truncate sm:whitespace-normal">{alert.address}</span>
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

            <div className="mt-4 flex items-center gap-2 text-xs text-white/28 sm:text-sm">
              <span>🚒</span>
              <span>{alert.author}</span>
              <span>·</span>
              <span>{alert.timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
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

