"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { registerStepUpHandler, rememberStepUp } from "@/lib/step-up";
import { OperationDialog } from "@/components/operations/work-ui";

// Ventana global para confirmar la contrasena antes de una accion critica.
export function StepUpDialog() {
  const [open, setOpen] = useState(false), [password, setPassword] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const resolver = useRef<((token: string | null) => void) | null>(null);
  useEffect(() => {
    registerStepUpHandler(() => new Promise((resolve) => { resolver.current = resolve; setPassword(""); setError(""); setOpen(true); }));
    return () => registerStepUpHandler(null);
  }, []);
  function close(token: string | null) { setOpen(false); setPassword(""); resolver.current?.(token); resolver.current = null; }
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const { data } = await api.post<{ token: string; expiresInMinutes: number }>("/auth/confirm", { password });
      rememberStepUp(data.token, data.expiresInMinutes); close(data.token);
    } catch (err) { setError(getErrorMessage(err, "No se pudo confirmar")); setPassword(""); }
    finally { setBusy(false); }
  }
  if (!open) return null;
  return <OperationDialog title="Confirmá tu contraseña" pending={busy} onClose={() => close(null)}><form onSubmit={submit}><fieldset disabled={busy} className="space-y-3">
    <p className="flex items-start gap-2 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />Es una acción importante. Por seguridad, escribí tu contraseña; no te la vamos a volver a pedir por 5 minutos.</p>
    <label className="block text-sm">Contraseña<input autoFocus type="password" autoComplete="current-password" required className="app-input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <div className="flex gap-2"><button className="app-button app-button-red w-auto">{busy ? "Confirmando…" : "Confirmar"}</button><button type="button" className="app-button app-button-outline w-auto" onClick={() => close(null)}>Cancelar</button></div>
  </fieldset></form></OperationDialog>;
}
