"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import {
  useCreateShift,
  useDeleteShift,
  useShifts,
  useUserRoster,
} from "@/hooks/use-shifts";
import { getErrorMessage } from "@/lib/get-error-message";
import { Shift } from "@/types/shift";
import { UserRosterItem } from "@/types/user";

type ShiftFormState = {
  date: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  notes: string;
  assignedUserIds: string[];
};

const weekdayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKeyFromApi(value: string) {
  return value.slice(0, 10);
}

function getMonthGrid(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayOffset);

  const sundayOffset = 6 - ((lastDay.getDay() + 6) % 7);
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(lastDay.getDate() + sundayOffset);

  const days: Date[] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return { days, from: toDateKey(gridStart), to: toDateKey(gridEnd) };
}

function isManager(role?: string) {
  return role === "ADMIN" || role === "OPERATOR";
}

function memberLabel(user: UserRosterItem) {
  return user.profile?.fullName || user.username;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const monthGrid = useMemo(() => getMonthGrid(monthDate), [monthDate]);
  const { data: shifts = [], isLoading, isError } = useShifts({
    from: monthGrid.from,
    to: monthGrid.to,
  });
  const { data: roster = [] } = useUserRoster();

  const shiftsByDate = useMemo(() => {
    const grouped = new Map<string, Shift[]>();

    for (const shift of shifts) {
      const key = getDateKeyFromApi(shift.date);
      grouped.set(key, [...(grouped.get(key) || []), shift]);
    }

    return grouped;
  }, [shifts]);

  const monthTitle = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(monthDate);

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <section className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="section-title mb-1 mt-0">
                Calendario de guardias
              </div>
              <p className="text-sm text-[var(--mut)]">
                Turnos, horarios y personal asignado por dia.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn-icon"
              onClick={() =>
                setMonthDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-center font-['Bebas_Neue'] text-2xl capitalize tracking-[1px] text-white">
              {monthTitle}
            </h1>
            <button
              type="button"
              className="btn-icon"
              onClick={() =>
                setMonthDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        {manager && (
          <CreateShiftPanel
            roster={roster}
            defaultDate={toDateKey(new Date())}
          />
        )}

        {isError && (
          <div className="card border-red-500/30 bg-red-500/10 text-sm text-red-300">
            No se pudieron cargar las guardias.
          </div>
        )}

        <section className="card overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b border-[var(--bord)] bg-[var(--card2)]">
            {weekdayLabels.map((day) => (
              <div
                key={day}
                className="px-1 py-2 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--mut)]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthGrid.days.map((day) => {
              const key = toDateKey(day);
              const dayShifts = shiftsByDate.get(key) || [];
              const isCurrentMonth = day.getMonth() === monthDate.getMonth();
              const isToday = key === toDateKey(new Date());

              return (
                <div
                  key={key}
                  className={[
                    "min-h-[118px] border-b border-r border-[var(--bord)] p-1.5",
                    isCurrentMonth ? "bg-[var(--card)]" : "bg-black/25",
                  ].join(" ")}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={[
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        isToday
                          ? "bg-red-500 text-white"
                          : isCurrentMonth
                            ? "text-white"
                            : "text-[var(--dim)]",
                      ].join(" ")}
                    >
                      {day.getDate()}
                    </span>
                    {dayShifts.length > 0 && (
                      <span className="text-[10px] font-bold text-red-300">
                        {dayShifts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {isLoading && isCurrentMonth && (
                      <div className="h-8 rounded bg-white/5" />
                    )}
                    {dayShifts.slice(0, 2).map((shift) => (
                      <ShiftPill
                        key={shift.id}
                        shift={shift}
                        canDelete={manager}
                      />
                    ))}
                    {dayShifts.length > 2 && (
                      <div className="text-[10px] text-[var(--mut)]">
                        +{dayShifts.length - 2} mas
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <div className="section-title">Guardias del mes</div>
          {shifts.length === 0 && !isLoading ? (
            <div className="card text-sm text-[var(--mut)]">
              No hay guardias cargadas para este rango.
            </div>
          ) : (
            shifts.map((shift) => (
              <ShiftDetail key={shift.id} shift={shift} canDelete={manager} />
            ))
          )}
        </section>
      </main>
    </ProtectedLayout>
  );
}

function CreateShiftPanel({
  roster,
  defaultDate,
}: {
  roster: UserRosterItem[];
  defaultDate: string;
}) {
  const createMutation = useCreateShift();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ShiftFormState>({
    date: defaultDate,
    startTime: "08:00",
    endTime: "20:00",
    shiftType: "Guardia operativa",
    notes: "",
    assignedUserIds: [],
  });

  function toggleUser(userId: string) {
    setForm((current) => ({
      ...current,
      assignedUserIds: current.assignedUserIds.includes(userId)
        ? current.assignedUserIds.filter((id) => id !== userId)
        : [...current.assignedUserIds, userId],
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createMutation.mutateAsync(form);
      setForm((current) => ({
        ...current,
        notes: "",
        assignedUserIds: [],
      }));
      setIsOpen(false);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo crear la guardia."));
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
          Nueva guardia
        </span>
        <span className="text-sm text-[var(--mut)]">
          {isOpen ? "Cerrar" : "Crear turno"}
        </span>
      </button>

      {isOpen && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label>
              <span className="app-label">Fecha</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                className="app-input"
                required
              />
            </label>
            <label>
              <span className="app-label">Inicio</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
                className="app-input"
                required
              />
            </label>
            <label>
              <span className="app-label">Fin</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
                className="app-input"
                required
              />
            </label>
          </div>

          <label>
            <span className="app-label">Tipo</span>
            <input
              value={form.shiftType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  shiftType: event.target.value,
                }))
              }
              className="app-input"
              maxLength={60}
              required
            />
          </label>

          <label>
            <span className="app-label">Notas</span>
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="app-input min-h-[78px] resize-none"
              placeholder="Indicaciones del turno..."
            />
          </label>

          <div>
            <span className="app-label">Personal asignado</span>
            <div className="grid max-h-[220px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {roster.map((member) => {
                const selected = form.assignedUserIds.includes(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleUser(member.id)}
                    className={[
                      "rounded-[10px] border px-3 py-2 text-left transition",
                      selected
                        ? "border-red-500 bg-red-500/10"
                        : "border-[var(--bord)] bg-[var(--card2)]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-bold text-white">
                      {memberLabel(member)}
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
            Crear guardia
          </button>
        </form>
      )}
    </section>
  );
}

function ShiftPill({
  shift,
  canDelete,
}: {
  shift: Shift;
  canDelete: boolean;
}) {
  return (
    <div className="rounded-[8px] border border-red-500/25 bg-red-500/10 p-1.5 text-[10px] leading-tight text-red-100">
      <div className="truncate font-bold">{shift.shiftType}</div>
      <div className="mt-0.5 flex items-center gap-1 text-red-200/75">
        <Clock3 className="h-3 w-3" />
        {shift.startTime}
      </div>
      {canDelete && <DeleteShiftButton id={shift.id} compact />}
    </div>
  );
}

function ShiftDetail({
  shift,
  canDelete,
}: {
  shift: Shift;
  canDelete: boolean;
}) {
  const date = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${getDateKeyFromApi(shift.date)}T12:00:00`));

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{shift.shiftType}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--mut)]">
            <span className="capitalize">{date}</span>
            <span>-</span>
            <span>
              {shift.startTime} a {shift.endTime}
            </span>
          </div>
        </div>
        {canDelete && <DeleteShiftButton id={shift.id} />}
      </div>

      {shift.notes && (
        <p className="mt-3 rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3 text-sm text-[var(--mut)]">
          {shift.notes}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 text-sm font-bold text-white">
        <Users className="h-4 w-4 text-red-400" />
        Personal asignado
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {shift.assignments.length === 0 ? (
          <div className="rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3 text-sm text-[var(--mut)]">
            Sin personal asignado.
          </div>
        ) : (
          shift.assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3"
            >
              <div className="text-sm font-bold text-white">
                {memberLabel(assignment.user)}
              </div>
              <div className="text-xs text-[var(--mut)]">
                {assignment.user.profile?.rank || assignment.user.role}
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function DeleteShiftButton({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  const deleteMutation = useDeleteShift();

  async function deleteShift() {
    const confirmed = window.confirm("Eliminar esta guardia?");
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo eliminar la guardia."));
    }
  }

  return (
    <button
      type="button"
      onClick={deleteShift}
      disabled={deleteMutation.isPending}
      className={
        compact
          ? "mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-200/80"
          : "btn-icon h-9 w-9 text-red-300"
      }
      aria-label="Eliminar guardia"
    >
      <Trash2 className={compact ? "h-3 w-3" : "h-4 w-4"} />
      {compact ? "Borrar" : null}
    </button>
  );
}
