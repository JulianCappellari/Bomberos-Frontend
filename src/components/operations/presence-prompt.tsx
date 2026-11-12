"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { getCurrentPositionAsync } from "@/lib/geolocation";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAuth } from "@/features/auth/auth-context";
export function PresencePrompt() {
  const { user } = useAuth(), client = useQueryClient();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const query = useQuery({ queryKey: ["presence-confirmation", user?.id], queryFn: async () => (await api.get<{ attendance: { id: string; stationName: string; requiresLocation?: boolean } | null; needsConfirmation: boolean; dueAt: string | null; retryAt?: string; expiresAt?: string }>("/members/presence")).data, enabled: Boolean(user && !user.mustChangePassword), refetchInterval: 15000, refetchOnWindowFocus: true });
  const id = query.data?.attendance?.id, gps = query.data?.attendance?.requiresLocation !== false, attempted = useRef(""), inFlight = useRef(false), promptElement = useRef<HTMLElement>(null);
  const confirm = useCallback(async (inside: boolean) => {
    if (!id || inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError("");
    try {
      // Base sin ubicacion: se confirma tocando (no hay GPS que comparar).
      const point = inside && gps ? await getCurrentPositionAsync() : null;
      await api.post("/members/presence", { attendanceId: id, inside, ...(inside && !gps ? { tap: true } : {}), ...(point ? { latitude: point.coords.latitude, longitude: point.coords.longitude, accuracy: point.coords.accuracy, capturedAt: new Date(point.timestamp).toISOString() } : {}) });
      await client.invalidateQueries({ queryKey: ["presence-confirmation"] });
      await client.invalidateQueries({ queryKey: ["dashboard-summary"] });
      await client.invalidateQueries({ queryKey: ["attendance", "present"] });
    } catch (err) { setError(getErrorMessage(err, "No se pudo confirmar. Revise el permiso GPS y vuelva a intentarlo.")); }
    finally { inFlight.current = false; setBusy(false); }
  }, [client,id,gps]);
  const { needsConfirmation, dueAt, retryAt, expiresAt } = query.data || {};
  useEffect(() => {
    if (!id || !needsConfirmation || !dueAt) return;
    let cancelled = false, marking = false;
    async function check() {
      if (document.visibilityState !== "visible" || cancelled) return;
      if (!retryAt) {
        const box = promptElement.current?.getBoundingClientRect();
        if (marking || !box || box.height <= 0 || box.bottom <= 0 || box.top >= window.innerHeight) return;
        marking = true;
        try {
          await api.post("/members/presence/shown",{attendanceId:id,dueAt});
          if (!cancelled) await client.invalidateQueries({queryKey:["presence-confirmation",user?.id]});
        } catch { /* The next state poll rechecks the current obligation. */ } finally { marking = false; }
        return;
      }
      if (!gps) return; // Sin GPS no hay confirmacion automatica: tiene que tocarla la persona.
      const key = id + ":" + retryAt;
      if (Date.now() < Date.parse(retryAt) || !expiresAt || Date.now() >= Date.parse(expiresAt) || attempted.current === key || inFlight.current) return;
      attempted.current = key;
      try {
        const permission = await navigator.permissions?.query({name:"geolocation"});
        if (!cancelled && document.visibilityState === "visible" && permission?.state === "granted") await confirm(true);
      } catch { /* Manual confirmation remains available without an existing grant. */ }
    }
    const observer = !retryAt && typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(() => void check()) : null;
    if (promptElement.current) observer?.observe(promptElement.current);
    void check(); document.addEventListener("visibilitychange",check);
    return () => {cancelled = true; observer?.disconnect(); document.removeEventListener("visibilitychange",check);};
  }, [id,gps,needsConfirmation,dueAt,retryAt,expiresAt,query.dataUpdatedAt,confirm,client,user?.id]);
  if (!query.data?.needsConfirmation) return null;
  return <aside ref={promptElement} role="alert" className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4"><h2 className="font-bold">Seguís en {query.data.attendance?.stationName}?</h2><p className="mt-1 text-sm">{gps ? "Al confirmar se comprobará tu ubicación. Si no respondés, la app intentará verificarla a los 15 minutos, solo si está visible y ya tiene permiso." : "Confirmá que seguís en la base. Cada confirmación habilita 30 minutos más de permanencia."} {expiresAt && <>Si no confirmás antes de las {new Date(expiresAt).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Argentina/Buenos_Aires"})}, la permanencia se cierra y se acredita solo hasta tu última presencia verificada{dueAt ? ` (${new Date(dueAt).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Argentina/Buenos_Aires"})})` : ""}.</> }</p><div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} className="app-button app-button-red w-auto" onClick={() => confirm(true)}>{busy ? "Procesando..." : gps ? "Sí, confirmar con GPS" : "Sí, sigo acá"}</button><button disabled={busy} className="app-button w-auto" onClick={() => confirm(false)}>No, cerrar mi permanencia</button></div>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}</aside>;
}
