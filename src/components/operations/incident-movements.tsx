"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { UserRosterItem } from "@/types/user";
import { Field, personName } from "./operations-ui";
import { PeoplePicker } from "./work-ui";

type Movement = {
  id: string;
  assetId: string;
  asset: { name: string; status: string };
  driverUserId: string;
  leaderUserId: string;
  departedAt: string;
  arrivedAt: string | null;
  returnedAt: string | null;
  returnWithoutArrivalReason: string | null;
  dispatchExceptionReason: string | null;
  crew: Array<{ userId: string; user: UserRosterItem }>;
};

type Options = {
  assets: Array<{
    id: string;
    name: string;
    status: string;
    dispatchable: boolean;
    requiresException: boolean;
    expiredControl?: boolean;
    hasBlockingIssue: boolean;
    licenseRule?: { category: string; label: string; required: string[] };
  }>;
  licensed?: Array<{ assetId: string; userId: string }>;
  people: UserRosterItem[];
  authorizations: Array<{
    assetId: string;
    userId: string;
    requiredClass: string;
    validUntil: string;
    licenseCurrent: boolean;
  }>;
};

type Props = {
  incidentId: string;
  incidentOpen: boolean;
  canWrite: boolean;
  movements: Movement[];
  saved: () => Promise<unknown>;
  historical?: boolean;
};

const dateTime = (value: string) =>
  new Date(value).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());

