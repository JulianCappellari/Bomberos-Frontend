"use client";
import { useState, useSyncExternalStore } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";

type Status = { enabled: boolean; publicKey: string | null; subscriptions: Array<{ id: string }> };
const permissionEvent = "bomberos-notification-permission";
function subscribeBrowserStatus(update: () => void) {
  window.addEventListener("focus", update); window.addEventListener(permissionEvent, update);
  return () => { window.removeEventListener("focus", update); window.removeEventListener(permissionEvent, update); };
}
function applicationKey(key: string) {
  const value = atob(key.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(value, c => c.charCodeAt(0));
}
export function PushSettings() {
  const { user } = useAuth(), client = useQueryClient();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const supported = useSyncExternalStore(subscribeBrowserStatus, () => window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window, () => false);
  const permission = useSyncExternalStore<NotificationPermission>(subscribeBrowserStatus, () => "Notification" in window ? Notification.permission : "default", () => "default");
  const query = useQuery({ queryKey: ["push-settings", user?.id], queryFn: async () => (await api.get<Status>("/push")).data, enabled: Boolean(user && !user.mustChangePassword) });
  async function activate() {
    if (!query.data?.publicKey) return;
    setBusy(true); setMessage("");
    try {
      // Permission is requested only by this explicit gesture, including on installed iPhone web apps.
      const granted = await Notification.requestPermission(); window.dispatchEvent(new Event(permissionEvent));
      if (granted !== "granted") { setMessage("No se concedio permiso. Puede cambiarlo en la configuracion del navegador."); return; }
      await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(query.data.publicKey) });
      await api.post("/push/subscriptions", subscription.toJSON());
      setMessage("Dispositivo registrado. Envie una prueba para comprobar la recepcion.");
      await client.invalidateQueries({ queryKey: ["push-settings"] });
    } catch { setMessage("No se pudo activar. Revise la conexion, el permiso y la instalacion de la app."); }
    finally { setBusy(false); }
  }
  async function deactivate() {
    setBusy(true); setMessage("");
    try {
      for (const row of query.data?.subscriptions || []) await api.delete(`/push/subscriptions/${row.id}`);
      const registration = await navigator.serviceWorker.getRegistration("/");
      await (await registration?.pushManager.getSubscription())?.unsubscribe();
      await client.invalidateQueries({ queryKey: ["push-settings"] });
      setMessage("Notificaciones desactivadas en este dispositivo.");
    } catch { setMessage("No se pudo desactivar completamente. Reintente o cierre esta sesion."); }
    finally { setBusy(false); }
  }
  async function test() {
    setBusy(true); setMessage("");
    try { await api.post("/push/test"); setMessage("Prueba en cola. Compruebe el aviso del dispositivo; esto no confirma su recepcion."); }
    catch { setMessage("No se pudo poner la prueba en cola."); }
    finally { setBusy(false); }
  }
  const registered = Boolean(query.data?.subscriptions.length);
  return <section className="my-5 border-y border-[var(--bord)] py-4" aria-labelledby="push-heading">
    <h2 id="push-heading" className="flex items-center gap-2 font-bold"><Bell size={18} /> Avisos en este dispositivo</h2>
    {query.isLoading ? <p className="mt-2 text-sm">Consultando configuracion...</p> : query.isError ? <p role="alert" className="mt-2 text-sm">No se pudo consultar. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></p> : <>
      <p className="mt-2 text-sm text-[var(--mut)]">{!query.data?.enabled ? "El servidor aun no tiene configuradas las claves de notificaciones externas." : !supported ? "Requiere HTTPS y un navegador compatible. En iPhone, instale la app en la pantalla de inicio y abrala desde alli." : registered ? "Este dispositivo esta registrado para recibir avisos mientras la sesion siga vigente." : "Los avisos externos estan desactivados en este dispositivo."}</p>
      {supported && query.data?.enabled && process.env.NODE_ENV === "production" && <div className="mt-3 flex flex-wrap gap-2">
        {!registered && <button className="app-button w-auto" disabled={busy || permission === "denied"} onClick={activate}><Bell size={16} /> Activar avisos</button>}
        {registered && <><button className="app-button w-auto" disabled={busy} onClick={test}><Send size={16} /> Enviar prueba</button><button className="app-button w-auto" disabled={busy} onClick={deactivate}><BellOff size={16} /> Desactivar</button></>}
      </div>}
      {process.env.NODE_ENV !== "production" && <p className="mt-2 text-xs text-[var(--mut)]">Las notificaciones externas se activan en una compilacion de produccion, no en npm run dev.</p>}
      {permission === "denied" && <p className="mt-2 text-sm">Permiso bloqueado. Habilitelo en los ajustes del navegador.</p>}
    </>}
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    <p className="mt-3 text-xs text-[var(--mut)]">La pantalla bloqueada solo muestra un aviso generico. La entrega depende de conexion, permisos, ahorro de energia y ajustes del sistema; no sustituye los canales de emergencia del cuartel ni garantiza sonido en silencio.</p>
  </section>;
}
