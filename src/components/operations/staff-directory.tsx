"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone, Search } from "lucide-react";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { api } from "@/lib/api-client";

type Person = { id: string; fullName: string; rank: string; badge: string; avatarUrl: string | null; phone: string | null; altPhone: string | null; group: string };
const tel = (v: string) => v.replace(/[^+\d]/g, "");
// WhatsApp necesita el numero internacional: si viene local, se asume Argentina (+54 9).
const whatsapp = (v: string) => { const d = tel(v).replace(/^\+/, ""); return d.startsWith("54") ? d : `549${d.replace(/^0/, "").replace(/^15/, "")}`; };

// Guia del personal: bomberos, Comision Directiva, etc. con su telefono, en orden institucional
// (cargo, antiguedad y cursos), para poder llamar si hace falta.
export function StaffDirectory() {
  const query = useQuery({ queryKey: ["staff-directory"], queryFn: async () => (await api.get<Person[]>("/contacts/staff")).data, staleTime: 60_000 });
  const [search, setSearch] = useState(""), [group, setGroup] = useState("");
  const term = search.trim().toLocaleLowerCase();
  const rows = (query.data ?? []).filter((p) => (!group || p.group === group) && (!term || [p.fullName, p.rank, p.badge, p.phone, p.altPhone].some((v) => v?.toLocaleLowerCase().includes(term))));
  const groups = [...new Set((query.data ?? []).map((p) => p.group))];
  return <section aria-label="Personal">
    <div className="mb-4 grid items-center gap-3 sm:grid-cols-[1fr_200px]">
      <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-[var(--mut)]" aria-hidden /><input aria-label="Buscar personal" className="app-input pl-9" type="search" placeholder="Buscar por nombre, cargo o teléfono" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      <select aria-label="Filtrar por grupo" className="app-input" value={group} onChange={(e) => setGroup(e.target.value)}><option value="">Todo el personal</option>{groups.map((g) => <option key={g} value={g}>{g}</option>)}</select>
    </div>
    {query.isLoading && <ListSkeleton label="Cargando personal" />}
    {query.isError && <p role="alert" className="py-4 text-red-300">No se pudo cargar el personal. <button type="button" className="underline" onClick={() => query.refetch()}>Reintentar</button></p>}
    {query.data && rows.length === 0 && <p className="py-8 text-center text-sm text-[var(--mut)]">No hay personas para esta búsqueda.</p>}
    <ul className="divide-y divide-[var(--bord)] rounded-lg border border-[var(--bord)] bg-[var(--card)]">
      {rows.map((p) => <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="break-words font-bold">{p.fullName}</p>
          <p className="text-xs text-[var(--mut)]">{p.rank} · Legajo {p.badge}</p>
          {p.altPhone && <a className="text-xs text-[var(--mut)] underline" href={`tel:${tel(p.altPhone)}`}>Alternativo: {p.altPhone}</a>}
        </div>
        {p.phone ? <div className="flex shrink-0 gap-2">
          <a className="app-button app-button-green w-auto min-h-11 px-3" href={`tel:${tel(p.phone)}`} aria-label={`Llamar a ${p.fullName}`}><Phone className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">{p.phone}</span><span className="sm:hidden">Llamar</span></a>
          <a className="btn-icon h-11 w-11" href={`https://wa.me/${whatsapp(p.phone)}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp a ${p.fullName}`} title="WhatsApp"><MessageCircle className="h-4 w-4" aria-hidden /></a>
        </div> : <span className="text-xs text-[var(--mut)]">Sin teléfono cargado</span>}
      </li>)}
    </ul>
    <p className="mt-3 text-xs text-[var(--mut)]">Cada persona carga su teléfono en Mi perfil. Ordenado por cargo, antigüedad y cursos.</p>
  </section>;
}
