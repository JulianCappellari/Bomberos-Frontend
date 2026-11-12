"use client";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAuth } from "@/features/auth/auth-context";
import { toast } from "@/lib/toast";

type GuardAccount = { id: string; username: string; isActive: boolean; mustChangePassword: boolean; createdAt: string; lastUsedAt: string | null; onDuty: boolean };
const when = (v: string) => new Intl.DateTimeFormat("es-AR", { hourCycle: "h23", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(v));

// La guardia usa una cuenta propia (otro usuario y contraseña), separada de la cuenta personal.
// Asi lo que se hace como guardia nunca suma a la asistencia personal de quien la cumple.
export function GuardEligibility({ id }: { id: string }) {
  const { user } = useAuth(), client = useQueryClient();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const query = useQuery({ queryKey: ["guard-account", id], enabled: user?.role === "ADMIN", queryFn: async () => (await api.get<{ account: GuardAccount | null }>(`/users/${id}/guard-account`)).data });

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const form = new FormData(e.currentTarget);
    if (form.get("password") !== form.get("confirm")) { setError("Las contraseñas no coinciden."); setBusy(false); return; }
    try {
      const { data } = await api.post<{ account: GuardAccount }>(`/users/${id}/guard-account`, { username: form.get("username"), password: form.get("password"), reason: form.get("reason") });
      await client.invalidateQueries({ queryKey: ["guard-account", id] });
      toast.success("Cuenta de guardia creada", `Usuario: ${data.account.username}. Va a tener que cambiar la contraseña al primer ingreso.`);
    } catch (err) { setError(getErrorMessage(err, "No se pudo crear la cuenta de guardia")); }
    finally { setBusy(false); }
  }
  async function toggle(account: GuardAccount) {
    if (account.isActive && !window.confirm(`¿Desactivar la cuenta de guardia «${account.username}»? No va a poder ingresar hasta que la reactives.`)) return;
    setBusy(true); setError("");
    try { await api.patch(`/users/${account.id}/toggle-active`); await client.invalidateQueries({ queryKey: ["guard-account", id] }); toast.success(account.isActive ? "Cuenta de guardia desactivada" : "Cuenta de guardia reactivada"); }
    catch (err) { setError(getErrorMessage(err, "No se pudo cambiar el estado de la cuenta")); }
    finally { setBusy(false); }
  }

  if (user?.role !== "ADMIN" || user.id === id) return null;
  const account = query.data?.account;
  return <section className="my-4 border-t border-[var(--bord)] pt-4">
    <h3 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-red-400" aria-hidden /> Cuenta de guardia</h3>
    <p className="mt-1 text-sm text-[var(--mut)]">Es una cuenta aparte, con su propio usuario y contraseña, para cumplir la guardia. Mientras esté en uso, la cuenta personal no suma asistencia y no puede usar el QR que muestre la guardia.</p>
    {query.isLoading && <p className="mt-2 text-sm text-[var(--mut)]">Consultando…</p>}
    {account && <div className="mt-3 rounded-xl border border-[var(--bord)] bg-[var(--card2)] p-3 text-sm">
      <p><span className="text-[var(--mut)]">Usuario:</span> <strong>{account.username}</strong></p>
      <p className="mt-1"><span className="text-[var(--mut)]">Estado:</span> {!account.isActive ? "Desactivada" : account.onDuty ? <span className="font-semibold text-[var(--ok-text)]">En uso ahora</span> : "Activa, sin uso"}{account.mustChangePassword ? " · falta cambiar la contraseña inicial" : ""}</p>
      {account.lastUsedAt && <p className="mt-1 text-[var(--mut)]">Último uso: {when(account.lastUsedAt)}</p>}
      <button type="button" disabled={busy} className="app-button app-button-outline mt-3 w-auto" onClick={() => void toggle(account)}>{account.isActive ? "Desactivar cuenta de guardia" : "Reactivar cuenta de guardia"}</button>
      <p className="mt-2 text-xs text-[var(--mut)]">Para cambiar su contraseña o cerrar sus sesiones, buscá «{account.username}» en la lista de personal.</p>
    </div>}
    {query.data && !account && <form onSubmit={create} className="mt-3 space-y-3">
      <label className="block text-sm">Usuario de la cuenta de guardia<input name="username" required minLength={3} maxLength={50} pattern="[a-zA-Z0-9._\-]+" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" className="app-input mt-1" placeholder="Ej. guardia.perez" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">Contraseña inicial<input name="password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" className="app-input mt-1" /></label>
        <label className="block text-sm">Repetir contraseña<input name="confirm" type="password" required minLength={12} maxLength={72} autoComplete="new-password" className="app-input mt-1" /></label>
      </div>
      <p className="text-xs text-[var(--mut)]">Mínimo 12 caracteres. Al primer ingreso se le pide cambiarla.</p>
      <label className="block text-sm">Motivo administrativo<textarea name="reason" required minLength={10} maxLength={1000} className="app-input mt-1" /></label>
      <button disabled={busy} className="app-button mt-1 w-auto">{busy ? "Creando…" : "Crear cuenta de guardia"}</button>
    </form>}
    {(error || query.isError) && <p role="alert" className="mt-2 text-sm text-red-300">{error || "No se pudo consultar la cuenta de guardia."}</p>}
  </section>;
}
