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
      ...(times.departedAt ? { departedAt: iso(times.departedAt) } : {}),
      ...(times.arrivedAt ? { arrivedAt: iso(times.arrivedAt) } : {}),
      ...(times.returnedAt ? { returnedAt: iso(times.returnedAt) } : {}),
    });
    if (!savedMovement) return;
    setAssetId("");
    setUserIds([]);
    setDriverUserId("");
    setLeaderUserId("");
    setExceptionReason("");
    setTimes({ departedAt: "", arrivedAt: "", returnedAt: "" });
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

              <fieldset className="rounded-xl border border-[var(--bord)] p-3">
                <legend className="px-1 text-sm font-semibold">Horarios {historical ? "reales" : "(si cargás la planilla después)"}</legend>
                <p className="mb-2 text-xs text-[var(--mut)]">{historical ? "Al rehacer una intervención cargá la salida y el retorno reales." : "Dejalos vacíos si el móvil sale ahora. Si ya salió, poné la hora real; si además ya volvió, completá el regreso y queda cargada la salida completa."}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {([["departedAt", "Hora de salida", historical], ["arrivedAt", "Llegada al lugar", false], ["returnedAt", "Regreso al cuartel", historical]] as const).map(([key, label, required]) => (
                    <Field key={key} label={label}>
                      <input type="datetime-local" required={required} max={localNow()} className="app-input" value={times[key]} onChange={(event) => setTimes((current) => ({ ...current, [key]: event.target.value }))} />
                    </Field>
                  ))}
                </div>
              </fieldset>

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
              <button
                className="app-button app-button-red w-auto"
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
            {canWrite && incidentOpen && !movement.returnedAt && (
              <label className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[var(--mut)]">{movement.arrivedAt ? "Hora del regreso" : "Hora de la llegada"}</span>
                <input type="datetime-local" className="app-input w-auto py-1.5" max={localNow()} value={when[movement.id] ?? ""} onChange={(e) => setWhen((w) => ({ ...w, [movement.id]: e.target.value }))} />
                <span className="text-xs text-[var(--mut)]">vacío = ahora</span>
              </label>
            )}
            {canWrite && incidentOpen && !movement.returnedAt && (
              <div className="mt-3 flex flex-wrap gap-2">
                {!movement.arrivedAt && (
                  <button
                    type="button"
                    className="app-button w-auto"
                    disabled={busy}
                    onClick={() => void runAction(`/${movement.id}/arrive`, when[movement.id] ? { at: iso(when[movement.id]) } : {}).then((ok) => ok && setWhen((w) => ({ ...w, [movement.id]: "" })))}
                  >
                    Registrar llegada al lugar
                  </button>
                )}
                {movement.arrivedAt && (
                  <button
                    type="button"
                    className="app-button w-auto"
                    disabled={busy}
                    onClick={() => void runAction(`/${movement.id}/return`, when[movement.id] ? { at: iso(when[movement.id]) } : {}).then((ok) => ok && setWhen((w) => ({ ...w, [movement.id]: "" })))}
                  >
                    Registrar retorno al cuartel
                  </button>
                )}
                {!movement.arrivedAt && (
                  <button
                    type="button"
                    className="app-button w-auto"
                    disabled={busy}
                    onClick={() => void returnWithoutArrival(movement.id)}
                  >
                    Regresó sin llegar (p. ej., falsa salida)
                  </button>
                )}
              </div>
            )}
            {canWrite && incidentOpen && fixing?.id !== movement.id && (
              <button type="button" className="mt-2 text-sm underline" onClick={() => setFixing({ id: movement.id, departedAt: toLocal(movement.departedAt), arrivedAt: toLocal(movement.arrivedAt), returnedAt: toLocal(movement.returnedAt), reason: "" })}>Corregir horarios</button>
            )}
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