export function IncidentMovements({
  incidentId,
  incidentOpen,
  canWrite,
  movements,
  saved,
  historical = false,
}: Props) {
  const [times, setTimes] = useState({ departedAt: "", arrivedAt: "", returnedAt: "" });
  const iso = (value: string) => (value ? new Date(value).toISOString() : undefined);
  // Hora local para inputs datetime-local (la planilla se carga a veces despues de la salida).
  const localNow = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const toLocal = (value: string | null) => { if (!value) return ""; const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const [when, setWhen] = useState<Record<string, string>>({});
  // Por defecto se registra en el momento ("ahora"); "Cargar hora" permite poner la hora real.
  const [manualDeparture, setManualDeparture] = useState(false);
  const [alreadyBack, setAlreadyBack] = useState(false);
  const [manualFor, setManualFor] = useState<string | null>(null);
  // Corregir quien salio: quien se quita vuelve a aparecer para "personal en la base".
  const [crewEdit, setCrewEdit] = useState<{ id: string; assetId: string; userIds: string[]; driverUserId: string; leaderUserId: string; reason: string } | null>(null);
  const [fixing, setFixing] = useState<{ id: string; departedAt: string; arrivedAt: string; returnedAt: string; reason: string } | null>(null);
  const [assetId, setAssetId] = useState("");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [driverUserId, setDriverUserId] = useState("");
  const [leaderUserId, setLeaderUserId] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = useQuery({
    queryKey: ["mission-options", incidentId],
    enabled: canWrite && incidentOpen,
    queryFn: async () =>
      (await api.get<Options>("/incidents/logistics/options")).data,
  });
  const selectedAsset = options.data?.assets.find((asset) => asset.id === assetId);
  const selectedPeople =
    options.data?.people.filter((person) => userIds.includes(person.id)) || [];

  // Habilitado por licencia (movil con categoria configurada) o por habilitacion manual de jefatura.
  function hasCurrentPermit(userId: string) {
    if (selectedAsset?.licenseRule?.required.length) return Boolean(options.data?.licensed?.some((row) => row.assetId === assetId && row.userId === userId));
    return Boolean(
      options.data?.authorizations.some(
        (permit) =>
          permit.assetId === assetId &&
          permit.userId === userId &&
          permit.licenseCurrent &&
          permit.validUntil.slice(0, 10) >= today(),
      ),
    );
  }

  async function runAction(path: string, data: unknown = {}) {
    setBusy(true);
    setError("");
    try {
      await api.post(`/incidents/logistics${path}`, data);
      await saved();
      return true;
    } catch (actionError: unknown) {
      setError(getErrorMessage(actionError, "No se pudo actualizar la planilla."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function registerMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAsset?.dispatchable) return;
    if (!hasCurrentPermit(driverUserId)) {
      setError("El conductor debe tener licencia vigente y habilitación para este móvil.");
      return;
    }
    const savedMovement = await runAction("", {
      incidentId,
      assetId,
      userIds,
      driverUserId,
      leaderUserId,
      ...(selectedAsset.requiresException
        ? { dispatchExceptionReason: exceptionReason }
        : {}),
      // Horarios reales si se cargaron; vacios = ahora.
      ...((manualDeparture || historical) && times.departedAt ? { departedAt: iso(times.departedAt) } : {}),
      ...((alreadyBack || historical) && times.arrivedAt ? { arrivedAt: iso(times.arrivedAt) } : {}),
      ...((alreadyBack || historical) && times.returnedAt ? { returnedAt: iso(times.returnedAt) } : {}),
    });
    if (!savedMovement) return;
    setAssetId("");
    setUserIds([]);
    setDriverUserId("");
    setLeaderUserId("");
    setExceptionReason("");
    setTimes({ departedAt: "", arrivedAt: "", returnedAt: "" });
    setManualDeparture(false); setAlreadyBack(false);
  }
  // Llegada o regreso: en el momento o con la hora cargada a mano.
  async function stamp(movementId: string, action: "arrive" | "return", manual: boolean) {
    const at = manual ? when[movementId] : "";
    if (manual && !at) { setError("Elegí la hora o tocá el botón «ahora»."); return; }
    const ok = await runAction(`/${movementId}/${action}`, at ? { at: iso(at) } : {});
    if (ok) { setWhen((w) => ({ ...w, [movementId]: "" })); setManualFor(null); }
  }

  // Apto para manejar un movil: por licencia (movil configurado) o por habilitacion de jefatura.
  function canDrive(movementAssetId: string, userId: string) {
    const asset = options.data?.assets.find((a) => a.id === movementAssetId);
    if (asset?.licenseRule?.required.length) return Boolean(options.data?.licensed?.some((row) => row.assetId === movementAssetId && row.userId === userId));
    return Boolean(options.data?.authorizations.some((p) => p.assetId === movementAssetId && p.userId === userId && p.licenseCurrent && p.validUntil.slice(0, 10) >= today()));
  }
  async function saveCrew() {
    if (!crewEdit) return;
    setBusy(true); setError("");
    try {
      await api.patch(`/incidents/logistics/${crewEdit.id}/crew`, { userIds: crewEdit.userIds, driverUserId: crewEdit.driverUserId, leaderUserId: crewEdit.leaderUserId, reason: crewEdit.reason.trim() });
      setCrewEdit(null); await saved();
    } catch (err) { setError(getErrorMessage(err, "No se pudo corregir la dotación.")); }
    finally { setBusy(false); }
  }

  async function saveCorrection() {
    if (!fixing) return;
    setBusy(true); setError("");
    try {
      await api.patch(`/incidents/logistics/${fixing.id}/times`, { departedAt: iso(fixing.departedAt), arrivedAt: fixing.arrivedAt ? iso(fixing.arrivedAt) : null, ...(fixing.returnedAt ? { returnedAt: iso(fixing.returnedAt) } : {}), reason: fixing.reason.trim() });
      setFixing(null); await saved();
    } catch (err) { setError(getErrorMessage(err, "No se pudieron corregir los horarios.")); }
    finally { setBusy(false); }
  }

  async function returnWithoutArrival(movementId: string) {
    const reason = window.prompt(
      "Retorno sin llegar al lugar. Puede indicar el motivo (opcional), por ejemplo falsa salida:",
    );
    if (reason === null) return;
    await runAction(`/${movementId}/return-without-arrival`, { ...(reason.trim() ? { reason: reason.trim() } : {}), ...(when[movementId] ? { at: iso(when[movementId]) } : {}) });
  }

  return (
    <section aria-label="Salidas de móviles" className="space-y-4">

      {canWrite && incidentOpen && (
        <form onSubmit={registerMovement} className="space-y-3">
          {options.isLoading && <ListSkeleton label="Cargando móviles y dotación" />}
          {options.isError && (
            <p role="alert" className="text-sm text-red-300">
              No se pudo cargar la información para registrar una salida.
            </p>
          )}
          {options.data && (
            <>
              <Field label="Móvil">
                <select
                  required
                  className="app-input"
                  value={assetId}
                  onChange={(event) => setAssetId(event.target.value)}
                >
                  <option value="">Seleccionar móvil</option>
                  {options.data.assets.map((asset) => (
                    <option
                      key={asset.id}
                      value={asset.id}
                      disabled={!asset.dispatchable}
                    >
                      {asset.name}
                      {asset.status === "MAINTENANCE"
                        ? asset.hasBlockingIssue
                          ? " · Bloqueado por falla"
                          : " · Mantenimiento no bloqueante"
                        : asset.status !== "OPERATIONAL"
                          ? " · Fuera de servicio"
                          : ""}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedAsset?.requiresException && (
                <div
                  role="alert"
                  className="space-y-2 rounded-md border-2 border-amber-400 bg-amber-400/10 p-3 text-amber-100"
                >
                  <strong>
                    {selectedAsset.expiredControl
                      ? "ATENCIÓN: el control semanal del móvil está vencido."
                      : "ATENCIÓN: el móvil tiene una falla no bloqueante."}
                  </strong>
                  <p className="text-sm">
                    La salida se permite de forma excepcional, con motivo
                    documentado. Se notificará a Oficial/Suboficial y quedará
                    constancia en la planilla.
                  </p>
                  <Field label="Motivo y condición excepcional">
                    <textarea
                      className="app-input min-h-20"
                      required
                      minLength={10}
                      maxLength={1000}
                      value={exceptionReason}
                      onChange={(event) => setExceptionReason(event.target.value)}
                    />
                  </Field>
                </div>
              )}


              <PeoplePicker
                people={options.data.people}
                value={userIds}
                onChange={(nextIds) => {
                  setUserIds(nextIds);
                  if (!nextIds.includes(driverUserId)) setDriverUserId("");
                  if (!nextIds.includes(leaderUserId)) setLeaderUserId("");
                }}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={selectedAsset?.licenseRule?.required.length ? `Conductor (licencia ${selectedAsset.licenseRule.required.join(" + ")} vigente)` : "Conductor (habilitado por jefatura con licencia vigente)"}>
                  <select
                    required
                    className="app-input"
                    value={driverUserId}
                    onChange={(event) => setDriverUserId(event.target.value)}
                  >
                    <option value="">Seleccionar conductor</option>
                    {selectedPeople.map((person) => {
                      const enabled = hasCurrentPermit(person.id);
                      return (
                        <option key={person.id} value={person.id} disabled={!enabled}>
                          {personName(person)}
                          {enabled ? " · Apto" : selectedAsset?.licenseRule?.required.length ? " · Sin la licencia que exige" : " · No habilitado/licencia no vigente"}
                        </option>
                      );
                    })}
                  </select>
                </Field>
                <Field label="Persona a cargo de la unidad">
                  <select
                    required
                    className="app-input"
                    value={leaderUserId}
                    onChange={(event) => setLeaderUserId(event.target.value)}
                  >
                    <option value="">Seleccionar integrante</option>
                    {selectedPeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {personName(person)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <fieldset className="min-w-0 space-y-3 rounded-xl border border-[var(--bord)] p-3">
                <legend className="px-1 text-sm font-semibold">Hora de salida</legend>
                {!historical && <div role="radiogroup" aria-label="Hora de salida" className="grid grid-cols-2 gap-2">
                  {([[false, "Sale ahora"], [true, "Cargar hora"]] as const).map(([manual, label]) => <button key={label} type="button" role="radio" aria-checked={manualDeparture === manual} onClick={() => { setManualDeparture(manual); if (!manual) setAlreadyBack(false); }} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${manualDeparture === manual ? "border-red-500 bg-red-500/15 text-[var(--txt)]" : "border-[var(--bord)] text-[var(--mut)]"}`}>{label}</button>)}
                </div>}
                {(manualDeparture || historical) && <>
                  <Field label="Salió a las"><input type="datetime-local" required max={localNow()} className="app-input" value={times.departedAt} onChange={(e) => setTimes((t) => ({ ...t, departedAt: e.target.value }))} /></Field>
                  {!historical && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={alreadyBack} onChange={(e) => setAlreadyBack(e.target.checked)} /> El móvil ya volvió (cargar la salida completa)</label>}
                  {(alreadyBack || historical) && <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                    <Field label="Llegó al lugar (si llegó)"><input type="datetime-local" max={localNow()} className="app-input" value={times.arrivedAt} onChange={(e) => setTimes((t) => ({ ...t, arrivedAt: e.target.value }))} /></Field>
                    <Field label="Volvió al cuartel"><input type="datetime-local" required max={localNow()} className="app-input" value={times.returnedAt} onChange={(e) => setTimes((t) => ({ ...t, returnedAt: e.target.value }))} /></Field>
                  </div>}
                </>}
                {!manualDeparture && !historical && <p className="text-xs text-[var(--mut)]">Se registra con la hora del momento en que tocás «Registrar salida».</p>}
              </fieldset>
              <button
                className="app-button app-button-red w-full sm:w-auto"
                disabled={
                  busy ||
                  !selectedAsset?.dispatchable ||
                  !userIds.length ||
                  !userIds.includes(driverUserId) ||
                  !userIds.includes(leaderUserId) ||
                  !hasCurrentPermit(driverUserId) ||
                  Boolean(
                    selectedAsset?.requiresException &&
                      exceptionReason.trim().length < 10,
                  )
                }
              >
                Registrar salida del móvil
              </button>
            </>
          )}
        </form>
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {!movements.length && <p>No hay salidas de móviles registradas.</p>}
      <div className="space-y-3">
        {movements.map((movement) => (
          <article
            key={movement.id}
            className="rounded-md border border-[var(--bord)] p-3"
          >
            <h3 className="font-bold">{movement.asset.name}</h3>
            <p className="text-sm">
              Salió: {dateTime(movement.departedAt)}
              {" · Llegada: "}
              {movement.returnWithoutArrivalReason
                ? "No llegó al lugar"
                : movement.arrivedAt
                  ? dateTime(movement.arrivedAt)
                  : "Pendiente"}
              {" · Retorno al cuartel: "}
              {movement.returnedAt ? dateTime(movement.returnedAt) : "Pendiente"}
            </p>
            {movement.dispatchExceptionReason && (
              <p
                role="alert"
                className="mt-2 border-l-4 border-amber-400 bg-amber-400/10 p-2 text-sm text-amber-100"
              >
                Salida excepcional con falla no bloqueante:{" "}
                {movement.dispatchExceptionReason}
              </p>
            )}
            {movement.returnWithoutArrivalReason && (
              <p className="mt-2 text-sm text-amber-200">
                Regreso sin llegar al lugar: {movement.returnWithoutArrivalReason}
              </p>
            )}
            <ul className="mt-2 text-sm">
              {movement.crew.map((member) => (
                <li key={member.userId}>
                  {personName(member.user)}
                  {member.userId === movement.driverUserId ? " · Conductor" : ""}
                  {member.userId === movement.leaderUserId ? " · A cargo" : ""}
                </li>
              ))}
            </ul>
            {canWrite && incidentOpen && !movement.returnedAt && (() => {
              const next = movement.arrivedAt ? "return" as const : "arrive" as const;
              const nowLabel = next === "arrive" ? "Llegó al lugar ahora" : "Volvió al cuartel ahora";
              return <div className="mt-3 space-y-2">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <button type="button" className="app-button app-button-red min-h-12 w-full" disabled={busy} onClick={() => void stamp(movement.id, next, false)}>{nowLabel}</button>
                  <button type="button" className="app-button app-button-outline min-h-12 w-full sm:w-auto" disabled={busy} aria-expanded={manualFor === movement.id} onClick={() => setManualFor(manualFor === movement.id ? null : movement.id)}>Cargar hora</button>
                </div>
                {manualFor === movement.id && <div className="grid min-w-0 gap-2 rounded-xl border border-[var(--bord)] p-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <Field label={next === "arrive" ? "Llegó al lugar a las" : "Volvió al cuartel a las"}><input type="datetime-local" max={localNow()} className="app-input" value={when[movement.id] ?? ""} onChange={(e) => setWhen((w) => ({ ...w, [movement.id]: e.target.value }))} /></Field>
                  <button type="button" className="app-button w-full sm:w-auto" disabled={busy || !when[movement.id]} onClick={() => void stamp(movement.id, next, true)}>Guardar hora</button>
                </div>}
                {!movement.arrivedAt && <button type="button" className="text-sm underline" disabled={busy} onClick={() => void returnWithoutArrival(movement.id)}>Regresó sin llegar al lugar (p. ej., falsa salida)</button>}
              </div>;
            })()}
            {canWrite && incidentOpen && fixing?.id !== movement.id && crewEdit?.id !== movement.id && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <button type="button" className="underline" onClick={() => setFixing({ id: movement.id, departedAt: toLocal(movement.departedAt), arrivedAt: toLocal(movement.arrivedAt), returnedAt: toLocal(movement.returnedAt), reason: "" })}>Corregir horarios</button>
                <button type="button" className="underline" onClick={() => setCrewEdit({ id: movement.id, assetId: movement.assetId, userIds: movement.crew.map((c) => c.userId), driverUserId: movement.driverUserId, leaderUserId: movement.leaderUserId, reason: "" })}>Corregir dotación</button>
              </div>
            )}
            {crewEdit?.id === movement.id && (() => {
              const chosen = options.data?.people.filter((p) => crewEdit.userIds.includes(p.id)) ?? [];
              const toggle = (id: string) => setCrewEdit((c) => c && { ...c, userIds: c.userIds.includes(id) ? c.userIds.filter((x) => x !== id) : [...c.userIds, id], driverUserId: c.userIds.includes(id) && c.driverUserId === id ? "" : c.driverUserId, leaderUserId: c.userIds.includes(id) && c.leaderUserId === id ? "" : c.leaderUserId });
              return <div className="mt-3 space-y-3 rounded-xl border border-[var(--bord)] p-3">
                <p className="text-sm font-semibold">¿Quiénes salieron en este móvil?</p>
                <div className="grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">{options.data?.people.map((p) => <label key={p.id} className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--bord)] px-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={crewEdit.userIds.includes(p.id)} onChange={() => toggle(p.id)} />{personName(p)}</label>)}</div>
                <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                  <Field label="Conductor"><select className="app-input" value={crewEdit.driverUserId} onChange={(e) => setCrewEdit({ ...crewEdit, driverUserId: e.target.value })}><option value="">Seleccionar</option>{chosen.map((p) => <option key={p.id} value={p.id} disabled={!canDrive(crewEdit.assetId, p.id)}>{personName(p)}{canDrive(crewEdit.assetId, p.id) ? "" : " · no habilitado"}</option>)}</select></Field>
                  <Field label="A cargo de la unidad"><select className="app-input" value={crewEdit.leaderUserId} onChange={(e) => setCrewEdit({ ...crewEdit, leaderUserId: e.target.value })}><option value="">Seleccionar</option>{chosen.map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}</select></Field>
                </div>
                <Field label="Motivo de la corrección"><input className="app-input" minLength={5} maxLength={500} value={crewEdit.reason} onChange={(e) => setCrewEdit({ ...crewEdit, reason: e.target.value })} placeholder="Ej. Se cargó a una persona que quedó en el cuartel" /></Field>
                <p className="text-xs text-[var(--mut)]">Quien quites vuelve a aparecer para “personal en la base”; quien agregues deja de figurar ahí.</p>
                <div className="flex gap-2"><button type="button" className="app-button app-button-red w-auto" disabled={busy || !crewEdit.userIds.length || !crewEdit.driverUserId || !crewEdit.leaderUserId || crewEdit.reason.trim().length < 5} onClick={() => void saveCrew()}>Guardar dotación</button><button type="button" className="app-button w-auto" onClick={() => setCrewEdit(null)}>Cancelar</button></div>
              </div>;
            })()}
            {fixing?.id === movement.id && (
              <div className="mt-3 space-y-2 rounded-xl border border-[var(--bord)] p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="Salida"><input type="datetime-local" required className="app-input" max={localNow()} value={fixing.departedAt} onChange={(e) => setFixing({ ...fixing, departedAt: e.target.value })} /></Field>
                  <Field label="Llegada al lugar"><input type="datetime-local" className="app-input" max={localNow()} disabled={Boolean(movement.returnWithoutArrivalReason)} value={fixing.arrivedAt} onChange={(e) => setFixing({ ...fixing, arrivedAt: e.target.value })} /></Field>
                  <Field label="Regreso"><input type="datetime-local" className="app-input" max={localNow()} disabled={!movement.returnedAt} value={fixing.returnedAt} onChange={(e) => setFixing({ ...fixing, returnedAt: e.target.value })} /></Field>
                </div>
                <Field label="Motivo de la corrección"><input className="app-input" minLength={5} maxLength={500} value={fixing.reason} onChange={(e) => setFixing({ ...fixing, reason: e.target.value })} placeholder="Ej. la planilla se cargó después de la salida" /></Field>
                <div className="flex gap-2"><button type="button" className="app-button app-button-red w-auto" disabled={busy || fixing.reason.trim().length < 5 || !fixing.departedAt} onClick={() => void saveCorrection()}>Guardar horarios</button><button type="button" className="app-button w-auto" onClick={() => setFixing(null)}>Cancelar</button></div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
