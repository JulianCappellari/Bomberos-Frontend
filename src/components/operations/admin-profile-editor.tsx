"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { Field, ErrorNotice } from "./operations-ui";
type Account = {
    id: string;
    updatedAt: string;
    email: string | null;
    profile: Record<string, string | null> | null;
    emergencyContact: {
        fullName: string;
        phone: string;
        relationship: string | null;
    } | null;
};
export function AdminProfileEditor({ id, mode = "profile" }: {
    id: string;
    mode?: "profile" | "security";
}) {
    const { user } = useAuth();
    const client = useQueryClient();
    const [archived, setArchived] = useState(false);
    const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [password, setPassword] = useState("");
    const query = useQuery({ queryKey: ["admin-profile-editor", user?.id, id], queryFn: async () => (await api.get<Account>(`/users/${id}`)).data, enabled: user?.role === "ADMIN" && Boolean(id) && !archived });
    async function refresh() { await client.invalidateQueries({ queryKey: ["admin-profile-editor"] }); await client.invalidateQueries({ queryKey: ["admin-staff"] }); }
    async function save(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const data = new FormData(e.currentTarget), text = (key: string) => String(data.get(key) || ""); setBusy(true); setError(""); setNotice(""); try {
        const body = Object.fromEntries(["fullName", "dni", "badge", "phone", "altPhone", "address", "bloodType", "birthDate", "joinDate", "email"].map((key) => [key, text(key)]));
        await api.patch(`/users/${id}`, { ...body, revision: query.data!.updatedAt, ...((text("contactName") || text("contactPhone")) ? { emergencyContact: { fullName: text("contactName"), phone: text("contactPhone"), relationship: text("relationship") } } : {}) });
        await refresh();
        setNotice("Datos personales actualizados");
    }
    catch (err) {
        setError(getErrorMessage(err, "No se pudo guardar el perfil"));
    }
    finally {
        setBusy(false);
    } }
    async function accountAction(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const form = new FormData(e.currentTarget), remove = form.get("action") === "archive"; if (!window.confirm(remove ? "Dar de baja la cuenta, revocar sesiones y cerrar sus permanencias abiertas? Se conserva el historial." : "Invalidar la clave y sesiones actuales? La nueva clave temporal se mostrara una sola vez."))
        return; setBusy(true); setError(""); setPassword(""); try {
        const result = await api.request({ url: `/users/${id}${remove ? "" : "/reset-password"}`, method: remove ? "delete" : "post", data: { revision: query.data!.updatedAt, reason: form.get("reason") } });
        setPassword(result.data.initialPassword || "");
        setNotice(result.data.message);
        if (remove) { setArchived(true); await client.invalidateQueries({ queryKey: ["admin-staff"] }); return; }
        await refresh();
    }
    catch (err) {
        setError(getErrorMessage(err, "No se pudo administrar la cuenta"));
    }
    finally {
        setBusy(false);
    } }
    if (archived) return <p role="status" className="my-5">Cuenta dada de baja. Se conserva el historial.</p>;
    if (!query.data)
        return query.isError ? <ErrorNotice>No se pudo cargar el perfil. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></ErrorNotice> : <p>Cargando perfil...</p>;
    if (mode === "security" && user?.id === id) return <section><h3 className="font-bold">Seguridad de tu cuenta</h3><Link href="/me" className="app-button my-4 w-auto">Abrir configuracion de mi perfil</Link></section>;
    const account = { ...query.data, emergencyContact: { fullName: query.data.emergencyContact?.fullName || "", phone: query.data.emergencyContact?.phone || "", relationship: query.data.emergencyContact?.relationship || "" } };
    return <section className="my-5 border-t border-[var(--bord)] pt-4"><h2 className="mb-3 text-lg font-bold">{mode === "profile" ? "Datos personales" : "Seguridad y acceso"}</h2>{error && <ErrorNotice>{error}</ErrorNotice>}{notice && <p role="status" className="my-3">{notice}</p>}{mode === "profile" && <form key={account.updatedAt} onSubmit={save}><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">{[["fullName", "Nombre completo", 120], ["dni", "DNI", 20], ["badge", "Legajo", 30], ["phone", "Telefono", 40], ["altPhone", "Telefono alternativo", 40], ["address", "Domicilio", 180], ["email", "Correo", 254], ["birthDate", "Nacimiento", 10], ["joinDate", "Ingreso al cuerpo", 10]].map(([key, label, max]) => <Field key={String(key)} label={String(label)}><input name={String(key)} className="app-input" required={["fullName", "dni", "badge"].includes(String(key))} type={String(key).endsWith("Date") ? "date" : key === "email" ? "email" : "text"} maxLength={Number(max)} defaultValue={String((key === "email" ? account.email : account.profile?.[String(key)]) || "").slice(0, String(key).endsWith("Date") ? 10 : undefined)}/></Field>)}<Field label="Grupo sanguineo"><select name="bloodType" className="app-input" defaultValue={account.profile?.bloodType || ""}>{["", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((value) => <option key={value} value={value}>{value || "Sin informar"}</option>)}</select></Field>{[["contactName", "Contacto de emergencia", account.emergencyContact?.fullName], ["contactPhone", "Telefono de emergencia", account.emergencyContact?.phone], ["relationship", "Relacion", account.emergencyContact?.relationship]].map(([key, label, value]) => <Field key={key} label={label || ""}><input name={key} className="app-input" maxLength={key === "contactPhone" ? 40 : 120} defaultValue={value || ""}/></Field>)}<button className="app-button app-button-red w-auto">Guardar datos personales</button></fieldset></form>}{mode === "security" && user?.id !== id && <form onSubmit={accountAction} className="mt-5 border-t border-[var(--bord)] pt-4"><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><Field label="Acción sobre la cuenta"><select name="action" className="app-input"><option value="reset">Restablecer clave</option><option value="archive">Dar de baja</option></select></Field><Field label="Motivo administrativo"><textarea required minLength={10} maxLength={2000} name="reason" className="app-input"/></Field><button className="app-button w-auto">Confirmar acción administrativa</button></fieldset></form>}{password && <aside className="my-4 rounded-lg border border-amber-500 p-4"><h3 className="font-bold">Clave temporal de un solo acceso inicial</h3><code className="my-3 block break-all select-all">{password}</code><p className="text-sm">Entregar de forma privada al titular. Debera cambiarla al ingresar.</p><button className="app-button mt-3 w-auto" onClick={() => setPassword("")}>Ocultar clave</button></aside>}</section>;
}
