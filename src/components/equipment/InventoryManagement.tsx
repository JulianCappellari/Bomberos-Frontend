"use client";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { VehicleInventoryItem, VehicleInventoryResponse } from "@/types/equipment";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { OperationDialog } from "@/components/operations/work-ui";

type Template = { name: string; compartments: Array<{ name: string; items: string[] }> };
export function InventoryManagement({ inventory }: { inventory: VehicleInventoryResponse }) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [name, setName] = useState("");
  const [edit, setEdit] = useState<{ id: string; revision: number; name: string } | null>(null);
  const [metadata, setMetadata] = useState<VehicleInventoryItem | null>(null), [code, setCode] = useState(""), [expiry, setExpiry] = useState("");
  const [template, setTemplate] = useState(""), [confirm, setConfirm] = useState(false);
  const templates = useQuery({ queryKey: ["inventory-templates"], queryFn: async () => (await api.get<Record<string, Template>>("/equipment/templates")).data });
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); setEdit(null); setMetadata(null); setTemplate(""); setName(""); setConfirm(false); await client.invalidateQueries({ queryKey: ["vehicle-inventory", inventory.id] }); await client.invalidateQueries({ queryKey: ["assets"] }); await client.invalidateQueries({ queryKey: ["asset", inventory.asset.id] }); }
    catch (err) { setError(getErrorMessage(err, "No se pudo guardar. Recargue si el inventario cambio.")); }
    finally { setBusy(false); }
  }
  function move(index: number, offset: number) {
    const rows = [...inventory.compartments]; [rows[index], rows[index + offset]] = [rows[index + offset], rows[index]];
    void run(() => api.put(`/equipment/vehicles/${inventory.id}/compartments/order`, { compartments: rows.map(({ id, revision }) => ({ id, revision })) }));
  }
  function submit(e: FormEvent) { e.preventDefault(); void run(() => edit ? api.patch(`/equipment/compartments/${edit.id}`, { name, revision: edit.revision }) : api.post(`/equipment/vehicles/${inventory.id}/compartments`, { name })); }
  const selected = templates.data?.[template];
  return <section className="space-y-4 border-y border-[var(--bord)] py-5"><h2 className="text-lg font-bold">Bauleras e identificacion</h2>
    {error && <ErrorNotice>{error}</ErrorNotice>}
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2"><div className="min-w-0 flex-1"><Field label={edit ? "Nuevo nombre" : "Nueva baulera"}><input required maxLength={120} className="app-input" value={name} onChange={(e) => setName(e.target.value)} /></Field></div><button disabled={busy} className="app-button w-auto">{edit ? "Guardar nombre" : "Agregar"}</button>{edit && <button type="button" className="app-button w-auto" onClick={() => { setEdit(null); setName(""); }}>Cancelar</button>}</form>
    <div className="flex flex-wrap gap-2">{["Cabina", "Baulera 1", "Baulera 2", "Baulera 3", "Techo", "Caja de agua"].filter((v) => !inventory.compartments.some((c) => c.name.toLowerCase() === v.toLowerCase())).map((v) => <button key={v} type="button" disabled={busy} className="rounded border border-[var(--bord)] px-3 py-2 text-xs" onClick={() => setName(v)}>+ {v}</button>)}</div>
    <ol className="divide-y divide-[var(--bord)]">{inventory.compartments.map((c, i) => <li key={c.id} className="flex items-center gap-2 py-2"><span className="min-w-0 flex-1 break-words text-sm">{c.name} <span className="text-[var(--mut)]">({c.items.length})</span></span><button className="btn-icon" title="Subir" aria-label={`Subir ${c.name}`} disabled={busy || i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button><button className="btn-icon" title="Bajar" aria-label={`Bajar ${c.name}`} disabled={busy || i === inventory.compartments.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button><button className="btn-icon" title="Renombrar" aria-label={`Renombrar ${c.name}`} disabled={busy} onClick={() => { setEdit(c); setName(c.name); }}><Pencil size={16} /></button><button className="btn-icon" title={c.items.length ? "Debe vaciar la baulera" : "Eliminar baulera vacia"} aria-label={`Eliminar ${c.name}`} disabled={busy || c.items.length > 0} onClick={() => { if (window.confirm(`Eliminar la baulera vacia ${c.name}?`)) void run(() => api.delete(`/equipment/compartments/${c.id}`, { data: { revision: c.revision } })); }}><Trash2 size={16} /></button></li>)}</ol>
    {!inventory.compartments.length && <div className="space-y-3"><Field label="Plantilla inicial"><select className="app-input" value={template} onChange={(e) => { setTemplate(e.target.value); setConfirm(false); }}><option value="">Seleccionar plantilla</option>{Object.entries(templates.data || {}).map(([id, t]) => <option value={id} key={id}>{t.name}</option>)}</select></Field>{templates.isError && <ErrorNotice>No se pudieron cargar las plantillas.</ErrorNotice>}{selected && <><ul className="space-y-1 text-sm">{selected.compartments.map((c) => <li key={c.name}><strong>{c.name}:</strong> {c.items.join(", ")}</li>)}</ul><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /> Revisare materiales y cantidades. El movil quedara pendiente de control fisico.</label><button className="app-button w-auto" disabled={busy || !confirm} onClick={() => void run(() => api.post(`/equipment/vehicles/${inventory.id}/template`, { template, confirm: true }))}>Aplicar plantilla</button></>}</div>}
    <details><summary className="cursor-pointer py-2 text-sm font-bold">Etiquetas y vencimientos</summary><ul className="divide-y divide-[var(--bord)]">{inventory.compartments.flatMap((c) => c.items.map((item) => <li className="flex flex-wrap items-center gap-2 py-3 text-sm" key={item.id}><span className="min-w-0 flex-1 break-words">{item.name} · {c.name}<span className="block text-xs text-[var(--mut)]">{item.labelCode || "Sin etiqueta"} · {item.expiresOn ? `Vence ${item.expiresOn.slice(0, 10)}` : "Sin vencimiento informado"}</span></span><button className="app-button w-auto" disabled={busy} onClick={() => { setMetadata(item); setCode(item.labelCode || ""); setExpiry(item.expiresOn?.slice(0, 10) || ""); }}>Editar</button></li>))}</ul></details>
    {metadata && <OperationDialog title={`Identificacion: ${metadata.name}`} pending={busy} onClose={() => setMetadata(null)}><form onSubmit={(e) => { e.preventDefault(); void run(() => api.patch(`/equipment/items/${metadata.id}`, { revision: metadata.revision, labelCode: code.trim().toUpperCase() || null, expiresOn: expiry || null })); }} className="space-y-3">{error && <ErrorNotice>{error}</ErrorNotice>}<Field label="Etiqueta unica"><input className="app-input" maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,39}" value={code} onChange={(e) => setCode(e.target.value)} /></Field><Field label="Vencimiento"><input className="app-input" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></Field><button disabled={busy} className="app-button app-button-red">Guardar</button></form></OperationDialog>}
  </section>;
}
