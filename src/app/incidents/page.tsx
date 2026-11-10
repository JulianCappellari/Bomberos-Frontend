"use client";
import Link from "next/link";

import { FormEvent, useMemo, useState } from "react";
import {
  ClipboardPenLine,
  MapPin,
  MessageSquarePlus,
  Plus,
  Save,
  Siren,
  X,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import { useAlerts } from "@/hooks/use-alerts";
import {
  useCreateIncident,
  useCreateIncidentUpdate,
  useIncidents,
  useUpdateIncident,
} from "@/hooks/use-incidents";
import { getErrorMessage } from "@/lib/get-error-message";
import { BackendAlert } from "@/services/alerts.service";
import {
  CreateIncidentPayload,
  Incident,
  IncidentStatus,
  IncidentType,
} from "@/types/incident";
import { UserRosterItem } from "@/types/user";

const incidentTypes: IncidentType[] = [
  "FIRE",
  "RESCUE",
  "ACCIDENT",
  "CHEMICAL",
  "MEDICAL",
  "FLOOD",
  "OTHER",
];

const statusFilters: Array<{ id: "ALL" | IncidentStatus; label: string }> = [
  { id: "OPEN", label: "Abiertas" },
  { id: "CLOSED", label: "Cerradas" },
  { id: "ALL", label: "Todas" },
];

function isManager(role?: string) {
  return role === "ADMIN" || role === "OPERATOR" || role === "GUARD";
}

function typeLabel(type: IncidentType) {
  const labels: Record<IncidentType, string> = {
    FIRE: "Incendio",
    RESCUE: "Rescate",
    ACCIDENT: "Accidente",
    CHEMICAL: "Riesgo químico",
    MEDICAL: "Emergencia médica",
    FLOOD: "Inundación",
    OTHER: "Otra emergencia",
  };

  return labels[type];
}

function statusLabel(status: IncidentStatus) {
  return status === "OPEN" ? "Abierta" : "Cerrada";
}

function memberName(member: UserRosterItem) {
  return member.profile?.fullName || member.username;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function IncidentsPage() {
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const [statusFilter, setStatusFilter] = useState<"ALL" | IncidentStatus>(
    "OPEN",
  );
  const { data: incidents = [], isLoading, isError } = useIncidents(
    statusFilter === "ALL" ? undefined : statusFilter,
  );
  const { data: alerts = [] } = useAlerts();

  const openCount = useMemo(() => incidents.filter((incident) => incident.status === "OPEN").length, [incidents]);

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <header className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><Siren className="h-6 w-6 text-red-400" aria-hidden /> Intervenciones</h1>
          <p className="mt-1 text-sm text-[var(--mut)]">Cada emergencia tiene una planilla única: móviles, dotación, horarios y novedades.</p>
        </header>

        {manager && <CreateIncidentPanel alerts={alerts} />}

        <div role="tablist" aria-label="Estado de las intervenciones" className="mb-4 flex gap-1 rounded-xl border border-[var(--bord)] bg-black/20 p-1">
          {statusFilters.map((filter) => {
            const active = statusFilter === filter.id;
            return (
              <button key={filter.id} type="button" role="tab" aria-selected={active} onClick={() => setStatusFilter(filter.id)}
                className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${active ? "bg-red-600 text-white" : "text-white/70 hover:bg-white/[0.06]"}`}>
                {filter.label}{filter.id === "OPEN" && openCount > 0 ? ` (${openCount})` : ""}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="card text-sm text-[var(--mut)]">
            Cargando intervenciones…
          </div>
        )}

        {isError && (
          <div className="card border-red-500/30 bg-red-500/10 text-sm text-red-300">
            No se pudieron cargar las intervenciones. Revisá la conexión y volvé a intentar.
          </div>
        )}

        {!isLoading && !isError && incidents.length === 0 && (
          <div className="card text-sm text-[var(--mut)]">
            {statusFilter === "OPEN" ? "No hay intervenciones abiertas." : "No hay intervenciones para este filtro."}
          </div>
        )}

        <section className="space-y-3">
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              canManage={manager}
            />
          ))}
        </section>
      </main>
    </ProtectedLayout>
  );
}

function CreateIncidentPanel({
  alerts,
}: {
  alerts: BackendAlert[];
}) {
  const createMutation = useCreateIncident();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<CreateIncidentPayload>({
    alertId: "",
    title: "",
    type: "OTHER",
    description: "",
    location: "",
    losses: "",
  });

  const availableAlerts = alerts.filter((alert) => alert.status !== "CANCELLED");

  function updateFromAlert(alertId: string) {
    const selectedAlert = availableAlerts.find((alert) => alert.id === alertId);

    if (!selectedAlert) {
      setForm((current) => ({
        ...current,
        alertId: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      alertId,
      type: selectedAlert.type,
      title: current.title || `${typeLabel(selectedAlert.type)} - ${selectedAlert.location}`,
      description: current.description || selectedAlert.description || "",
      location: selectedAlert.location,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createMutation.mutateAsync(form);
      setForm({
        alertId: "",
        title: "",
        type: "OTHER",
        description: "",
        location: "",
        losses: "",
      });
      setIsOpen(false);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo crear la intervención."));
    }
  }

  return (
    <section className="card">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex min-h-11 w-full items-center justify-between gap-3"
      >
        <span className="flex items-center gap-2 font-bold text-white">
          <Plus className="h-5 w-5 text-red-400" />
          Registrar intervención manual
        </span>
        <span className="text-sm text-[var(--mut)]">
          {isOpen ? "Ocultar" : "Abrir formulario"}
        </span>
      </button>

      {isOpen && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label>
            <span className="app-label">Alerta vinculada</span>
            <select
              value={form.alertId || ""}
              onChange={(event) => updateFromAlert(event.target.value)}
              className="app-input"
            >
              <option value="">Sin alerta</option>
              {availableAlerts.map((alert) => (
                <option key={alert.id} value={alert.id}>
                  {typeLabel(alert.type)} - {alert.location}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="app-label">Tipo</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as IncidentType,
                  }))
                }
                className="app-input"
                disabled={Boolean(form.alertId)}
              >
                {incidentTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeLabel(type)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="app-label">Titulo</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="app-input"
                required
                maxLength={140}
              />
            </label>
          </div>

          <label>
            <span className="app-label">Ubicacion</span>
            <input
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
              className="app-input"
              required
              maxLength={180}
            />
          </label>

          <label>
            <span className="app-label">Descripcion</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="app-input min-h-[90px] resize-none"
              required
            />
          </label>

          <label>
            <span className="app-label">Perdidas / observaciones iniciales</span>
            <textarea
              value={form.losses || ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  losses: event.target.value,
                }))
              }
              className="app-input min-h-[72px] resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="app-button app-button-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            Crear intervención
          </button>
        </form>
      )}
    </section>
  );
}

function IncidentCard({
  incident,
  canManage,
}: {
  incident: Incident;
  canManage: boolean;
}) {
  const updateMutation = useUpdateIncident();
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [draft, setDraft] = useState({
    title: incident.title,
    type: incident.type,
    description: incident.description,
    location: incident.location,
    responseTimeMinutes: incident.responseTimeMinutes || undefined,
    losses: incident.losses || "",
  });
  const isOpen = incident.status === "OPEN";
  const vehicles = incident.vehicles?.length ?? 0;
  const people = incident.assignments.length;

  async function saveEdit() {
    setEditError("");
    try {
      await updateMutation.mutateAsync({ id: incident.id, ...draft });
      setIsEditing(false);
    } catch (error: unknown) {
      setEditError(getErrorMessage(error, "No se pudieron guardar los cambios."));
    }
  }

  return (
    <article className={`rounded-xl border bg-[var(--card)] p-4 ${isOpen ? "border-red-500/30 border-l-4 border-l-red-500" : "border-[var(--bord)]"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${isOpen ? "badge-red" : "badge-green"}`}>{statusLabel(incident.status)}</span>
        <span className="badge badge-gray">{typeLabel(incident.type)}</span>
        {incident.alertId && <span className="badge badge-blue">Desde una alerta</span>}
      </div>
      <h2 className="mt-2 text-lg font-bold leading-tight text-white">
        <Link href={`/incidents/${incident.id}/sheet`} className="hover:underline underline-offset-4">{incident.title}</Link>
      </h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--mut)]"><MapPin className="h-4 w-4 shrink-0 text-red-400" aria-hidden /><span className="truncate">{incident.location}</span></p>
      <p className="mt-1 text-xs text-[var(--mut)]">
        Inicio {formatDateTime(incident.occurredAt)}{incident.closedAt ? ` · Cierre ${formatDateTime(incident.closedAt)}` : ""}
        {" · "}{vehicles} {vehicles === 1 ? "móvil" : "móviles"} · {people} {people === 1 ? "persona" : "personas"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/incidents/${incident.id}/sheet`} className={`app-button w-auto ${isOpen ? "app-button-red" : ""}`}>
          {isOpen ? "Abrir planilla" : "Ver planilla"}
        </Link>
        {canManage && isOpen && !isEditing && (
          <button type="button" onClick={() => setIsEditing(true)} className="app-button app-button-outline w-auto">
            <ClipboardPenLine className="h-4 w-4" aria-hidden /> Editar datos
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 space-y-3 rounded-xl border border-[var(--bord)] bg-[var(--card2)] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="app-label">Tipo</span>
              <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as IncidentType }))} className="app-input" disabled={Boolean(incident.alertId)}>
                {incidentTypes.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
              </select>
            </label>
            <label>
              <span className="app-label">Título</span>
              <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="app-input" maxLength={140} />
            </label>
          </div>
          <label className="block"><span className="app-label">Ubicación</span><input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} className="app-input" maxLength={180} /></label>
          <label className="block"><span className="app-label">Descripción</span><textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="app-input min-h-[90px]" /></label>
          <label className="block"><span className="app-label">Pérdidas</span><textarea value={draft.losses} onChange={(event) => setDraft((current) => ({ ...current, losses: event.target.value }))} className="app-input min-h-[72px]" /></label>
          {editError && <p role="alert" className="text-sm text-red-300">{editError}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={saveEdit} disabled={updateMutation.isPending} className="app-button app-button-red w-auto"><Save className="h-4 w-4" aria-hidden /> Guardar</button>
            <button type="button" onClick={() => { setDraft({ title: incident.title, type: incident.type, description: incident.description, location: incident.location, responseTimeMinutes: incident.responseTimeMinutes || undefined, losses: incident.losses || "" }); setIsEditing(false); }} className="app-button app-button-outline w-auto"><X className="h-4 w-4" aria-hidden /> Cancelar</button>
          </div>
        </div>
      )}

      {incident.closingReport && (
        <p className="mt-3 rounded-lg border border-green-500/25 bg-green-500/10 p-3 text-sm text-green-100"><span className="font-bold">Informe de cierre: </span>{incident.closingReport}</p>
      )}

      <details className="mt-3 rounded-lg border border-[var(--bord)] p-3">
        <summary className="cursor-pointer text-sm font-semibold text-white/80">Descripción y bitácora rápida</summary>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--txt)]">{incident.description}</p>
        {incident.losses && <p className="mt-2 text-sm text-[var(--mut)]"><span className="font-bold text-white">Pérdidas: </span>{incident.losses}</p>}
        <IncidentTimeline incident={incident} canWrite={isOpen} />
      </details>
    </article>
  );
}

