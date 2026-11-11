"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Banknote, ClipboardList, LayoutDashboard, Plus, Search, ShieldCheck, Users, Wrench } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice } from "@/components/operations/operations-ui";
import { AdminStaff, AdminStaffPanel } from "@/components/operations/admin-staff";
import { MessageReceiptAdmin } from "@/components/operations/message-receipt-admin";
import { FinancePanel, useFinanceAccess } from "@/components/operations/finance-panel";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { AdminLocation, adminHref, parseAdminLocation } from "@/lib/admin-navigation";
import { canOpenPage } from "@/lib/permissions";

const groups = [
  { title: "Servicios y guardias", links: [["/alerts/notices", "Llamadas y avisos"], ["/alerts", "Convocatorias"], ["/incidents", "Intervenciones"], ["/calendar", "Agenda de guardias"], ["/guard-qr", "QR de ingreso"], ["/guard-log", "Actas de guardia"]] },
  { title: "Flota y materiales", links: [["/equipment", "Moviles e inventarios"], ["/vehicle-control", "Controles vehiculares"], ["/maintenance", "Mantenimiento"], ["/fuel", "Combustible"], ["/water-trips", "Viajes de agua"], ["/air-equipment", "ERA y compresor"]] },
  { title: "Personal y organizacion", links: [["/control-groups", "Grupos de control"], ["/tasks", "Tareas y verificacion"], ["/participations", "Asistencias a servicios"], ["/driver-licenses", "Licencias de conducir"], ["/personal-equipment", "Vestimenta institucional"], ["/courses", "Cursos declarados"]] },
  { title: "Documentacion y supervision", links: [["/documents", "Protocolos y documentos"], ["/compliance", "Vencimientos"], ["/chat", "Comunicaciones"], ["/reports", "Reportes y estadisticas"], ["/ranking", "Ranking interno"], ["/contacts", "Contactos operativos"]] },
];

