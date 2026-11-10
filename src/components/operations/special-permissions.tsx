"use client";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { getMeRequest } from "@/services/auth.service";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { ErrorNotice, Field } from "./operations-ui";
const permissions = { FLEET: "Responsable de flota", PPE: "Responsable de EPP", TECHNICAL: "Responsable tecnico de ERA y certificaciones", FINANCE: "Acceso financiero" };
type Permission = keyof typeof permissions;
export function SpecialPermissions({ id }: { id: string }) {
  const { user, setUser } = useAuth(), client = useQueryClient();
  const [permission, setPermission] = useState<Permission>("FLEET"), [enabled, setEnabled] = useState("yes"), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const query = useQuery({ queryKey: ["special-permissions", user?.id, id], enabled: user?.role === "ADMIN", queryFn: async () => (await api.get<{ updatedAt: string; specialPermissions: string[]; profile: { rank: string } | null; isActive: boolean; isPendingApproval: boolean }>(`/users/${id}`)).data });
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!query.data) return;
    const reason = String(new FormData(e.currentTarget).get("reason"));
    if (!window.confirm(`${enabled === "yes" ? "Conceder" : "Revocar"} ${permissions[permission]}? Quedara registrado con el motivo.`)) return;
    setBusy(true); setError(""); setNotice("");
    try { await api.put(`/users/${id}/permissions`, { permission, enabled: enabled === "yes", revision: query.data.updatedAt, reason }); await Promise.all([client.invalidateQueries({ queryKey: ["special-permissions"] }), client.invalidateQueries({ queryKey: ["admin-staff"] }), client.invalidateQueries({ queryKey: ["admin-profile-editor"] }), client.invalidateQueries({ queryKey: ["finance-access"] })]); if (id === user?.id) setUser(await getMeRequest()); setNotice("Permiso actualizado y auditado. No se modificaron los demas permisos."); }
    catch (err) { setError(getErrorMessage(err, "No se pudo modificar el permiso")); await query.refetch(); } finally { setBusy(false); }
  }
  if (user?.role !== "ADMIN") return null;
  return <section className="mt-6 border-t border-[var(--bord)] pt-4"><h3 className="font-bold">Permisos especiales independientes</h3><p className="my-2 text-sm text-[var(--mut)]">Rigen hasta su revocacion. No cambian el cargo institucional.</p>{query.isLoading && <p>Consultando permisos...</p>}{(query.isError || error) && <ErrorNotice>{error || "No se pudieron consultar los permisos."} <button className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice>}{notice && <p role="status" className="my-3 text-sm">{notice}</p>}{query.data && <><ul className="my-3 divide-y divide-[var(--bord)]">{Object.entries(permissions).map(([code, label]) => <li key={code} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{label}</span><strong>{query.data!.specialPermissions.includes(code) ? "Concedido" : "Sin conceder"}</strong></li>)}</ul><form onSubmit={submit}><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><Field label="Permiso especial"><select className="app-input" value={permission} onChange={e => setPermission(e.target.value as Permission)}>{Object.entries(permissions).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></Field><Field label="Accion sobre el permiso"><select value={enabled} onChange={e => setEnabled(e.target.value)} className="app-input"><option value="yes">Conceder</option><option value="no">Revocar</option></select></Field><Field label="Motivo del permiso"><textarea name="reason" required minLength={10} maxLength={1000} className="app-input" /></Field>{id === user?.id && enabled === "yes" && <p className="text-sm text-[var(--mut)]">Otra persona administradora debe concederte permisos.</p>}<button className="app-button w-auto self-end" disabled={id === user?.id && enabled === "yes"}>Guardar permiso</button></fieldset></form></>}</section>;
}
