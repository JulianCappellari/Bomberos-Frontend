"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { UserRosterItem } from "@/types/user";
import { personName } from "./operations-ui";

export function OperationDialog({ title, children, onClose, pending = false }: { title: string; children: ReactNode; onClose: () => void; pending?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} aria-label={title} onCancel={(e) => { e.preventDefault(); if (!pending) onClose(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_24px)] max-w-2xl overflow-y-auto rounded-lg border border-[var(--bord)] bg-[var(--card)] p-4 text-[var(--txt)] backdrop:bg-black/70">
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><button type="button" title="Cerrar" aria-label="Cerrar" className="btn-icon" disabled={pending} onClick={onClose}><X className="h-4 w-4" /></button></div>{children}
  </dialog>;
}
export function PeoplePicker({ people, value, onChange }: { people: UserRosterItem[]; value: string[]; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState("");
  return <fieldset className="min-w-0"><legend className="app-label">Integrantes ({value.length})</legend><input className="app-input mb-2" type="search" placeholder="Buscar integrante" aria-label="Buscar integrante" value={search} onChange={(e) => setSearch(e.target.value)} />
    <div className="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">{people.filter((p) => personName(p).toLowerCase().includes(search.toLowerCase())).map((p) => <label key={p.id} className="flex min-w-0 items-center gap-2 py-2 text-sm"><input type="checkbox" checked={value.includes(p.id)} onChange={(e) => onChange(e.target.checked ? [...value, p.id] : value.filter((id) => id !== p.id))} /><span className="break-words">{personName(p)}</span></label>)}</div>
  </fieldset>;
}
export function Pager({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  return <div className="mt-4 flex items-center justify-between gap-2 text-sm"><span>{total} registros · pagina {page}</span><div className="flex gap-2"><button type="button" title="Pagina anterior" aria-label="Pagina anterior" className="btn-icon" disabled={page === 1} onClick={() => onPage(page - 1)}><ChevronLeft className="h-4 w-4" /></button><button type="button" title="Pagina siguiente" aria-label="Pagina siguiente" className="btn-icon" disabled={page * 30 >= total} onClick={() => onPage(page + 1)}><ChevronRight className="h-4 w-4" /></button></div></div>;
}
export function localNow() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19); }
export function dateTime(value: string) { return new Date(value).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }); }
export function money(cents: number | null) { return cents == null ? "Sin importe" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(cents / 100); }
