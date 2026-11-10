"use client";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { readTaskOutbox } from "@/lib/task-outbox";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Lifecycle = { canInstall: boolean; install: () => Promise<void>; waiting: boolean; update: () => void; version: string; error: string };
const Context = createContext<Lifecycle>({ canInstall: false, install: async () => {}, waiting: false, update: () => {}, version: "", error: "" });
export function AppLifecycle({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null), [waiting, setWaiting] = useState(false), [version, setVersion] = useState(""), [error, setError] = useState("");
  const registration = useRef<ServiceWorkerRegistration | null>(null), requested = useRef(false);
  useEffect(() => {
    let active = true;
    const installable = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const installed = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", installable); window.addEventListener("appinstalled", installed);
    void fetch("/release.json", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((data) => { if (active && typeof data?.version === "string") setVersion(data.version); }).catch(() => {});
    let timer: number | undefined;
    const changed = () => { if (requested.current) window.location.reload(); };
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.addEventListener("controllerchange", changed);
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((reg) => {
        if (!active) return; registration.current = reg; if (reg.waiting) setWaiting(true);
        reg.addEventListener("updatefound", () => { const worker = reg.installing; worker?.addEventListener("statechange", () => { if (active && worker.state === "installed" && navigator.serviceWorker.controller) setWaiting(true); }); });
        timer = window.setInterval(() => { if (navigator.onLine) void reg.update().catch(() => {}); }, 30 * 60000);
      }).catch(() => { if (active) setError("No se pudo activar la instalacion o comprobacion de actualizaciones."); });
    }
    return () => { active = false; if (timer) clearInterval(timer); window.removeEventListener("beforeinstallprompt", installable); window.removeEventListener("appinstalled", installed); navigator.serviceWorker?.removeEventListener("controllerchange", changed); };
  }, []);
  async function install() { if (!prompt) return; await prompt.prompt(); await prompt.userChoice; setPrompt(null); }
  function update() {
    if (document.querySelector("form") || (user && readTaskOutbox(user.id).length)) { setError("Guarde o cierre los formularios, revise los pendientes y vuelva al inicio para actualizar."); return; }
    if (registration.current?.waiting) { requested.current = true; registration.current.waiting.postMessage("ACTIVATE_UPDATE"); }
  }
  return <Context.Provider value={{ canInstall: Boolean(prompt), install, waiting, update, version, error }}>{children}</Context.Provider>;
}
export function useAppLifecycle() { return useContext(Context); }
export function AppUpdateBanner() {
  const { waiting, update, error } = useAppLifecycle();
  if (!waiting) return null;
  return <aside className="my-3 rounded-lg border border-sky-500/40 p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span>Hay una actualizacion disponible.</span><button className="app-button w-auto" onClick={update}>Actualizar en un momento seguro</button></div>{error && <p role="status" className="mt-2 text-amber-200">{error}</p>}</aside>;
}
