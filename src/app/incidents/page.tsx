"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardPenLine,
  Flame,
  Plus,
  Save,
  Siren,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import { useAlerts } from "@/hooks/use-alerts";
import {
  useAssignIncidentUsers,
  useCloseIncident,
  useCreateIncident,
  useIncidents,
  useUpdateIncident,
} from "@/hooks/use-incidents";
import { useUserRoster } from "@/hooks/use-shifts";
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
  { id: "ALL", label: "Todos" },
  { id: "OPEN", label: "Abiertos" },
  { id: "CLOSED", label: "Cerrados" },
];

function isManager(role?: string) {
  return role === "ADMIN" || role === "OPERATOR";
}

function typeLabel(type: IncidentType) {
  const labels: Record<IncidentType, string> = {
    FIRE: "Incendio",
    RESCUE: "Rescate",
    ACCIDENT: "Accidente",
    CHEMICAL: "Quimico",
    MEDICAL: "Medico",
    FLOOD: "Inundacion",
    OTHER: "Otro",
  };

  return labels[type];
}

function statusLabel(status: IncidentStatus) {
  return status === "OPEN" ? "Abierto" : "Cerrado";
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
  const { data: roster = [] } = useUserRoster();
  const { data: alerts = [] } = useAlerts();

  const stats = useMemo(() => {
    return {
      open: incidents.filter((incident) => incident.status === "OPEN").length,
      assigned: incidents.reduce(
        (acc, incident) => acc + incident.assignments.length,
        0,
      ),
    };
  }, [incidents]);

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <section className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="section-title mb-1 mt-0">Incidentes</div>
              <p className="text-sm text-[var(--mut)]">
                Seguimiento operativo, dotaciones asignadas y cierre de salidas.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
              <Siren className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniMetric label="Abiertos" value={stats.open} />
            <MiniMetric label="Asignaciones" value={stats.assigned} />
          </div>
        </section>

        {manager && <CreateIncidentPanel alerts={alerts} roster={roster} />}

        <section className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((filter) => {
            const active = statusFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.08em]",
                  active
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-[var(--bord)] bg-[var(--card)] text-[var(--mut)]",
                ].join(" ")}
              >
                {filter.label}
              </button>
            );
          })}
        </section>

        {isLoading && (
          <div className="card text-sm text-[var(--mut)]">
            Cargando incidentes...
          </div>
        )}

        {isError && (
          <div className="card border-red-500/30 bg-red-500/10 text-sm text-red-300">
            No se pudieron cargar los incidentes.
          </div>
        )}

        {!isLoading && !isError && incidents.length === 0 && (
          <div className="card text-sm text-[var(--mut)]">
            No hay incidentes para este filtro.
          </div>
        )}

        <section className="space-y-3">
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              roster={roster}
              canManage={manager}
            />
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

function CreateIncidentPanel({
  alerts,
  roster,
}: {
  alerts: BackendAlert[];
  roster: UserRosterItem[];
}) {
  const createMutation = useCreateIncident();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<CreateIncidentPayload>({
    alertId: "",
    title: "",
    type: "OTHER",
    description: "",
    losses: "",
    assignedUserIds: [],
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
    }));
  }

  function toggleAssigned(userId: string) {
    setForm((current) => ({
      ...current,
      assignedUserIds: current.assignedUserIds?.includes(userId)
        ? current.assignedUserIds.filter((id) => id !== userId)
        : [...(current.assignedUserIds || []), userId],
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
        losses: "",
        assignedUserIds: [],
      });
      setIsOpen(false);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo crear el incidente."));
    }
  }

  return (
    <section className="card">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="flex items-center gap-2 font-bold text-white">
          <Plus className="h-5 w-5 text-red-400" />
          Nuevo incidente
        </span>
        <span className="text-sm text-[var(--mut)]">
          {isOpen ? "Cerrar" : "Crear"}
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

          <div>
            <span className="app-label">Dotacion</span>
            <div className="grid max-h-[220px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {roster.map((member) => {
                const selected = form.assignedUserIds?.includes(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleAssigned(member.id)}
                    className={[
                      "rounded-[10px] border px-3 py-2 text-left transition",
                      selected
                        ? "border-red-500 bg-red-500/10"
                        : "border-[var(--bord)] bg-[var(--card2)]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-bold text-white">
                      {memberName(member)}
                    </div>
                    <div className="text-xs text-[var(--mut)]">
                      {member.profile?.rank || member.role}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="app-button app-button-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            Crear incidente
          </button>
        </form>
      )}
    </section>
  );
}

