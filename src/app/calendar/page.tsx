"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Pencil,
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
  useUpdateShift,
} from "@/hooks/use-shifts";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAvailability } from "@/hooks/use-operations";
import { Shift } from "@/types/shift";
import { UserRosterItem } from "@/types/user";
import { ShiftSwaps } from "@/components/operations/shift-swaps";

type ShiftFormState = {
  date: string;
  period: "DAY" | "NIGHT";
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

// M01: programan guardias solo jefatura y administracion.
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
  // undefined = sin eleccion: cada vista abre en su dia por defecto (Todas: hoy; Mis guardias: el mes).
  const [pickedDate, setSelectedDate] = useState<string | null | undefined>(undefined);
  const [mineChoice, setMineChoice] = useState<boolean | null>(null);
  const monthGrid = useMemo(() => getMonthGrid(monthDate), [monthDate]);
  const { data: shifts = [], isLoading, isError } = useShifts({
    from: monthGrid.from,
    to: monthGrid.to,
  });
  // Vista inicial: "Mis guardias" si la persona tiene alguna guardia asignada (en el mes que mira o en los
  // proximos 90 dias); si no tiene ninguna, "Todas". Despues manda lo que elija.
  const [range] = useState(() => { const now = new Date(); return { from: toDateKey(now), to: toDateKey(new Date(now.getTime() + 90 * 86_400_000)) }; });
  const todayKey = range.from;
  const upcoming = useShifts(range);
  const isMine = (shift: Shift) => shift.assignments.some((assignment) => assignment.userId === user?.id);
  const hasOwnShifts = shifts.some(isMine) || (upcoming.data ?? []).some(isMine);
  const onlyMine = mineChoice ?? (upcoming.isLoading ? false : hasOwnShifts);
  const selectedDate = pickedDate === undefined ? (onlyMine ? null : todayKey) : pickedDate;
  const { data: roster = [] } = useUserRoster();
  const monthShifts = shifts.filter((shift) => {
    const key = getDateKeyFromApi(shift.date);
    return key.slice(0, 7) === toDateKey(monthDate).slice(0, 7);
  });
  const displayedShifts = (selectedDate
    ? shifts.filter((shift) => getDateKeyFromApi(shift.date) === selectedDate)
    : monthShifts
  ).filter((shift) => !onlyMine || isMine(shift));

  const shiftsByDate = (() => {
    const grouped = new Map<string, Shift[]>();

    for (const shift of shifts) {
      const key = getDateKeyFromApi(shift.date);
      grouped.set(key, [...(grouped.get(key) || []), shift]);
    }

    return grouped;
  })();

  const monthTitle = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(monthDate);

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <header className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><CalendarDays className="h-6 w-6 text-red-400" aria-hidden /> Guardias</h1>
          <p className="mt-1 text-sm text-[var(--mut)]">Turno diurno 08:00 a 20:00 y nocturno 20:00 a 08:00. Tocá un día para ver quiénes están.</p>
        </header>
        <section className="card">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                setSelectedDate(null);
                setMonthDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                );
              }}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-center font-bold text-2xl tracking-[1px] text-white">
              {monthTitle.charAt(0).toLocaleUpperCase() + monthTitle.slice(1)}
            </h2>
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                setSelectedDate(null);
                setMonthDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                );
              }}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        {manager && !onlyMine && (
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

        <section className="mb-3 flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Qué guardias ver" className="flex flex-1 gap-1 rounded-xl border border-[var(--bord)] bg-black/20 p-1">
            {([[true, "Mis guardias"], [false, "Todas"]] as const).map(([value, text]) => (
              <button key={text} type="button" role="tab" aria-selected={onlyMine === value} onClick={() => { setMineChoice(value); setSelectedDate(undefined); }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${onlyMine === value ? "bg-red-600 text-white" : "text-white/70 hover:bg-white/[0.06]"}`}>{text}</button>
            ))}
          </div>
          <button type="button" className="app-button app-button-outline w-auto" onClick={() => {
            setMonthDate(new Date());
            setSelectedDate(toDateKey(new Date()));
          }}>Hoy</button>
        </section>

        <section className="card overflow-hidden p-0">
          <div className="min-w-0">
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
                const dayShifts = (shiftsByDate.get(key) || []).filter((shift) => !onlyMine || isMine(shift));
                const isCurrentMonth = day.getMonth() === monthDate.getMonth();
                const isToday = key === toDateKey(new Date());
                const mine = dayShifts.some((shift) => shift.assignments.some((assignment) => assignment.userId === user?.id));

                return (
                  <div
                    key={key}
                    className={[
                      "min-w-0 min-h-[78px] border-b border-r border-[var(--bord)] p-1 sm:min-h-[118px] lg:min-h-[136px] lg:p-2",
                      selectedDate === key ? "ring-2 ring-inset ring-red-400" : "",
                      isCurrentMonth ? "bg-[var(--card)]" : "bg-black/25",
                    ].join(" ")}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedDate(key)}
                        aria-label={new Intl.DateTimeFormat("es-AR", { dateStyle: "full" }).format(day)}
                        aria-pressed={selectedDate === key}
                        className={[
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          isToday
                            ? "bg-red-600 text-white"
                            : isCurrentMonth
                              ? "text-white"
                              : "text-[var(--dim)]",
                        ].join(" ")}
                      >
                        {day.getDate()}
                      </button>
                      {mine && (
                        <span className="rounded bg-red-600 px-1 text-[9px] font-bold uppercase text-white" title="Tenés guardia este día">Vos</span>
                      )}
                    </div>

                    <div className="mt-1 flex justify-center gap-1 sm:hidden" aria-hidden>
                      {(["DAY", "NIGHT"] as const).map((period) => (
                        <button key={period} type="button" onClick={() => setSelectedDate(key)}
                          aria-label={`${period === "DAY" ? "Diurno" : "Nocturno"} ${key}`}
                          className={`h-3 w-3 rounded-full border ${dayShifts.some((shift) => shift.period === period) ? period === "DAY" ? "border-amber-400 bg-amber-400" : "border-sky-400 bg-sky-400" : "border-[var(--bord)]"}`} />
                      ))}
                    </div>
                    <div className="hidden space-y-1 sm:block">
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
          </div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--bord)] px-3 py-2 text-xs text-[var(--mut)]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />Diurno</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" aria-hidden />Nocturno</span>
            <span className="flex items-center gap-1.5"><span className="rounded bg-red-600 px-1 text-[9px] font-bold text-white" aria-hidden>VOS</span>Tenés guardia</span>
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title m-0">
              {selectedDate ? (() => { const text = new Intl.DateTimeFormat("es-AR", { dateStyle: "full" }).format(new Date(`${selectedDate}T12:00:00`)); return text.charAt(0).toLocaleUpperCase() + text.slice(1); })() : onlyMine ? "Mis guardias del mes" : "Guardias del mes"}
            </h2>
            {selectedDate && <button type="button" className="text-sm text-red-300 underline-offset-4 hover:underline" onClick={() => setSelectedDate(null)}>Ver todo el mes</button>}
          </div>
          {displayedShifts.length === 0 && !isLoading && !isError ? (
            <div className="card text-sm text-[var(--mut)]">
              {onlyMine ? (selectedDate ? "No tenés guardia este día." : "No tenés guardias asignadas este mes. En “Todas” ves la agenda completa del cuartel.") : "No hay guardias cargadas para este rango."}
            </div>
          ) : (
            displayedShifts.map((shift) => (
              <ShiftDetail key={shift.id} shift={shift} canDelete={manager} roster={roster} />
            ))
          )}
        </section>

        {!onlyMine && <ShiftSwaps shifts={shifts} people={roster} />}
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
    period: "DAY",
    notes: "",
    assignedUserIds: [],
  });
  const availability = useAvailability(form.date);
  const unavailableIds = new Set((availability.data || [])
    .filter((item) => item.period === form.period && item.status === "UNAVAILABLE").map((item) => item.userId));
  const hasUnavailable = form.assignedUserIds.some((id) => unavailableIds.has(id));

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <div>
              <span className="app-label">Turno</span>
              <div className="grid grid-cols-2 gap-2">
                {(["DAY", "NIGHT"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, period }))}
                    className={`rounded-[10px] border px-3 py-3 text-sm font-bold ${form.period === period ? "border-red-500 bg-red-500/10 text-white" : "border-[var(--bord)] bg-[var(--card2)] text-[var(--mut)]"}`}
                  >
                    {period === "DAY" ? "Diurno 08-20" : "Nocturno 20-08"}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
                    disabled={!selected && unavailableIds.has(member.id)}
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
                      {unavailableIds.has(member.id) ? " · No disponible" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending || form.assignedUserIds.length === 0 || hasUnavailable}
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
    <div className={`rounded-[8px] border p-1.5 text-[10px] leading-tight ${shift.period === "DAY" ? "border-amber-500/30 bg-amber-500/10 text-amber-100" : "border-sky-500/30 bg-sky-500/10 text-sky-100"}`}>
      <div className="truncate font-bold">{shift.shiftType}</div>
      <div className="mt-0.5 flex items-center gap-1 opacity-75">
        <Clock3 className="h-3 w-3" />
        {shift.startTime}-{shift.endTime}
      </div>
      <div className="mt-1 line-clamp-2 opacity-80">
        {shift.assignments.length
          ? shift.assignments.map((assignment) => memberLabel(assignment.user).split(" ")[0]).join(", ")
          : "Sin personal"}
      </div>
      {canDelete && <DeleteShiftButton id={shift.id} compact />}
    </div>
  );
}

function ShiftDetail({
  shift,
  canDelete,
  roster,
}: {
  shift: Shift;
  canDelete: boolean;
  roster: UserRosterItem[];
}) {
  const updateMutation = useUpdateShift();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ShiftFormState>({
    date: getDateKeyFromApi(shift.date),
    period: shift.period || "DAY",
    notes: shift.notes || "",
    assignedUserIds: shift.assignments.map((assignment) => assignment.userId),
  });
  const availability = useAvailability(draft.date);
  const unavailableIds = new Set((availability.data || [])
    .filter((item) => item.period === draft.period && item.status === "UNAVAILABLE").map((item) => item.userId));
  const hasUnavailable = draft.assignedUserIds.some((id) => unavailableIds.has(id));
  const date = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${getDateKeyFromApi(shift.date)}T12:00:00`));

  function toggleDraftUser(userId: string) {
    setDraft((current) => ({
      ...current,
      assignedUserIds: current.assignedUserIds.includes(userId)
        ? current.assignedUserIds.filter((id) => id !== userId)
        : [...current.assignedUserIds, userId],
    }));
  }

  async function saveShift() {
    try {
      await updateMutation.mutateAsync({ id: shift.id, ...draft });
      setIsEditing(false);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo actualizar la guardia."));
    }
  }

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{shift.shiftType}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--mut)]">
            <span>{date.charAt(0).toLocaleUpperCase() + date.slice(1)}</span>
            <span>-</span>
            <span>
              {shift.startTime} a {shift.endTime}{shift.period === "NIGHT" ? " del dia siguiente" : ""}
            </span>
          </div>
        </div>
        {canDelete && (
          <div className="flex gap-2">
            <button type="button" className="btn-icon h-9 w-9" onClick={() => setIsEditing((value) => !value)} aria-label="Editar guardia">
              <Pencil className="h-4 w-4" />
            </button>
            <DeleteShiftButton id={shift.id} />
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 space-y-3 rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="app-label">Fecha</span>
              <input type="date" className="app-input" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
            </label>
            <label>
              <span className="app-label">Turno</span>
              <select className="app-input" value={draft.period} onChange={(event) => setDraft((current) => ({ ...current, period: event.target.value as "DAY" | "NIGHT" }))}>
                <option value="DAY">Diurno - 08:00 a 20:00</option>
                <option value="NIGHT">Nocturno - 20:00 a 08:00</option>
              </select>
            </label>
          </div>
          <label>
            <span className="app-label">Notas</span>
            <textarea className="app-input min-h-[70px]" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <div>
            <span className="app-label">Personal asignado</span>
            <div className="grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
              {roster.map((person) => {
                const selected = draft.assignedUserIds.includes(person.id);
                return (
                  <button key={person.id} type="button" disabled={!selected && unavailableIds.has(person.id)} onClick={() => toggleDraftUser(person.id)} className={`rounded-[10px] border p-2 text-left disabled:opacity-40 ${selected ? "border-red-500 bg-red-500/10" : "border-[var(--bord)] bg-[var(--card)]"}`}>
                    <div className="text-sm font-bold text-white">{memberLabel(person)}</div>
                    <div className="text-xs text-[var(--mut)]">{person.profile?.rank || person.role}{unavailableIds.has(person.id) ? " · No disponible" : ""}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <button type="button" onClick={saveShift} disabled={updateMutation.isPending || draft.assignedUserIds.length === 0 || hasUnavailable} className="app-button app-button-red">
            Guardar cambios
          </button>
        </div>
      )}

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
