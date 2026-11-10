"use client";
import { isDutyManager } from "@/lib/permissions";
import {useFinanceAccess} from "./finance-panel";
import { isCommand } from "@/lib/permissions";
import { api } from "@/lib/api-client";
import { FormEvent, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Droplets, Fuel, Plus, RefreshCw } from "lucide-react";
import { ErrorNotice, Field, personName, StateBadge, stationDate } from "./operations-ui";
import { dateTime, localNow, money, OperationDialog, Pager, PeoplePicker } from "./work-ui";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/get-error-message";
import { decimalUnits } from "@/lib/operational-numbers";
import { csvCell } from "@/lib/report-csv";
import { getAssetsRequest } from "@/services/assets.service";
import { getUserRosterRequest } from "@/services/user.service";
import { fleetAction, fleetCreate, listFuel, listWater } from "@/services/work.service";
import { FuelRecord, WaterTrip } from "@/types/work";

const reasons: Record<string, string> = { EMERGENCY: "Emergencia", TRAINING: "Capacitacion", SERVICE: "Servicio", WATER: "Viaje de agua", OTHER: "Otro" };
type Action = { row: FuelRecord | WaterTrip; action: "void" | "payment"; userId?: string; reverse?: boolean };
export function FleetScreen({ kind }: { kind: "fuel" | "water" }) {
  const { user } = useAuth(), manager = isDutyManager(user?.role), client = useQueryClient(), fuel = kind === "fuel";
  const finance=useFinanceAccess();
  const [page, setPage] = useState(1), [month, setMonth] = useState(stationDate().slice(0, 7)), [assetFilter, setAssetFilter] = useState("");
  const [creating, setCreating] = useState(false), [action, setAction] = useState<Action | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [editing,setEditing]=useState<FuelRecord|WaterTrip|null>(null),[correctionReason,setCorrectionReason]=useState("");
  const [assetId, setAssetId] = useState(""), [occurredAt, setOccurredAt] = useState(""), [liters, setLiters] = useState(""), [cost, setCost] = useState(""), [odometer, setOdometer] = useState(""), [reason, setReason] = useState("SERVICE"), [notes, setNotes] = useState("");
  const [customer, setCustomer] = useState(""), [destination, setDestination] = useState(""), [returnedAt, setReturnedAt] = useState(""), [endOdometer, setEndOdometer] = useState(""), [tripCount, setTripCount] = useState("1"), [leader, setLeader] = useState(""), [ids, setIds] = useState<string[]>([]), [rates, setRates] = useState<Record<string, string>>({});
  const attempt = useRef<{ body: string; key: string } | null>(null);
  const params = { page, month, assetId: assetFilter };
  const fuels = useQuery({ queryKey: ["fuel", user?.id, params], queryFn: () => listFuel(params), enabled: Boolean(user && fuel && manager) });
  const waters = useQuery({ queryKey: ["water", user?.id, params], queryFn: () => listWater(params), enabled: Boolean(user && !fuel) });
  const assets = useQuery({ queryKey: ["fleet-assets", user?.id], queryFn: getAssetsRequest, enabled: Boolean(user) });
  const people = useQuery({ queryKey: ["work-roster", user?.id], queryFn: getUserRosterRequest, enabled: Boolean(user && manager && !fuel) });
  const vehicles = assets.data?.filter((a) => a.assetType === "VEHICLE" && a.vehicle) || [];
  const roster=[...(people.data||[]),...(editing&&!("volumeMilliliters" in editing)?editing.crew.filter(member=>!people.data?.some(person=>person.id===member.userId)).map(member=>member.user):[])];
  const current = fuel ? fuels : waters;
  function refresh() { client.invalidateQueries({ queryKey: [kind] }); client.invalidateQueries({queryKey:["operations","fuel-report"]}); }
  function openForm() {
    setEditing(null);setCorrectionReason("");
    setError(""); setAssetId(""); setOccurredAt(localNow()); setReturnedAt(localNow()); setLiters(""); setCost(""); setOdometer(""); setEndOdometer(""); setReason("SERVICE"); setNotes(""); setCustomer(""); setDestination(""); setLeader(""); setTripCount("1"); setIds([]); setRates({}); attempt.current = null; setCreating(true);
  }
  function correct(row:FuelRecord|WaterTrip){
    openForm();setEditing(row);setAssetId(row.assetId);setNotes(row.notes);
    const local=(value:string)=>{const d=new Date(value);return new Date(+d-d.getTimezoneOffset()*60000).toISOString().slice(0,19);};
    if("volumeMilliliters" in row){setOccurredAt(local(row.occurredAt));setLiters(String(row.volumeMilliliters/1000));setCost(row.costCents===null?"":String(row.costCents/100));setOdometer(row.odometer===null?"":String(row.odometer));setReason(row.reason);}
    else{setOccurredAt(local(row.departedAt));setReturnedAt(local(row.returnedAt));setCustomer(row.customer);setDestination(row.destination);setTripCount(String(row.tripCount));setCost(String((row.chargeCents||0)/100));setOdometer(String(row.startOdometer));setEndOdometer(String(row.endOdometer));setLeader(row.leader.id);setIds(row.crew.map(m=>m.userId));setRates(Object.fromEntries(row.crew.map(m=>[m.userId,String(m.compensationCents/100)])));}
  }
  function canCorrect(row:FuelRecord|WaterTrip){return !row.voidedAt&&("volumeMilliliters" in row||!row.clientPaidAt&&!row.crew.some(member=>member.paidAt));}
  function openAction(row: FuelRecord | WaterTrip, value: "void" | "payment", userId?: string, reverse = false) { setAction({ row, action: value, userId, reverse }); setNotes(""); setError(""); }
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (action) await fleetAction(kind, action.row.id, action.action, { notes, ...(fuel ? {} : { revision: (action.row as WaterTrip).revision }), ...(action.action === "payment" ? { kind: action.userId ? "CREW" : "CLIENT", reverse: action.reverse, ...(action.userId ? { userId: action.userId } : {}) } : {}) });
      else {
        const cents = cost ? decimalUnits(cost, 2) : null;
        if (cost && cents === null) throw new Error("Ingrese un importe valido, con hasta dos decimales y sin separador de miles.");
        const body = fuel ? { assetId, occurredAt: new Date(occurredAt).toISOString(), liters, costCents: cents, odometer: odometer ? Number(odometer) : null, reason, notes } : {
          assetId, customer, destination, departedAt: new Date(occurredAt).toISOString(), returnedAt: new Date(returnedAt).toISOString(), startOdometer: Number(odometer), endOdometer: Number(endOdometer), tripCount: Number(tripCount), chargeCents: cents ?? 0, leaderUserId: leader, notes,
          crew: ids.map((userId) => { const compensationCents = decimalUnits(rates[userId] || "0", 2); if (compensationCents === null) throw new Error("Revise los importes de la tripulacion."); return { userId, compensationCents }; }),
        };
        const serialized = JSON.stringify({body,source:editing?.id,correctionReason});
        if (attempt.current?.body !== serialized) attempt.current = { body: serialized, key: crypto.randomUUID() };
        const data={...body,operationKey:attempt.current!.key};
        if(editing)await api.post(`/fleet/${kind}/${editing.id}/correct`,{data,revision:editing.revision,reason:correctionReason});
        else await fleetCreate(kind,data);
      }
      setCreating(false); setAction(null); refresh();
    } catch (err) { setError(getErrorMessage(err, "No se pudo guardar. Revise los datos y actualice si hubo un conflicto.")); }
    finally { setBusy(false); }
  }
  function download() {
    const rows = fuel ? [
      ["Fecha", "Movil", "Litros", "Costo centavos", "Odometro", "Motivo", "Anulada"],
      ...(fuels.data?.items || []).map((r) => [dateTime(r.occurredAt), r.asset.name, r.volumeMilliliters / 1000, r.costCents ?? "", r.odometer ?? "", reasons[r.reason], r.voidedAt ? "Si" : "No"]),
    ] : [
      ["Salida", "Movil", "Cliente", "Destino", "Viajes", "Km", "Importe centavos", "Cobrado", "Anulado"],
      ...(waters.data?.items || []).map((r) => [dateTime(r.departedAt), r.asset.name, r.customer, r.destination, r.tripCount, r.endOdometer - r.startOdometer, r.chargeCents ?? "", r.clientPaidAt ? "Si" : "No", r.voidedAt ? "Si" : "No"]),
    ];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map((r) => r.map((c) => csvCell(c ?? "")).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = `${kind}-pagina-${page}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  if (fuel && user && !manager) return <main className="screen-body"><h1 className="text-2xl font-bold">Combustible</h1><p className="mt-4 text-[var(--mut)]">Los registros economicos de combustible requieren permisos de responsable.</p></main>;
  return <main className="screen-body">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold">{fuel ? <Fuel className="h-6 w-6 text-red-400" /> : <Droplets className="h-6 w-6 text-red-400" />}{fuel ? "Combustible" : "Viajes de agua"}</h1><p className="mt-1 text-sm text-[var(--mut)]">{fuel ? "Cargas, importes e historial por movil" : "Servicios, tripulacion y constancias de cobro y pago"}</p></div><div className="flex gap-2"><button className="btn-icon" title="Actualizar" aria-label="Actualizar registros" onClick={refresh}><RefreshCw className="h-4 w-4" /></button><button className="btn-icon" title="Exportar pagina CSV" aria-label="Exportar pagina CSV" disabled={!current.data?.items.length} onClick={download}><Download className="h-4 w-4" /></button>{manager && <button className="app-button app-button-red w-auto" onClick={openForm}><Plus className="h-4 w-4" /> Registrar</button>}</div></header>
    <div className="mb-4 grid gap-3 sm:grid-cols-2"><Field label="Mes"><input className="app-input" type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} /></Field><Field label="Movil"><select className="app-input" value={assetFilter} onChange={(e) => { setAssetFilter(e.target.value); setPage(1); }}><option value="">Todos los moviles</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field></div>
    {fuel && fuels.data && <section className="mb-5 grid grid-cols-3 gap-3 border-y border-[var(--bord)] py-4"><div><div className="text-xl font-bold">{((fuels.data.totals._sum.volumeMilliliters || 0) / 1000).toLocaleString("es-AR")}</div><div className="text-xs text-[var(--mut)]">Litros vigentes</div></div><div><div className="break-words text-lg font-bold">{money(fuels.data.totals._sum.costCents || 0)}</div><div className="text-xs text-[var(--mut)]">Costo informado</div></div><div><div className="text-xl font-bold">{fuels.data.totals._count}</div><div className="text-xs text-[var(--mut)]">Cargas vigentes</div></div></section>}
    {current.isLoading && <p role="status">Cargando registros...</p>}{current.isError && <ErrorNotice>No se pudieron cargar los registros. <button className="underline" onClick={refresh}>Reintentar</button></ErrorNotice>}
    {current.data && !current.data.items.length && <p className="py-10 text-center text-[var(--mut)]">No hay registros para estos filtros.</p>}
    <div className="grid gap-3 lg:grid-cols-2">{fuel ? fuels.data?.items.map((r) => <article key={r.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{r.asset.name}</h2><StateBadge tone={r.voidedAt ? "danger" : "good"}>{r.voidedAt ? "Anulada" : "Registrada"}</StateBadge></div><div className="mt-3 text-xl font-bold">{(r.volumeMilliliters / 1000).toLocaleString("es-AR")} L · {money(r.costCents)}</div><div className="mt-2 text-sm text-[var(--mut)]">{dateTime(r.occurredAt)} · {reasons[r.reason]}</div><div className="mt-1 text-sm text-[var(--mut)]">{r.odometer == null ? "Odometro no informado" : `${r.odometer.toLocaleString("es-AR")} km`} · {personName(r.createdBy)}</div>{r.notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{r.notes}</p>}{r.replacesId&&<p className="mt-2 break-all text-xs text-[var(--mut)]">Rectifica: {r.replacesId} · {r.correctionReason}</p>}{isCommand(user?.role)&&canCorrect(r)&&<button className="app-button mt-3 w-auto" onClick={()=>correct(r)}>Rectificar registro</button>}{r.voidReason && <p className="mt-2 break-words text-sm text-red-300">{r.voidReason}</p>}{!r.voidedAt && <button className="app-button mt-4 w-auto" onClick={() => openAction(r, "void")}>Anular con motivo</button>}</article>) : waters.data?.items.map((r) => <article key={r.id} className="min-w-0 rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{r.asset.name} · {r.tripCount} viajes</h2><StateBadge tone={r.voidedAt ? "danger" : "neutral"}>{r.voidedAt ? "Anulado" : "Registrado"}</StateBadge></div>{manager && <><h3 className="mt-3 break-words font-semibold">{r.customer}</h3><p className="mt-1 break-words text-sm text-[var(--mut)]">{r.destination}</p></>}<p className="mt-3 text-sm">{dateTime(r.departedAt)} → {dateTime(r.returnedAt)}</p><p className="mt-1 text-sm text-[var(--mut)]">{r.endOdometer - r.startOdometer} km · A cargo: {personName(r.leader)}</p>{manager && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span>{money(r.chargeCents)} · {r.clientPaidAt ? "Cobrado" : r.chargeCents === 0 ? "Sin cargo" : "Por cobrar"}</span>{finance.data?.canManage && !r.voidedAt && !r.clientPaidAt && Boolean(r.chargeCents) && <button className="app-button w-auto" onClick={() => openAction(r, "payment")}>Registrar cobro</button>}</div>}<ul className="mt-3 space-y-2 border-t border-[var(--bord)] pt-3">{r.crew.map((m) => <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{personName(m.user)} · {money(m.compensationCents)} · {m.paidAt ? "Pagado" : m.compensationCents === 0 ? "Sin importe" : r.earningsApprovedAt ? "Deuda aprobada" : "Por verificar"}</span>{finance.data?.canManage && r.earningsApprovedAt && m.userId!==user?.id && !r.voidedAt && !m.paidAt && m.compensationCents > 0 && <button className="app-button w-auto" onClick={() => openAction(r, "payment", m.userId)}>Registrar pago</button>}</li>)}</ul>{r.notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{r.notes}</p>}{r.replacesId&&<p className="mt-2 break-all text-xs text-[var(--mut)]">Rectifica: {r.replacesId} · {r.correctionReason}</p>}{isCommand(user?.role)&&canCorrect(r)&&<button className="app-button mt-3 w-auto" onClick={()=>correct(r)}>Rectificar registro</button>}{r.voidReason && <p className="mt-2 break-words text-sm text-red-300">{r.voidReason}</p>}{manager && !r.voidedAt && !r.clientPaidAt && !r.crew.some((m) => m.paidAt) && <button className="app-button mt-4 w-auto" onClick={() => openAction(r, "void")}>Anular con motivo</button>}</article>)}</div>
    {!fuel && finance.data?.canManage && waters.data?.items.some((r) => !r.voidedAt && (r.clientPaidAt || r.crew.some((m) => m.paidAt))) && <section className="mt-5 border-t border-[var(--bord)] pt-4"><h2 className="mb-3 text-sm font-bold">Correccion de constancias</h2>{waters.data.items.filter((r) => !r.voidedAt).map((r) => <div key={r.id} className="mb-2 flex flex-wrap items-center gap-2 text-sm">{(r.clientPaidAt || r.crew.some((m) => m.paidAt)) && <span>{r.customer} · {dateTime(r.departedAt)}</span>}{r.clientPaidAt && <button className="app-button w-auto" onClick={() => openAction(r, "payment", undefined, true)}>Revertir constancia de cobro</button>}{r.crew.filter((m) => m.paidAt && m.userId!==user?.id).map((m) => <button key={m.userId} className="app-button w-auto" onClick={() => openAction(r, "payment", m.userId, true)}>Revertir constancia: {personName(m.user)}</button>)}</div>)}</section>}
    {current.data && <Pager page={page} total={current.data.total} onPage={setPage} />}
    {(creating || action) && <OperationDialog title={action ? action.action === "void" ? "Anular registro" : "Registrar constancia de pago" : editing ? "Rectificar registro conservando el original" : fuel ? "Registrar combustible" : "Registrar viaje de agua finalizado"} pending={busy} onClose={() => { setCreating(false); setAction(null); }}><form onSubmit={submit}><fieldset disabled={busy} className="space-y-3">
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {editing&&!action&&<Field label="Motivo de rectificación"><textarea required minLength={10} maxLength={1000} className="app-input" value={correctionReason} onChange={e=>setCorrectionReason(e.target.value)}/><p className="mt-1 text-xs text-[var(--mut)]">El original se conservará anulado y vinculado al reemplazo. No se modifica ningún pago.</p></Field>}
      {action?.reverse && <p className="text-sm text-amber-200">Se corregira la constancia, conservando la auditoria. Esto no devuelve ni mueve dinero.</p>}
      {action ? <Field label={action.action === "void" ? "Motivo de anulacion" : "Referencia del cobro o pago ya realizado"}><textarea autoFocus className="app-input min-h-24" required minLength={action.action === "void" ? 10 : 5} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field> : <>
        {(assets.isError || !fuel && people.isError) && <ErrorNotice>No se pudieron cargar moviles o personal.</ErrorNotice>}
        <Field label="Movil"><select className="app-input" required value={assetId} onChange={(e) => setAssetId(e.target.value)}><option value="">Seleccionar movil</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}{editing&&!vehicles.some(v=>v.id===editing.assetId)&&<option value={editing.assetId}>{editing.asset.name} (registro original)</option>}</select></Field>
        {!fuel && <><Field label="Cliente"><input className="app-input" required minLength={3} maxLength={160} value={customer} onChange={(e) => setCustomer(e.target.value)} /></Field><Field label="Destino"><input className="app-input" required minLength={3} maxLength={200} value={destination} onChange={(e) => setDestination(e.target.value)} /></Field></>}
        <div className="grid gap-3 sm:grid-cols-2"><Field label={fuel ? "Fecha y hora de carga" : "Salida"}><input className="app-input" required type="datetime-local" step="1" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} /></Field>{!fuel && <Field label="Regreso"><input className="app-input" required type="datetime-local" step="1" value={returnedAt} onChange={(e) => setReturnedAt(e.target.value)} /></Field>}</div>
        <div className="grid gap-3 sm:grid-cols-2"><Field label={fuel ? "Odometro (opcional)" : "Km de salida"}><input className="app-input" type="number" min="0" max="10000000" step="1" required={!fuel} value={odometer} onChange={(e) => setOdometer(e.target.value)} /></Field>{!fuel && <Field label="Km de regreso"><input className="app-input" required type="number" min="0" max="10000000" step="1" value={endOdometer} onChange={(e) => setEndOdometer(e.target.value)} /></Field>}</div>
        {fuel ? <><Field label="Litros (hasta 3 decimales, sin miles)"><input className="app-input" required inputMode="decimal" maxLength={20} value={liters} onChange={(e) => setLiters(e.target.value)} />{liters && <span className="mt-1 block text-xs text-[var(--mut)]">{decimalUnits(liters, 3) == null ? "Formato invalido" : `${decimalUnits(liters, 3)! / 1000} litros`}</span>}</Field><Field label="Motivo"><select className="app-input" value={reason} onChange={(e) => setReason(e.target.value)}>{Object.entries(reasons).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field></> : <Field label="Cantidad de viajes"><input className="app-input" required type="number" min="1" max="100" step="1" value={tripCount} onChange={(e) => setTripCount(e.target.value)} /></Field>}
        <Field label={fuel ? "Costo total ARS (opcional)" : "Importe a cobrar al cliente ARS"}><input className="app-input" inputMode="decimal" required={!fuel} value={cost} maxLength={15} onChange={(e) => setCost(e.target.value)} /></Field>
        {!fuel && <><PeoplePicker people={roster} value={ids} onChange={setIds} /><Field label="Encargado"><select className="app-input" required value={leader} onChange={(e) => setLeader(e.target.value)}><option value="">Seleccionar integrante</option>{roster.filter((p) => ids.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}</select></Field>{roster.filter((p) => ids.includes(p.id)).map((p) => <Field key={p.id} label={`Importe ARS para ${personName(p)}`}><input className="app-input" inputMode="decimal" required value={rates[p.id] || "0"} onChange={(e) => setRates({ ...rates, [p.id]: e.target.value })} /></Field>)}</>}
        <Field label="Observaciones"><textarea className="app-input" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </>}
      <button className="app-button app-button-red" type="submit" disabled={busy || creating && (assets.isError || assets.isLoading || !fuel && (people.isError || people.isLoading || !ids.length))}>{busy ? "Guardando..." : "Confirmar registro"}</button>
    </fieldset></form></OperationDialog>}
  </main>;
}
