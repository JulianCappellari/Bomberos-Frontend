"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { clearTokens } from "@/lib/auth";
import { changePasswordRequest } from "@/services/auth.service";

type Session = { id: string; userAgent: string | null; createdAt: string; lastUsedAt: string; expiresAt: string; isCurrent: boolean };

export function SecuritySettings() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [error, setError] = useState("");
  const sessions = useQuery({ queryKey: ["sessions", user?.id], enabled: !!user, queryFn: async () => (await api.get<Session[]>("/auth/sessions")).data });
  const revoke = useMutation({
    mutationFn: async (id?: string) => { await api.delete(id ? `/auth/sessions/${encodeURIComponent(id)}` : "/auth/sessions"); },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["sessions"] }); },
  });
  const password = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: () => { clearTokens(); client.clear(); window.location.replace(new URL("/login", window.location.origin).href); },
    onError: () => setError("No se pudo cambiar la clave. Verifique la clave actual y los requisitos."),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const data = { currentPassword: String(form.get("currentPassword")), newPassword: String(form.get("newPassword")), confirmPassword: String(form.get("confirmPassword")) };
    if (data.newPassword !== data.confirmPassword || new TextEncoder().encode(data.newPassword).length > 72) {
      setError("Las claves deben coincidir y no superar 72 bytes."); return;
    }
    password.mutate(data);
  }
  return <section className="w-full max-w-4xl pb-8">
    <h2 className="mb-6 text-xl font-bold">Seguridad de la cuenta</h2>
    {user?.mustChangePassword && <p role="alert" className="mb-4 text-amber-400">Debe reemplazar su clave inicial antes de continuar.</p>}
    <section className="border-b border-[var(--bord)] pb-6">
      <h3 className="mb-4 text-lg font-semibold">Cambiar contraseña</h3>
      <form onSubmit={submit} className="grid max-w-lg gap-4">
        {[{ name: "currentPassword", label: "Clave actual", auto: "current-password" }, { name: "newPassword", label: "Nueva clave (12 a 72 caracteres)", auto: "new-password" }, { name: "confirmPassword", label: "Confirmar nueva clave", auto: "new-password" }].map((field) => <label key={field.name} className="grid gap-1 text-sm">{field.label}<input name={field.name} type="password" autoComplete={field.auto} required minLength={field.name === "currentPassword" ? 1 : 12} maxLength={field.name === "currentPassword" ? 1024 : 72} className="w-full rounded-lg border border-[var(--bord)] bg-[var(--card)] p-3" /></label>)}
        {error && <p role="alert" className="text-red-400">{error}</p>}
        <button className="app-button app-button-red" disabled={password.isPending}>{password.isPending ? "Actualizando..." : "Actualizar y cerrar sesiones"}</button>
      </form>
    </section>
    <section className="pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">Sesiones activas</h3><button className="app-button app-button-outline w-auto" disabled={revoke.isPending || !sessions.data?.some((s) => !s.isCurrent)} onClick={() => { if (window.confirm("Cerrar todas las otras sesiones?")) revoke.mutate(undefined); }}>Cerrar otras sesiones</button></div>
      {sessions.isPending && <p role="status">Cargando sesiones...</p>}
      {sessions.isError && <p role="alert">No se pudieron cargar las sesiones. <button onClick={() => void sessions.refetch()}>Reintentar</button></p>}
      {revoke.isError && <p role="alert" className="text-red-400">No se pudo cerrar la sesion.</p>}
      <ul className="divide-y divide-[var(--bord)]">{sessions.data?.map((session) => <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0 flex-1"><p className="break-words text-sm">{session.userAgent || "Dispositivo sin identificar"}</p><p className="mt-1 text-xs text-[var(--mut)]">{session.isCurrent ? "Sesion actual. " : ""}Ultima renovacion: {new Date(session.lastUsedAt).toLocaleString("es-AR", { hourCycle: "h23" })}</p></div>{!session.isCurrent && <button className="app-button app-button-outline w-auto shrink-0" disabled={revoke.isPending} onClick={() => { if (window.confirm("Cerrar esta sesion?")) revoke.mutate(session.id); }}>Cerrar</button>}</li>)}</ul>
      {sessions.data?.length === 0 && <p>No hay sesiones activas.</p>}
    </section>
  </section>;
}
