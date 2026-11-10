"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient,useQuery } from "@tanstack/react-query";
import {api} from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { createInspection } from "@/services/inspections.service";
import { VehicleInventoryResponse } from "@/types/equipment";
import { AlertType, InspectionResult } from "@/types/inspection";
import { UserRosterItem } from "@/types/user";
import { flattenInventoryItems } from "./equipment.utils";
import InspectionItemRow from "./InspectionItemRow";
import InspectionDraftPanel, { clearInspectionDraft } from "./InspectionDraftPanel";
import { inventorySignature, InspectionDraft } from "@/lib/inspection-draft";
import { useAuth } from "@/features/auth/auth-context";

type Props = {
  vehicleId: string;
  inventory: VehicleInventoryResponse;
  roster: UserRosterItem[];
};

export default function InspectionForm({ vehicleId, inventory, roster }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [draft,setDraft]=useState<{id:string;revision:number;startedAt:string;participants:Array<{userId:string;attendanceId:string;joinedAt:string}>}|null>(null);
  const eligible=useQuery({queryKey:["control-draft",draft?.id],enabled:Boolean(draft),queryFn:async()=>(await api.get<{candidates:Array<{userId:string}>}>(`/inspections/drafts/${draft!.id}`)).data,refetchInterval:10000});
  const draftKey = `inspection-draft:v1:${user?.id || "anonymous"}:${vehicleId}`;
  const items = useMemo(() => flattenInventoryItems(inventory), [inventory]);

  const [inspectionDate, setInspectionDate] = useState(() =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
  );
  const [inspectionTime, setInspectionTime] = useState(() =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()),
  );
  const [search, setSearch] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [incidentType, setIncidentType] = useState<AlertType | "">("");
  const [observations, setObservations] = useState("");
  const [sectionComments, setSectionComments] = useState<Record<string, string>>({});
  const [foundLocations, setFoundLocations] = useState<Record<string, string>>({});
  const [responsibleUserIds, setResponsibleUserIds] = useState<string[]>([]);
  const [leaderUserId, setLeaderUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const availableRoster=roster.filter(p=>responsibleUserIds.includes(p.id)||eligible.data?.candidates.some(c=>c.userId===p.id));
  async function startControl(){setLoading(true);setError("");try{const response=await api.post("/inspections/drafts",{vehicleId});setDraft(response.data);setResponsibleUserIds(response.data.participants.map((p:{userId:string})=>p.userId));setLeaderUserId(user?.id||"");const date=new Date(response.data.startedAt);setInspectionDate(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires",year:"numeric",month:"2-digit",day:"2-digit"}).format(date));setInspectionTime(new Intl.DateTimeFormat("en-GB",{timeZone:"America/Argentina/Buenos_Aires",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(date));}catch(e){setError(getErrorMessage(e,"No se pudo iniciar el control"));}finally{setLoading(false);}}
  async function changeParticipants(ids:string[]){if(!draft)return;setLoading(true);setError("");try{const result=await api.put(`/inspections/drafts/${draft.id}/participants`,{revision:draft.revision,userIds:ids});setDraft(result.data);setResponsibleUserIds(result.data.participants.map((p:{userId:string})=>p.userId));if(!ids.includes(leaderUserId))setLeaderUserId(user?.id||"");}catch(e){setError(getErrorMessage(e,"No se pudo actualizar el equipo"));}finally{setLoading(false);}}

  const [results, setResults] = useState<Record<string, InspectionResult>>(
    Object.fromEntries(items.map((item) => [item.id, "UNCHECKED"])),
  );
  async function abandonControl(){if(!draft||!window.confirm("¿Descartar este borrador sin registrar el control? Se perderán las marcas locales."))return;setLoading(true);setError("");try{await api.post(`/inspections/drafts/${draft.id}/abandon`,{revision:draft.revision,reason:"Borrador descartado por su autor antes de finalizar"});setDraft(null);setResponsibleUserIds([]);setLeaderUserId("");setResults(Object.fromEntries(items.map(i=>[i.id,"UNCHECKED"])));setObservations("");setSectionComments({});setItemObservations({});setFoundLocations({});setObservedQuantities(Object.fromEntries(items.map(i=>[i.id,i.expectedQuantity])));clearInspectionDraft(draftKey);}catch(e){setError(getErrorMessage(e,"No se pudo descartar el borrador"));}finally{setLoading(false);}}
  const [itemObservations, setItemObservations] = useState<
    Record<string, string>
  >({});
  const [observedQuantities, setObservedQuantities] = useState<Record<string, number>>(
    Object.fromEntries(items.map((item) => [item.id, item.expectedQuantity])),
  );
  const checkedCount = items.filter((item) => (results[item.id] ?? "UNCHECKED") !== "UNCHECKED").length;
  const issueCount = items.filter((item) => results[item.id] === "MISSING" || results[item.id] === "DAMAGED").length;
  const visibleItems = items.filter((item) =>
    (!onlyPending || (results[item.id] ?? "UNCHECKED") === "UNCHECKED") &&
    `${item.name} ${item.compartmentName || ""}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()),
  );
  const draftSnapshot = useMemo(() => ({
    inventorySignature: inventorySignature(items), foundLocations,
    inspectionDate, inspectionTime, incidentType, observations, sectionComments,
    responsibleUserIds, leaderUserId, results, itemObservations, observedQuantities,
  }), [items, inspectionDate, inspectionTime, incidentType, observations, sectionComments, responsibleUserIds, leaderUserId, results, itemObservations, observedQuantities, foundLocations]);
  const hasChanges = checkedCount > 0 || observations.length > 0 || responsibleUserIds.length > 0 ||
    Object.values(itemObservations).some(Boolean) || Object.values(sectionComments).some(Boolean);

  function restoreDraft(draft: InspectionDraft) {
    const allowedIds = new Set(roster.map((person) => person.id));
    setInspectionDate(draft.inspectionDate);
    setInspectionTime(draft.inspectionTime);
    setIncidentType(draft.incidentType);
    setObservations(draft.observations);
    setSectionComments(draft.sectionComments || {});
    setFoundLocations(draft.foundLocations || {});
    setLeaderUserId(responsibleUserIds.includes(draft.leaderUserId) ? draft.leaderUserId : user?.id||"");
    setResults(draft.results);
    setItemObservations(draft.itemObservations);
    setObservedQuantities(draft.observedQuantities);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!items.length) {
      setError("El vehículo no tiene ítems de inventario para controlar.");
      setLoading(false);
      return;
    }
    if (!responsibleUserIds.length || !leaderUserId) {
      setError("Seleccioná quiénes realizaron el control y quién estuvo a cargo.");
      setLoading(false);
      return;
    }
    if (items.some((item) => (results[item.id] ?? "UNCHECKED") === "UNCHECKED")) {
      setError("Todos los materiales deben estar revisados antes de guardar el control.");
      setLoading(false);
      return;
    }
    const invalidItem = items.find((item) => {
      const result = results[item.id];
      const quantity = observedQuantities[item.id] ?? 0;
      return !Number.isInteger(quantity) || quantity < 0 ||
        (result === "OK" && quantity < item.expectedQuantity) ||
        (result === "MISSING" && quantity >= item.expectedQuantity) ||
        (result === "DAMAGED" && quantity === 0) ||
        (foundLocations[item.id] !== undefined && (foundLocations[item.id].trim().length < 3 || quantity === 0)) ||
        (result !== "OK" && !itemObservations[item.id]?.trim());
    });
    if (invalidItem) {
      setError(`${invalidItem.name}: revisa la cantidad, el estado y la novedad del material.`);
      setLoading(false);
      return;
    }

    try {
      if(!draft)throw new Error("Inicie el control antes de finalizarlo");
      await createInspection({
        draftId:draft.id,
        vehicleId,
        inspectionDate,
        inspectionTime,
        observations: observations.trim() ? observations.trim() : null,
        leaderUserId,
        responsibleUserIds,
        sectionComments: inventory.compartments.filter((section) => sectionComments[section.id]?.trim()).map((section) => ({ compartmentId: section.id, observations: sectionComments[section.id].trim() })),
        items: items.map((item) => ({
          inventoryItemId: item.id,
          foundElsewhere: foundLocations[item.id] !== undefined,
          foundLocation: foundLocations[item.id]?.trim() || null,
          result: results[item.id] as Exclude<InspectionResult, "UNCHECKED">,
          observedQuantity: observedQuantities[item.id] ?? 0,
          observations: itemObservations[item.id]?.trim() || null,
        })),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["vehicle-inspection-history", vehicleId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["vehicle-inventory", vehicleId],
        }),
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
        queryClient.invalidateQueries({ queryKey: ["asset", inventory.asset.id] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["operational-readiness"] }),
      ]);

      clearInspectionDraft(draftKey);
      router.push(`/equipment/${inventory.asset.id}/history`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo guardar el control"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!draft&&<button type="button" className="app-button w-auto" disabled={loading} onClick={startControl}>Iniciar o recuperar control</button>}
      {draft&&<button type="button" className="app-button app-button-outline w-auto" disabled={loading} onClick={abandonControl}>Descartar borrador</button>}
      {!draft&&error&&<p role="alert" className="text-red-300">{error}</p>}
      {draft&&<p className="text-sm text-[var(--mut)]">Control iniciado. Solo se agregan integrantes con QR abierto; la lista se actualiza cada 10 segundos. Finalizar bloquea el equipo.</p>}
      {eligible.isError&&<p role="alert" className="text-red-300">No se pudo actualizar el personal presente.</p>}
      <fieldset disabled={!draft||loading} className="space-y-5">
      {user && <InspectionDraftPanel key={draftKey} storageKey={draftKey} snapshot={draftSnapshot} hasChanges={hasChanges} onRestore={restoreDraft} />}
      <section className="rounded-3xl border border-white/10 bg-[#16171b] p-5">
        <h2 className="mb-5 text-lg font-black uppercase tracking-wide text-slate-300">
          Datos del control
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Fecha">
            <input
              type="date"
              required
              className="input-dark"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
            />
          </Field>

          <Field label="Hora">
            <input
              type="time"
              required
              className="input-dark"
              value={inspectionTime}
              onChange={(e) => setInspectionTime(e.target.value)}
            />
          </Field>

          <Field label="Observaciones generales">
            <input
              className="input-dark"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
            Personas que realizaron el control
          </div>
          <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {availableRoster.map((person) => {
              const selected = responsibleUserIds.includes(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={person.id===user?.id||loading}
                  onClick={() => void changeParticipants(selected?responsibleUserIds.filter(id=>id!==person.id):[...responsibleUserIds,person.id])}
                  className={`rounded-xl border p-3 text-left ${selected ? "border-red-500 bg-red-500/10" : "border-white/10 bg-black/20"}`}
                >
                  <div className="text-sm font-bold text-white">{person.profile?.fullName || person.username}</div>
                  <div className="text-xs text-slate-400">{person.profile?.rank || person.role}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <Field label="Encargado del control">
            <select
              className="input-dark"
              value={leaderUserId}
              onChange={(event) => setLeaderUserId(event.target.value)}
              disabled={!responsibleUserIds.length}
              required
            >
              <option value="">Seleccionar encargado</option>
              {roster.filter((person) => responsibleUserIds.includes(person.id)).map((person) => (
                <option key={person.id} value={person.id}>{person.profile?.fullName || person.username}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-black uppercase tracking-wide text-slate-300">
          Ítems a revisar
        </h2>

        <div className="sticky top-0 z-10 space-y-3 rounded-lg border border-white/10 bg-[#16171b] p-3">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="font-bold text-white">{checkedCount} / {items.length} revisados</span>
            <span className={issueCount ? "text-amber-300" : "text-emerald-300"}>
              {issueCount ? `${issueCount} materiales con novedades` : "Sin novedades detectadas"}
            </span>
          </div>
          <progress className="h-2 w-full accent-red-500" value={checkedCount} max={items.length || 1} aria-label="Progreso del control" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input type="search" className="input-dark min-w-0 flex-1" placeholder="Buscar material o baulera" aria-label="Buscar material o baulera" value={search} onChange={(event) => setSearch(event.target.value)} />
            <label className="flex shrink-0 items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={onlyPending} onChange={(event) => setOnlyPending(event.target.checked)} /> Solo pendientes
            </label>
          </div>
        </div>
        {visibleItems.length === 0 && <p className="text-sm text-slate-400">No hay materiales para este filtro.</p>}
        {inventory.compartments.map((section) => {
          const sectionItems = visibleItems.filter((item) => section.items.some((entry) => entry.id === item.id));
          if (!sectionItems.length && (search || onlyPending)) return null;
          return <section key={section.id} className="space-y-3 border-t border-white/15 pt-5" aria-label={section.name}>
          <h3 className="text-lg font-bold text-white">{section.name} <span className="text-sm font-normal text-slate-400">({section.items.length} materiales)</span></h3>
          {sectionItems.map((item) => (
          <InspectionItemRow
            key={item.id}
            item={item}
            value={results[item.id] ?? "UNCHECKED"}
            observations={itemObservations[item.id] ?? ""}
            observedQuantity={observedQuantities[item.id] ?? 0}
            foundLocation={foundLocations[item.id]}
            onFoundLocationChange={(location) => setFoundLocations((prev) => { const next = { ...prev }; if (location === undefined) delete next[item.id]; else next[item.id] = location; return next; })}
            onChange={(value) => {
              setResults((prev) => ({
                ...prev,
                [item.id]: value,
              }));
              if (value === "OK" || value === "DAMAGED") {
                setObservedQuantities((prev) => ({ ...prev, [item.id]: item.expectedQuantity }));
              } else if (value === "MISSING") {
                setObservedQuantities((prev) => ({ ...prev, [item.id]: 0 }));
              }
            }}
            onObservationChange={(value) =>
              setItemObservations((prev) => ({
                ...prev,
                [item.id]: value,
              }))
            }
            onObservedQuantityChange={(value) => {
              setObservedQuantities((prev) => ({ ...prev, [item.id]: value }));
              setResults((prev) => ({ ...prev, [item.id]: value < item.expectedQuantity ? "MISSING" : prev[item.id] === "DAMAGED" ? "DAMAGED" : "OK" }));
            }}
          />
          ))}
          <Field label={`Comentarios de ${section.name}`}><textarea className="input-dark min-h-20" maxLength={2000} value={sectionComments[section.id] || ""} onChange={(event) => setSectionComments((current) => ({ ...current, [section.id]: event.target.value }))} /></Field>
          </section>;
        })}
      </section>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Guardando..." : "Guardar control"}
      </button>
      </fieldset>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
