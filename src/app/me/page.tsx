"use client";
import { FormEvent, useState } from "react";
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
import { EmergencyPeriods } from "@/components/operations/emergency-periods";
import { SecuritySettings } from "@/components/operations/security-settings";
import { EquipmentAcceptance } from "@/components/operations/equipment-acceptance";
type PrivateProfile = { email?: string | null; profile: { fullName: string; rank: string; badge: string; phone: string | null; altPhone: string | null; address: string | null; bloodType: string | null; updatedAt: string } | null; emergencyContact: { fullName: string; phone: string; relationship: string | null } | null };
export default function MyAccountPage() {
  const { user } = useAuth(); const [tab, setTab] = useState("profile"), [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const systemAdmin = user?.profile?.rank?.toLocaleLowerCase() === "administrador";
  const profile = useQuery({ queryKey: ["member-profile", user?.id], queryFn: async () => (await api.get<PrivateProfile>("/members/profile")).data, enabled: Boolean(user) && !systemAdmin });
  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget), text = (key: string) => String(form.get(key) || ""); setBusy(true); setError(""); setNotice("");
    try { await api.put("/members/profile", { phone: text("phone"), altPhone: text("altPhone"), address: text("address"), bloodType: text("bloodType"), email: text("email"), revision: profile.data!.profile!.updatedAt, emergencyContact: { fullName: text("contactName"), phone: text("contactPhone"), relationship: text("relationship") } }); await profile.refetch(); setNotice("Perfil guardado"); }
    catch (err) { setError(getErrorMessage(err, "No se pudo guardar el perfil")); } finally { setBusy(false); }
  }
  if (systemAdmin) return <ProtectedLayout><main className="screen-body"><h1 className="mb-6 text-2xl font-bold">Configuración de la cuenta administradora</h1><SecuritySettings /></main></ProtectedLayout>;
  return <ProtectedLayout><section className="screen-body"><h1 className="text-2xl font-bold">Mi perfil</h1><p className="mt-1 text-sm text-[var(--mut)]">{user?.profile?.fullName || user?.username} · {user?.profile?.rank}</p><nav className="my-5 flex flex-wrap gap-2" aria-label="Configuracion personal">{[["profile", "Datos personales"], ["clothing", "Mis prendas"], ["licenses", "Mis licencias"], ["security", "Seguridad y clave"]].map(([id, label]) => <button key={id} className={`app-button w-auto ${tab === id ? "app-button-red" : ""}`} aria-pressed={tab === id} onClick={() => { setTab(id); setError(""); setNotice(""); }}>{label}</button>)}<Link href="/participations" className="app-button w-auto">Informar asistencia a servicio</Link></nav>{error && <ErrorNotice>{error}</ErrorNotice>}{notice && <p role="status" className="mb-4 text-sm text-emerald-200">{notice}</p>}
    {tab === "clothing" && <MyClothing />}{tab === "licenses" && <LicensesContent personalOnly />}
    {tab === "profile" && <><div id="grupo-control"><NextControlBanner /></div><EquipmentAcceptance />{profile.isLoading && <p>Cargando perfil...</p>}{profile.isError && <ErrorNotice>No se pudo cargar el perfil.</ErrorNotice>}{profile.data?.profile && <form key={profile.data.profile.updatedAt} onSubmit={saveProfile}><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">{[["phone", "Telefono", profile.data.profile.phone, 40], ["altPhone", "Telefono alternativo", profile.data.profile.altPhone, 40], ["address", "Domicilio", profile.data.profile.address, 180], ["contactName", "Contacto de emergencia", profile.data.emergencyContact?.fullName, 120], ["contactPhone", "Telefono de emergencia", profile.data.emergencyContact?.phone, 40], ["relationship", "Relacion con contacto", profile.data.emergencyContact?.relationship, 60]].map(([key, label, value, max]) => <Field key={String(key)} label={String(label)}><input className="app-input" name={String(key)} defaultValue={String(value || "")} maxLength={Number(max)} required={key === "contactName" || key === "contactPhone"} /></Field>)}<Field label="Correo electrónico"><input className="app-input" type="email" name="email" maxLength={120} defaultValue={profile.data.email || ""} /></Field><Field label="Grupo sanguineo"><select name="bloodType" className="app-input" defaultValue={profile.data.profile.bloodType || ""}>{["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => <option key={v} value={v}>{v || "No informado"}</option>)}</select></Field><button className="app-button app-button-red">{busy ? "Guardando..." : "Guardar perfil"}</button></fieldset></form>}</>}
    {tab === "profile" && <><EmergencyPeriods /><AppearanceSettings /></>}{tab === "security" && <SecuritySettings />}<footer className="mt-8 flex flex-wrap gap-4 border-t border-[var(--bord)] pt-4 text-xs text-[var(--mut)]"><Link href="/app" className="underline">Aplicacion y novedades</Link></footer>
  </section></ProtectedLayout>;
}
