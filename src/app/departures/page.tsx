"use client";
import { isDutyManager } from "@/lib/permissions";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Truck } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field, personName } from "@/components/operations/operations-ui";
import { dateTime, localNow, OperationDialog, Pager, PeoplePicker } from "@/components/operations/work-ui";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { getAssetsRequest } from "@/services/assets.service";
import { getUserRosterRequest } from "@/services/user.service";
import { Page } from "@/types/work";
import { UserRosterItem } from "@/types/user";
type Departure = { id: string; assetId: string; departedAt: string; returnedAt: string; purpose: string; notes: string; revision: number; voidedAt: string | null; voidReason: string | null; asset: { name: string }; crew: Array<{ userId: string; user: UserRosterItem; isLeader: boolean }> };
export default function DeparturesPage() {
  const { user } = useAuth(), client = useQueryClient(), manager = isDutyManager(user?.role);
  const [page, setPage] = useState(1), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [assetId, setAsset] = useState(""), [start, setStart] = useState(""), [end, setEnd] = useState(""), [purpose, setPurpose] = useState(""), [notes, setNotes] = useState(""), [ids, setIds] = useState<string[]>([]), [leader, setLeader] = useState(""), [key, setKey] = useState("");
  const list = useQuery({ queryKey: ["departures", user?.id, page], queryFn: async () => (await api.get<Page<Departure>>("/fleet/departures", { params: { page } })).data, enabled: Boolean(user) });
  const assets = useQuery({ queryKey: ["assets"], queryFn: getAssetsRequest, enabled: manager });
  const people = useQuery({ queryKey: ["work-roster", user?.id], queryFn: getUserRosterRequest, enabled: manager });
  async function refresh() { await client.invalidateQueries({ queryKey: ["departures"] }); await client.invalidateQueries({ queryKey: ["personal-statistics"] }); }
  function begin() { setStart(localNow()); setEnd(localNow()); setAsset(""); setPurpose(""); setNotes(""); setIds([]); setLeader(""); setKey(crypto.randomUUID()); setError(""); setOpen(true); }
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await api.post("/fleet/departures", { operationKey: key, assetId, departedAt: new Date(start).toISOString(), returnedAt: new Date(end).toISOString(), purpose, notes, userIds: ids, leaderUserId: leader }); setOpen(false); await refresh(); }
    catch (err) { setError(getErrorMessage(err, "No se pudo registrar el acta. Se conserva la operacion para reintentar.")); }
    finally { setBusy(false); }
  }
  async function cancel(row: Departure) { const reason = window.prompt("Motivo de anulacion (minimo 10 caracteres)"); if (!reason) return; setBusy(true); setError(""); try { await api.post(`/fleet/departures/${row.id}/void`, { revision: row.revision, notes: reason }); await refresh(); } catch (err) { setError(getErrorMessage(err, "No se pudo anular")); } finally { setBusy(false); } }
  return <ProtectedLayout><section className="screen-body"><header className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="flex items-center gap-2 text-2xl font-bold"><Truck /> Actas de salida</h1>{manager && <button className="app-button w-auto" onClick={begin}><Plus size={16} /> Registrar salida finalizada</button>}</header>{error && !open && <ErrorNotice>{error}</ErrorNotice>}{list.isLoading && <p>Cargando actas...</p>}{list.isError && <ErrorNotice>No se pudieron cargar las actas.</ErrorNotice>}{list.data?.items.length === 0 && <p>Sin salidas registradas.</p>}<div className="grid gap-3 lg:grid-cols-2">{list.data?.items.map((row) => <article className="min-w-0 rounded-lg border border-[var(--bord)] p-4" key={row.id}><h2 className="break-words font-bold">{row.asset.name} · {row.purpose}</h2><p className="mt-2 text-sm text-[var(--mut)]">{dateTime(row.departedAt)} al {dateTime(row.returnedAt)}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{row.notes}</p><ul className="mt-3 space-y-1 text-sm">{row.crew.map((m) => <li key={m.userId}>{personName(m.user)}{m.isLeader ? " (a cargo)" : ""}</li>)}</ul>{row.voidedAt ? <p className="mt-3 break-words text-sm text-red-200">Anulada: {row.voidReason}</p> : <div className="mt-3 flex flex-wrap gap-2"><Link className="app-button w-auto" href={`/equipment/${row.assetId}/inspection/new`}>Revisar y reponer</Link>{manager && <button className="app-button w-auto" disabled={busy} onClick={() => cancel(row)}>Anular con motivo</button>}</div>}</article>)}</div>{list.data && <Pager page={page} total={list.data.total} onPage={setPage} />}
    {open && <OperationDialog title="Registrar salida finalizada" pending={busy} onClose={() => setOpen(false)}><form onSubmit={submit}><fieldset disabled={busy} className="space-y-3">{error && <ErrorNotice>{error}</ErrorNotice>}{(people.isError || assets.isError) && <ErrorNotice>No se pudo cargar personal o moviles.</ErrorNotice>}<Field label="Movil"><select required className="app-input" value={assetId} onChange={(e) => setAsset(e.target.value)}><option value="">Seleccionar</option>{assets.data?.filter((a) => a.assetType === "VEHICLE" && a.vehicle).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Salida"><input type="datetime-local" step="1" required className="app-input" value={start} onChange={(e) => setStart(e.target.value)} /></Field><Field label="Regreso"><input type="datetime-local" step="1" required className="app-input" value={end} onChange={(e) => setEnd(e.target.value)} /></Field></div><Field label="Motivo / referencia de intervencion"><input required minLength={5} maxLength={200} className="app-input" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field><PeoplePicker people={people.data || []} value={ids} onChange={(next) => { setIds(next); if (!next.includes(leader)) setLeader(""); }} /><Field label="A cargo"><select required className="app-input" value={leader} onChange={(e) => setLeader(e.target.value)}><option value="">Seleccionar</option>{people.data?.filter((p) => ids.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}</select></Field><Field label="Constancia y novedades"><textarea required minLength={10} maxLength={2000} className="app-input" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field><button disabled={busy || !ids.length || !leader || people.isError || assets.isError} className="app-button app-button-red">Registrar y acreditar horas</button></fieldset></form></OperationDialog>}
  </section></ProtectedLayout>;
}