export default function AdminPage() {
  const { user } = useAuth(), financeAccess = useFinanceAccess();
  const [location, setLocation] = useState<AdminLocation>({ area: "overview", person: "", view: "profile" });
  const [status, setStatus] = useState("all"), [moduleSearch, setModuleSearch] = useState(""), [creating, setCreating] = useState(false);
  useEffect(() => { const sync = () => setLocation(parseAdminLocation(window.location.search)); sync(); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  function navigate(next: Partial<AdminLocation>) {
    const value = { ...location, ...next }; window.history.pushState(null, "", adminHref(value)); setLocation(value); setCreating(false);
  }
  const staff = useQuery({ queryKey: ["admin-staff", user?.id], queryFn: async () => (await api.get<AdminStaff[]>("/users")).data, enabled: user?.role === "ADMIN" });
  const people = staff.data || [];
  if (user?.role === "OPERATOR") return <ProtectedLayout><main className="screen-body"><h1 className="text-2xl font-bold">Gestión de jefatura</h1><p className="my-3 text-sm text-[var(--mut)]">Areas habilitadas para suboficiales. Cuentas, auditoria global y ranking permanecen restringidos.</p><div className="grid gap-6 md:grid-cols-2">{groups.map(group => <section key={group.title}><h2 className="mb-3 font-bold">{group.title}</h2>{group.links.filter(([href]) => canOpenPage(href, user.role, user.specialPermissions)).map(([href, label]) => <Link key={href} href={href} className="flex justify-between gap-3 border-b border-[var(--bord)] py-3 text-sm">{label}<ArrowRight size={15}/></Link>)}</section>)}</div></main></ProtectedLayout>;
  if (user?.role !== "ADMIN") return <ProtectedLayout><section className="screen-body"><ErrorNotice>Acceso reservado a administracion.</ErrorNotice></section></ProtectedLayout>;
  const areas = [{ id: "overview", label: "Resumen", Icon: LayoutDashboard }, { id: "staff", label: "Personal", Icon: Users }, { id: "operations", label: "Gestión del cuartel", Icon: Wrench }, ...(financeAccess.data?.canManage ? [{ id: "finance", label: "Finanzas", Icon: Banknote }] : []), { id: "audit", label: "Auditoría", Icon: ShieldCheck }];
  return <ProtectedLayout><main className="screen-body">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-[var(--mut)]">Gestión institucional</p><h1 className="mt-1 text-2xl font-bold">Administración</h1></div><button className="app-button w-auto" onClick={() => { navigate({ area: "staff" }); setCreating(true); }}><Plus size={16} />Nueva cuenta</button></header>
    <nav className="my-6 flex flex-wrap gap-1 border-b border-[var(--bord)] pb-2" aria-label="Areas de administracion">{areas.map(({ id, label, Icon }) => <button key={id} onClick={() => navigate({ area: id as AdminLocation["area"] })} aria-current={location.area === id ? "page" : undefined} className={`flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${location.area === id ? "bg-[var(--card2)] text-[var(--txt)]" : "text-[var(--mut)]"}`}><Icon size={16} />{label}</button>)}</nav>
    {staff.isError && <ErrorNotice>No se pudo cargar el personal. <button onClick={() => staff.refetch()} className="underline">Reintentar</button></ErrorNotice>}
    {location.area === "overview" && <>
      <h2 className="text-lg font-bold">Estado de las cuentas</h2>
      <div className="my-4 grid grid-cols-2 divide-x divide-[var(--bord)] border-y border-[var(--bord)] py-4 lg:grid-cols-4">{[["Total registrado", "all", people.length], ["Cuentas activas", "active", people.filter(p => p.isActive && !p.isPendingApproval).length], ["En pausa", "paused", people.filter(p => !p.isActive && !p.isPendingApproval).length], ["Pendientes de aprobación", "pending", people.filter(p => p.isPendingApproval).length]].map(([label, filter, count]) => <button key={label} className={`min-h-20 px-4 text-left ${filter === "pending" && Number(count) > 0 ? "rounded-lg bg-amber-500/15 ring-1 ring-amber-500/50" : ""}`} onClick={() => { setStatus(String(filter)); navigate({ area: "staff", person: "" }); }}><span className="block text-2xl font-bold">{staff.isLoading ? "..." : staff.isError ? "Sin datos" : count}</span><span className="text-sm text-[var(--mut)]">{label}</span>{filter === "pending" && Number(count) > 0 && <span className="mt-1 block text-xs font-semibold text-amber-200">Revisar ahora →</span>}</button>)}</div>
      <div className="grid gap-x-10 md:grid-cols-2"><section><h2 className="my-4 text-lg font-bold">Administrar</h2>{[["Personal y accesos", "Cargos, cuentas y datos individuales", "staff"], ["Gestión del cuartel", "Servicios, flota y organización", "operations"], ...(financeAccess.data?.canManage ? [["Finanzas", "Gastos, reintegros y compensaciones", "finance"]] : []), ["Auditoría", "Acciones del sistema y lecturas confirmadas", "audit"]].map(([title, description, area]) => <button key={area} onClick={() => navigate({ area: area as AdminLocation["area"] })} className="flex w-full items-center justify-between gap-4 border-b border-[var(--bord)] py-4 text-left"><span><strong className="block text-sm">{title}</strong><span className="text-sm text-[var(--mut)]">{description}</span></span><ArrowRight size={17} className="shrink-0" /></button>)}</section><section><h2 className="my-4 text-lg font-bold">Supervisión</h2>{[["/security-center", "Centro de seguridad"], ["/command", "Consulta individual de jefatura"], ["/reports", "Reportes institucionales"], ["/ranking", "Ranking interno"], ["/dashboard", "Estado operativo del cuartel"]].map(([href, label]) => <Link key={href} href={href} className="flex items-center justify-between gap-3 border-b border-[var(--bord)] py-4 text-sm font-semibold">{label}<ArrowRight size={17} className="shrink-0" /></Link>)}</section></div>
    </>}
    {location.area === "operations" && <><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Gestión del cuartel</h2><label className="flex w-full items-center gap-2 sm:w-72"><Search size={18} /><input type="search" className="app-input" aria-label="Buscar modulo de gestion" placeholder="Buscar modulo..." value={moduleSearch} onChange={e => setModuleSearch(e.target.value)} /></label></div><div className="mt-5 grid gap-x-10 gap-y-6 md:grid-cols-2">{groups.map(group => { const links = group.links.filter(([, label]) => label.toLowerCase().includes(moduleSearch.toLowerCase())); return links.length ? <section key={group.title}><h3 className="border-b border-[var(--bord)] pb-3 font-bold">{group.title}</h3>{links.map(([href, label]) => <Link key={href} href={href} className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--bord)] py-3 text-sm">{label}<ArrowRight size={15} className="shrink-0" /></Link>)}</section> : null; })}</div>{!groups.some(g => g.links.some(([, label]) => label.toLowerCase().includes(moduleSearch.toLowerCase()))) && <p className="py-8 text-[var(--mut)]">No hay modulos que coincidan.</p>}</>}
    {location.area === "finance" && (financeAccess.isPending ? <p>Verificando acceso financiero...</p> : financeAccess.isError ? <ErrorNotice>No se pudo verificar el acceso financiero.</ErrorNotice> : financeAccess.data?.canManage ? <FinancePanel /> : <ErrorNotice>No tenes permiso para administrar finanzas.</ErrorNotice>)}
    {location.area === "audit" && <><h2 className="text-lg font-bold">Auditoría y responsabilidad</h2><Link href="/activity" className="app-button my-4 w-auto"><ClipboardList size={16} />Abrir registro de acciones</Link><MessageReceiptAdmin /></>}
    {location.area === "staff" && <AdminStaffPanel people={people} loading={staff.isLoading} location={location} navigate={navigate} creating={creating} setCreating={setCreating} status={status} setStatus={setStatus} />}
  </main></ProtectedLayout>;
}
