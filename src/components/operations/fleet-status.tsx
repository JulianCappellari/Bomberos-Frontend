"use client";
import { FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { Asset } from "@/types/asset";
import { ErrorNotice, Field } from "./operations-ui";
export function FleetStatus({ asset }: { asset: Asset }) {
  const { user } = useAuth(), client = useQueryClient();
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  if (!user?.specialPermissions?.includes("FLEET") || asset.assetType !== "VEHICLE") return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const status = new FormData(event.currentTarget).get("status");
    if (!window.confirm("Cambiar el estado del movil como responsable de flota? El servidor verificara los bloqueos antes de habilitarlo.")) return;
    setBusy(true); setError(""); setNotice("");
    try { await api.put(`/assets/${asset.id}`, { status }); await Promise.all([client.invalidateQueries({ queryKey: ["asset", asset.id] }), client.invalidateQueries({ queryKey: ["assets"] })]); setNotice("Estado actualizado y registrado en auditoria."); }
    catch (err) { setError(getErrorMessage(err, "No se pudo cambiar el estado del movil")); } finally { setBusy(false); }
  }
  return <section className="border-y border-[var(--bord)] py-4"><h2 className="mb-3 font-bold">Responsable de flota</h2>{error && <ErrorNotice>{error}</ErrorNotice>}{notice && <p role="status" className="my-3 text-sm">{notice}</p>}<form key={asset.updatedAt} onSubmit={submit}><fieldset disabled={busy} className="flex flex-col gap-3 sm:flex-row sm:items-end"><Field label="Estado del movil"><select className="app-input" name="status" defaultValue={asset.status}><option value="OPERATIONAL">Operativo</option><option value="MAINTENANCE">Mantenimiento</option><option value="OUT_OF_SERVICE">Fuera de servicio</option></select></Field><button className="app-button w-auto">Guardar estado</button></fieldset></form></section>;
}
