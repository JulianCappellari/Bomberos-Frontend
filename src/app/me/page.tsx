"use client";
import { SanctionsPanel } from "@/components/operations/sanctions-panel";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { MyClothing } from "@/components/operations/my-clothing";
import { NextControlBanner } from "@/components/operations/next-control-banner";
import { LicensesContent } from "@/components/operations/licenses-content";
import { AppearanceSettings } from "@/components/operations/appearance-settings";
import { AlertSoundSettings } from "@/components/operations/alert-sound-settings";
import { EmergencyPeriods } from "@/components/operations/emergency-periods";
import { SecuritySettings } from "@/components/operations/security-settings";
import { EquipmentAcceptance } from "@/components/operations/equipment-acceptance";
type PrivateProfile = { email?: string | null; profile: { fullName: string; rank: string; badge: string; phone: string | null; altPhone: string | null; address: string | null; bloodType: string | null; updatedAt: string } | null; emergencyContact: { fullName: string; phone: string; relationship: string | null } | null };
export default function MyAccountPage() {
  const { user } = useAuth(); const [tab, setTab] = useState("profile"), [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const systemAdmin = user?.profile?.rank?.toLocaleLowerCase() === "administrador";
  // Permite enlazar a una pestaña concreta: /me?tab=availability
  useEffect(() => { const wanted = new URLSearchParams(window.location.search).get("tab"); if (wanted && ["profile", "availability", "clothing", "licenses", "record", "security", "preferences"].includes(wanted)) setTab(wanted); }, []);
  const profile = useQuery({ queryKey: ["member-profile", user?.id], queryFn: async () => (await api.get<PrivateProfile>("/members/profile")).data, enabled: Boolean(user) && !systemAdmin });
  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget), text = (key: string) => String(form.get(key) || ""); setBusy(true); setError(""); setNotice("");
    try { await api.put("/members/profile", { phone: text("phone"), altPhone: text("altPhone"), address: text("address"), bloodType: text("bloodType"), email: text("email"), revision: profile.data!.profile!.updatedAt, emergencyContact: { fullName: text("contactName"), phone: text("contactPhone"), relationship: text("relationship") } }); await profile.refetch(); setNotice("Perfil guardado"); }
    catch (err) { setError(getErrorMessage(err, "No se pudo guardar el perfil")); } finally { setBusy(false); }
  }
  if (systemAdmin) return <ProtectedLayout><main className="screen-body"><h1 className="mb-6 text-2xl font-bold">Configuración de la cuenta administradora</h1><SecuritySettings /></main></ProtectedLayout>;
  const p = profile.data?.profile, c = profile.data?.emergencyContact;
  const tabs = [["profile", "Mis datos"], ["availability", "Disponibilidad"], ["clothing", "Prendas"], ["licenses", "Licencias"], ["record", "Legajo"], ["security", "Seguridad"], ["preferences", "Preferencias"]] as const;
  const input = (name: string, label: string, value: string | null | undefined, max: number, extra: Record<string, unknown> = {}) => <Field label={label}><input className="app-input" name={name} defaultValue={value || ""} maxLength={max} {...extra} /></Field>;
  return <ProtectedLayout><section className="screen-body"><h1 className="text-2xl font-bold">Mi perfil</h1><p className="mt-1 text-sm text-[var(--mut)]">{user?.profile?.fullName || user?.username} · {user?.profile?.rank}{user?.profile?.badge ? ` · Legajo ${user.profile.badge}` : ""}</p>
    <div role="tablist" aria-label="Secciones del perfil" className="my-5 flex gap-1 overflow-x-auto rounded-xl border border-[var(--bord)] bg-black/20 p-1">{tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${tab === id ? "bg-red-600 text-white" : "text-white/70 hover:bg-white/[0.06]"}`} onClick={() => { setTab(id); setError(""); setNotice(""); }}>{label}</button>)}</div>
    {error && <ErrorNotice>{error}</ErrorNotice>}{notice && <p role="status" className="mb-4 text-sm text-emerald-200">{notice}</p>}
    {tab === "profile" && <>
      <div id="grupo-control" className="mb-4"><NextControlBanner /></div>
      {profile.isLoading && <ListSkeleton label="Cargando perfil" />}{profile.isError && <ErrorNotice>No se pudo cargar el perfil.</ErrorNotice>}
      {p && <form key={p.updatedAt} onSubmit={saveProfile}><fieldset disabled={busy} className="space-y-5">
        <section className="rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4"><h2 className="font-semibold text-white">Contacto</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{input("phone", "Teléfono", p.phone, 40, { type: "tel", autoComplete: "tel" })}{input("altPhone", "Teléfono alternativo", p.altPhone, 40, { type: "tel" })}{input("email", "Correo electrónico", profile.data?.email, 120, { type: "email", autoComplete: "email" })}{input("address", "Domicilio", p.address, 180, { autoComplete: "street-address" })}</div></section>
        <section className="rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4"><h2 className="font-semibold text-white">Salud y contacto de emergencia</h2><p className="mt-1 text-xs text-[var(--mut)]">Solo lo ven jefatura, administración y la guardia mientras hay una emergencia activa.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Grupo sanguíneo"><select name="bloodType" className="app-input" defaultValue={p.bloodType || ""}>{["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => <option key={v} value={v}>{v || "No informado"}</option>)}</select></Field>{input("contactName", "Nombre del contacto de emergencia", c?.fullName, 120, { required: true })}{input("contactPhone", "Teléfono del contacto", c?.phone, 40, { required: true, type: "tel" })}{input("relationship", "Vínculo (por ejemplo: madre, pareja)", c?.relationship, 60)}</div></section>
        <button className="app-button app-button-red w-auto">{busy ? "Guardando…" : "Guardar cambios"}</button>
      </fieldset></form>}
      <p className="mt-6 text-sm text-[var(--mut)]">¿Participaste de un servicio que no quedó registrado? <Link href="/participations" className="text-red-300 underline">Informalo acá</Link>.</p>
    </>}
    {tab === "availability" && <EmergencyPeriods />}
    {tab === "clothing" && <><EquipmentAcceptance /><MyClothing /></>}
    {tab === "licenses" && <LicensesContent personalOnly />}
    {tab === "record" && <SanctionsPanel />}
    {tab === "security" && <SecuritySettings />}
    {tab === "preferences" && <><AppearanceSettings /><AlertSoundSettings /><p className="mt-6 text-sm"><Link href="/app" className="text-red-300 underline">Aplicación y novedades</Link></p></>}
  </section></ProtectedLayout>;
}