function IncidentTimeline({
  incident,
  canWrite,
}: {
  incident: Incident;
  canWrite: boolean;
}) {
  const { user } = useAuth();
  const createMutation = useCreateIncidentUpdate();
  const [body, setBody] = useState("");
  const isParticipant = incident.assignments.some(
    (assignment) => assignment.userId === user?.id,
  );
  const allowed = canWrite && (isManager(user?.role) || isParticipant || incident.createdByUserId === user?.id);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = body.trim();
    if (value.length < 3) return;
    try {
      await createMutation.mutateAsync({ id: incident.id, body: value });
      setBody("");
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo registrar la novedad."));
    }
  }

  return (
    <section className="mt-4 rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
        <MessageSquarePlus className="h-4 w-4 text-red-400" />
        Bitacora operativa
      </div>
      <div className="space-y-2">
        {(incident.updates || []).length === 0 ? (
          <p className="text-sm text-[var(--mut)]">Sin novedades registradas.</p>
        ) : (
          incident.updates.map((update) => (
            <div key={update.id} className="border-l-2 border-red-500/40 pl-3">
              <p className="whitespace-pre-wrap text-sm text-[var(--txt)]">{update.body}</p>
              <p className="mt-1 text-[11px] text-[var(--mut)]">
                {memberName(update.author)} - {formatDateTime(update.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
      {allowed && (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="app-input min-w-0 flex-1"
            placeholder="Registrar novedad del operativo..."
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={createMutation.isPending || body.trim().length < 3}
            className="app-button app-button-red sm:w-auto"
          >
            Agregar
          </button>
        </form>
      )}
    </section>
  );
}