function IncidentCard({
  incident,
  roster,
  canManage,
}: {
  incident: Incident;
  roster: UserRosterItem[];
  canManage: boolean;
}) {
  const updateMutation = useUpdateIncident();
  const closeMutation = useCloseIncident();
  const assignMutation = useAssignIncidentUsers();
  const [isEditing, setIsEditing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [draft, setDraft] = useState({
    title: incident.title,
    type: incident.type,
    description: incident.description,
    losses: incident.losses || "",
  });

  const assignedIds = new Set(
    incident.assignments.map((assignment) => assignment.userId),
  );
  const assignableRoster = roster.filter((member) => !assignedIds.has(member.id));
  const isOpen = incident.status === "OPEN";

  async function saveEdit() {
    try {
      await updateMutation.mutateAsync({
        id: incident.id,
        ...draft,
      });
      setIsEditing(false);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo actualizar el incidente."));
    }
  }

  async function closeIncident() {
    const confirmed = window.confirm(
      "Cerrar este incidente? Si tiene una alerta activa vinculada, tambien se marcara como resuelta.",
    );

    if (!confirmed) return;

    try {
      await closeMutation.mutateAsync(incident.id);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo cerrar el incidente."));
    }
  }

  async function assignUsers() {
    if (selectedUsers.length === 0) return;

    try {
      await assignMutation.mutateAsync({
        id: incident.id,
        userIds: selectedUsers,
      });
      setSelectedUsers([]);
      setIsAssigning(false);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo asignar personal."));
    }
  }

  function toggleSelection(userId: string) {
    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  return (
    <article
      className={[
        "rounded-xl border p-4",
        isOpen
          ? "border-red-500/25 bg-[var(--card)]"
          : "border-[var(--bord)] bg-[var(--card)] opacity-90",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`badge ${
                isOpen ? "badge-red" : "badge-green"
              }`}
            >
              {statusLabel(incident.status)}
            </span>
            <span className="badge badge-gray">{typeLabel(incident.type)}</span>
            {incident.alertId && <span className="badge badge-blue">Alerta</span>}
          </div>
          <h2 className="mt-2 text-lg font-bold leading-tight text-white">
            {incident.title}
          </h2>
          <p className="mt-1 text-xs text-[var(--mut)]">
            Inicio {formatDateTime(incident.occurredAt)}
            {incident.closedAt ? ` - cierre ${formatDateTime(incident.closedAt)}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Flame className="h-5 w-5 text-red-400" />
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="app-label">Tipo</span>
              <select
                value={draft.type}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    type: event.target.value as IncidentType,
                  }))
                }
                className="app-input"
                disabled={Boolean(incident.alertId)}
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
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="app-input"
                maxLength={140}
              />
            </label>
          </div>

          <label>
            <span className="app-label">Descripcion</span>
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="app-input min-h-[90px] resize-none"
            />
          </label>

          <label>
            <span className="app-label">Perdidas</span>
            <textarea
              value={draft.losses}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  losses: event.target.value,
                }))
              }
              className="app-input min-h-[72px] resize-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft({
                  title: incident.title,
                  type: incident.type,
                  description: incident.description,
                  losses: incident.losses || "",
                });
                setIsEditing(false);
              }}
              className="app-button app-button-outline"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={updateMutation.isPending}
              className="app-button app-button-red disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--txt)]">
            {incident.description}
          </p>

          {incident.losses && (
            <div className="mt-3 rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3 text-sm text-[var(--mut)]">
              <span className="font-bold text-white">Perdidas: </span>
              {incident.losses}
            </div>
          )}
        </>
      )}

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
          <Users className="h-4 w-4 text-red-400" />
          Dotacion asignada
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {incident.assignments.length === 0 ? (
            <div className="rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3 text-sm text-[var(--mut)]">
              Sin personal asignado.
            </div>
          ) : (
            incident.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3"
              >
                <div className="text-sm font-bold text-white">
                  {memberName(assignment.user)}
                </div>
                <div className="text-xs text-[var(--mut)]">
                  {assignment.user.profile?.rank || assignment.user.role}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {canManage && isOpen && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="app-button app-button-outline"
          >
            <ClipboardPenLine className="h-4 w-4" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setIsAssigning((current) => !current)}
            className="app-button app-button-outline"
          >
            <UserPlus className="h-4 w-4" />
            Asignar
          </button>
          <button
            type="button"
            onClick={closeIncident}
            disabled={closeMutation.isPending}
            className="app-button app-button-green disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            Cerrar
          </button>
        </div>
      )}

      {canManage && isOpen && isAssigning && (
        <div className="mt-4 rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3">
          <div className="mb-2 text-sm font-bold text-white">
            Agregar personal
          </div>

          {assignableRoster.length === 0 ? (
            <p className="text-sm text-[var(--mut)]">
              Todo el personal activo ya esta asignado.
            </p>
          ) : (
            <div className="grid max-h-[220px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {assignableRoster.map((member) => {
                const selected = selectedUsers.includes(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleSelection(member.id)}
                    className={[
                      "rounded-[10px] border px-3 py-2 text-left transition",
                      selected
                        ? "border-red-500 bg-red-500/10"
                        : "border-[var(--bord)] bg-[var(--card)]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-bold text-white">
                      {memberName(member)}
                    </div>
                    <div className="text-xs text-[var(--mut)]">
                      {member.profile?.rank || member.role}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={assignUsers}
            disabled={assignMutation.isPending || selectedUsers.length === 0}
            className="app-button app-button-red mt-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Asignar seleccionados
          </button>
        </div>
      )}
    </article>
  );
}
