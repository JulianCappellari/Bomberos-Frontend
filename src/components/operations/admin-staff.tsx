"use client";
import { FormEvent, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/get-error-message";
import { AdminLocation, StaffView } from "@/lib/admin-navigation";
import { ErrorNotice, Field } from "./operations-ui";
import { AdminProfileEditor } from "./admin-profile-editor";
import { PersonalStatistics } from "./personal-statistics";
import { SpecialPermissions } from "./special-permissions";
import { GuardEligibility } from "./guard-eligibility";

export type AdminStaff = { id: string; username: string; updatedAt: string; isActive: boolean; isPendingApproval: boolean; profile: { fullName: string; rank: string } | null };
type Garment = { id: string; title: string; details: string; clothingBrand: string | null; clothingModel: string | null; clothingSize: string | null; clothingCondition: string | null; clothingNovelties: string | null };
const ranks = ["Bombero", "Oficial", "Sub oficial", "Comision directiva", "Aspirante mayor", "Aspirante menor", "Administrador", "Guardia"];
const role = (rank: string) => ["Oficial", "Administrador"].includes(rank) ? "ADMIN" : rank === "Sub oficial" ? "OPERATOR" : rank === "Guardia" ? "GUARD" : "FIREFIGHTER";
const label = (person: AdminStaff) => person.isPendingApproval ? "Pendiente" : person.isActive ? "Activa" : "Pausada";
const views: Array<[StaffView, string]> = [["profile", "Datos personales"], ["permissions", "Cargo y permisos"], ["statistics", "Actividad"], ["clothing", "Prendas"], ["security", "Seguridad"]];

export function AdminStaffPanel({ people, loading, location, navigate, creating, setCreating, status, setStatus }: {
  people: AdminStaff[]; loading: boolean; location: AdminLocation; navigate: (next: Partial<AdminLocation>) => void;
  creating: boolean; setCreating: (value: boolean) => void; status: string; setStatus: (value: string) => void;
}) {
  const { user } = useAuth(), client = useQueryClient(), detail = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState(""), [rankFilter, setRankFilter] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const person = people.find(p => p.id === location.person);
  const filtered = people.filter(p => `${p.username} ${p.profile?.fullName || ""}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (!rankFilter || p.profile?.rank === rankFilter) && (status === "all" || status === "pending" && p.isPendingApproval || status === "active" && p.isActive && !p.isPendingApproval || status === "paused" && !p.isActive && !p.isPendingApproval));
  const declarations = useQuery({ queryKey: ["admin-declarations", user?.id, location.person], queryFn: async () => (await api.get<Garment[]>("/members/declarations", { params: { userId: location.person, category: "CLOTHING" } })).data, enabled: Boolean(person) && location.view === "clothing" });
  async function save(event: FormEvent<HTMLFormElement>, account?: AdminStaff) {
    event.preventDefault(); const form = new FormData(event.currentTarget), get = (key: string) => String(form.get(key) || ""), rank = get("rank");
    if (!window.confirm(account ? "Guardar cargo y estado? Esto puede modificar permisos y sesiones." : "Crear esta cuenta de personal?")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (account) await api.patch(`/users/${account.id}`, { rank, role: role(rank), isActive: get("active") === "yes", revision: account.updatedAt });
      else {
        const created = (await api.post<AdminStaff>("/users", { username: get("username"), password: get("password"), fullName: get("fullName"), dni: get("dni"), badge: get("badge"), rank, role: role(rank) })).data;
        setSearch(""); setRankFilter(""); setStatus("all"); navigate({ person: created.id, view: "profile" });
      }
      setCreating(false); setNotice(account ? "Cargo y estado actualizados" : "Cuenta creada correctamente");
      await Promise.all([client.invalidateQueries({ queryKey: ["admin-staff"] }), client.invalidateQueries({ queryKey: ["admin-profile-editor"] })]);
    } catch (err) { setError(getErrorMessage(err, "No se pudo guardar el personal")); } finally { setBusy(false); }
  }
  function select(next: Partial<AdminLocation>) { setError(""); setNotice(""); navigate(next); }
  return <>
    {error && <ErrorNotice>{error}</ErrorNotice>}{notice && <p role="status" className="mb-4 border-l-2 border-emerald-500 pl-3 text-sm">{notice}</p>}
    {creating && <section className="mb-6 border-b border-[var(--bord)] pb-5"><div className="mb-4 flex justify-between gap-3"><h2 className="text-lg font-bold">Nueva cuenta</h2><button className="text-sm underline" disabled={busy} onClick={() => setCreating(false)}>Cancelar alta</button></div><form onSubmit={e => save(e)}><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">{[["username", "Usuario", 50], ["fullName", "Nombre completo", 120], ["dni", "DNI", 20], ["badge", "Legajo", 30]].map(([name, text, max]) => <Field key={String(name)} label={String(text)}><input name={String(name)} required minLength={name === "dni" ? 6 : name === "badge" ? 1 : 3} maxLength={Number(max)} className="app-input" /></Field>)}<Field label="Cargo"><select name="rank" className="app-input">{ranks.map(rank => <option key={rank}>{rank}</option>)}</select></Field><Field label="Clave inicial (minimo 12 caracteres)"><input name="password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" className="app-input" /></Field><button className="app-button app-button-red w-auto">Crear cuenta</button></fieldset></form></section>}
    {person && <button className="app-button mb-4 w-auto lg:hidden" onClick={() => setPickerOpen(!pickerOpen)}>{pickerOpen ? "Cerrar listado" : "Cambiar persona"}</button>}
    <div className={person && !pickerOpen ? "hidden lg:block" : ""}><div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_180px]"><Field label="Buscar personal"><input className="app-input" type="search" placeholder="Nombre o usuario" value={search} onChange={e => setSearch(e.target.value)} /></Field><Field label="Estado"><select className="app-input" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todos</option><option value="active">Activas</option><option value="paused">Pausadas</option><option value="pending">Pendientes</option></select></Field><Field label="Cargo"><select className="app-input" value={rankFilter} onChange={e => setRankFilter(e.target.value)}><option value="">Todos los cargos</option>{[...new Set(people.map(p => p.profile?.rank).filter(Boolean))].sort().map(rank => <option key={rank!}>{rank}</option>)}</select></Field></div>
    <p className="mb-3 text-xs text-[var(--mut)]">{loading ? "Cargando personal..." : `${filtered.length} de ${people.length} cuentas`}</p></div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(220px,0.38fr)_minmax(0,1fr)]"><section aria-label="Listado de personal" className={`${person && !pickerOpen ? "hidden lg:block" : ""} max-h-[52vh] overflow-y-auto border-y border-[var(--bord)] lg:max-h-[75vh]`}>{filtered.map(p => <button key={p.id} aria-pressed={location.person === p.id} className={`block w-full border-b border-[var(--bord)] px-3 py-3 text-left ${location.person === p.id ? "border-l-2 border-l-red-500 bg-[var(--card2)]" : ""}`} onClick={() => { select({ person: p.id, view: "profile" }); setPickerOpen(false); requestAnimationFrame(() => detail.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}><strong className="block break-words text-sm">{p.profile?.fullName || p.username}</strong><span className="block break-words text-xs text-[var(--mut)]">{p.username} · {p.profile?.rank}</span><span className="mt-1 block text-xs">{label(p)}</span></button>)}{!loading && !filtered.length && <p className="p-4 text-sm text-[var(--mut)]">Sin cuentas que coincidan con los filtros.</p>}</section>
    <div ref={detail} className="min-w-0 scroll-mt-24">{!person ? <p className="py-10 text-center text-sm text-[var(--mut)]">{location.person && !loading ? "Esta cuenta ya no esta disponible. Selecciona otra." : "Selecciona una persona para administrar su ficha."}</p> : <>
      <header className="mb-4"><h2 className="break-words text-xl font-bold">{person.profile?.fullName || person.username}</h2><p className="text-sm text-[var(--mut)]">{person.username} · {label(person)}</p></header>
      <nav aria-label="Secciones de la ficha" className="mb-5 flex flex-wrap gap-1 border-b border-[var(--bord)] pb-2">{views.map(([view, text]) => <button key={view} aria-current={location.view === view ? "page" : undefined} className={`min-h-10 rounded-md px-3 text-sm ${location.view === view ? "bg-[var(--card2)] font-bold" : "text-[var(--mut)]"}`} onClick={() => select({ view })}>{text}</button>)}</nav>
      {(location.view === "profile" || location.view === "security") && <AdminProfileEditor key={person.id + location.view} id={person.id} mode={location.view} />}
      {location.view === "statistics" && <PersonalStatistics userId={person.id} />}
      {location.view === "permissions" && <><h3 className="mb-3 font-bold">Cargo y estado de cuenta</h3>{person.id === user?.id && <p className="mb-3 text-sm text-[var(--mut)]">Otra persona administradora debe modificar tus permisos.</p>}{person.isPendingApproval && <p className="mb-3 text-sm text-amber-500">Cuenta pendiente de aprobación. Cambiar el estado no reemplaza la revisión del ingreso.</p>}<form key={person.updatedAt} onSubmit={e => save(e, person)}><fieldset disabled={busy || person.id === user?.id} className="grid gap-3 sm:grid-cols-2"><Field label="Cargo institucional"><select name="rank" className="app-input" defaultValue={person.profile?.rank || "Bombero"}>{[...new Set([...ranks, person.profile?.rank || "Bombero"])].map(rank => <option key={rank}>{rank}</option>)}</select></Field><Field label="Estado de cuenta"><select name="active" className="app-input" defaultValue={person.isActive ? "yes" : "no"}><option value="yes">Activa</option><option value="no">Pausada</option></select></Field><button className="app-button app-button-red w-auto">Guardar cargo y estado</button></fieldset></form><GuardEligibility id={person.id} /><SpecialPermissions id={person.id} /></>}
      {location.view === "clothing" && <><h3 className="mb-3 font-bold">Prendas personales declaradas</h3>{declarations.isLoading && <p>Cargando prendas...</p>}{declarations.isError && <ErrorNotice>No se pudieron consultar las prendas. <button onClick={() => declarations.refetch()} className="underline">Reintentar</button></ErrorNotice>}{declarations.data?.length === 0 && <p className="text-sm text-[var(--mut)]">Sin prendas declaradas.</p>}{declarations.data?.map(row => <article key={row.id} className="border-b border-[var(--bord)] py-3"><h4 className="font-bold">{row.title}</h4><dl className="my-2 grid grid-cols-2 gap-2 text-sm">{[["Marca", row.clothingBrand], ["Modelo", row.clothingModel], ["Talle", row.clothingSize], ["Estado", row.clothingCondition === "OK" ? "En condiciones" : row.clothingCondition === "REVIEW" ? "A revisar" : row.clothingCondition]].map(([text, value]) => <div key={text}><dt className="text-xs text-[var(--mut)]">{text}</dt><dd className="break-words">{value || "Sin informar"}</dd></div>)}</dl><p className="whitespace-pre-wrap break-words text-sm">{row.clothingNovelties || row.details}</p></article>)}</>}
    </>}</div></div>
  </>;
}
