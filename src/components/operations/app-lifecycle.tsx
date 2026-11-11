"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "@/lib/toast";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Lifecycle = { canInstall: boolean; install: () => Promise<void>; waiting: boolean; update: () => void; version: string; error: string };
const Context = createContext<Lifecycle>({ canInstall: false, install: async () => {}, waiting: false, update: () => {}, version: "", error: "" });
const UPDATED_FLAG = "bomberos-updated";
const CHECK_EVERY_MS = 5 * 60000;

// Hay algo que se perderia al recargar? Dialogos abiertos, un campo con el cursor, o algo escrito en
// esta pantalla que todavia no se envio. Los pendientes sin senal (tareas, mensajes) viven en el
// almacenamiento local y sobreviven a la recarga.
export function hasUnsavedWork(typedSinceSubmit: boolean, doc: Document = document) {
  if (typedSinceSubmit) return true;
  if (doc.querySelector("[role=dialog], [role=alertdialog], dialog[open]")) return true;
  const active = doc.activeElement as HTMLElement | null;
  return Boolean(active && (active.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)));
}

// Las actualizaciones se aplican solas: al cambiar de pantalla (no se pierde nada), o en cuanto la
// pantalla actual no tiene trabajo sin guardar. No hace falta tocar ningun boton.
export function AppLifecycle({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null), [waiting, setWaiting] = useState(false), [version, setVersion] = useState(""), [error, setError] = useState("");
  const registration = useRef<ServiceWorkerRegistration | null>(null), requested = useRef(false), loadedVersion = useRef(""), stale = useRef(false), lastPath = useRef(pathname), typed = useRef(false);

  const apply = useCallback(() => {
    if (requested.current) return;
    const worker = registration.current?.waiting;
    if (!worker && !stale.current) return;
    requested.current = true;
    try { sessionStorage.setItem(UPDATED_FLAG, "1"); } catch { /* sin almacenamiento: solo no se muestra el aviso */ }
    if (worker) worker.postMessage("ACTIVATE_UPDATE"); // controllerchange recarga la pagina
    else window.location.reload();
  }, []);
  const applyIfSafe = useCallback(() => { if (!hasUnsavedWork(typed.current)) apply(); }, [apply]);

  useEffect(() => {
    let active = true;
    try { if (sessionStorage.getItem(UPDATED_FLAG)) { sessionStorage.removeItem(UPDATED_FLAG); window.setTimeout(() => toast.info("Sistema actualizado a la última versión"), 600); } } catch { /* ignorar */ }
    const installable = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const installed = () => setPrompt(null);
    // Lo escrito cuenta como pendiente hasta que se envia el formulario o se cambia de pantalla.
    const onInput = (event: Event) => { const t = event.target as HTMLInputElement; if (t?.type !== "search") typed.current = true; };
    // Si el envio fallo (queda un error a la vista), lo escrito sigue pendiente.
    const onSubmit = () => { window.setTimeout(() => { if (!document.querySelector("main [role=alert]")) { typed.current = false; applyIfSafe(); } }, 1500); };
    document.addEventListener("input", onInput, true); document.addEventListener("submit", onSubmit, true);
    window.addEventListener("beforeinstallprompt", installable); window.addEventListener("appinstalled", installed);
    const markWaiting = () => { if (!active) return; setWaiting(true); applyIfSafe(); };
    // Version publicada: sirve tambien donde no hay service worker (navegadores sin soporte o sin HTTPS).
    const checkRelease = () => fetch("/release.json", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((data) => {
      if (!active || typeof data?.version !== "string") return;
      if (!loadedVersion.current) { loadedVersion.current = data.version; setVersion(data.version); return; }
      if (data.version === loadedVersion.current) return;
      if (registration.current) void registration.current.update().catch(() => {});
      else { stale.current = true; markWaiting(); }
    }).catch(() => {});
    void checkRelease();
    const changed = () => { if (requested.current) window.location.reload(); };
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.addEventListener("controllerchange", changed);
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((reg) => {
        if (!active) return; registration.current = reg; if (reg.waiting && navigator.serviceWorker.controller) markWaiting();
        reg.addEventListener("updatefound", () => { const worker = reg.installing; worker?.addEventListener("statechange", () => { if (worker.state === "installed" && navigator.serviceWorker.controller) markWaiting(); }); });
      }).catch(() => { if (active) setError("No se pudo activar la instalación o la comprobación de actualizaciones."); });
    }
    const check = () => { if (!navigator.onLine) return; void checkRelease(); void registration.current?.update().catch(() => {}); };
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    // Al volver a la app se busca version nueva; mientras espera, se reintenta aplicar cada tanto.
    const visible = () => { if (document.visibilityState === "visible") check(); };
    const retry = window.setInterval(() => { if (registration.current?.waiting || stale.current) applyIfSafe(); }, 20000);
    document.addEventListener("visibilitychange", visible); window.addEventListener("online", check);
    return () => { active = false; clearInterval(timer); clearInterval(retry); window.removeEventListener("beforeinstallprompt", installable); window.removeEventListener("appinstalled", installed); document.removeEventListener("visibilitychange", visible); document.removeEventListener("input", onInput, true); document.removeEventListener("submit", onSubmit, true); window.removeEventListener("online", check); navigator.serviceWorker?.removeEventListener("controllerchange", changed); };
  }, [applyIfSafe]);

  // Cambiar de pantalla ya descarta lo que habia en la anterior: es el momento ideal para actualizar.
  useEffect(() => { if (lastPath.current !== pathname) { lastPath.current = pathname; typed.current = false; if (waiting) apply(); } }, [pathname, waiting, apply]);

  async function install() { if (!prompt) return; await prompt.prompt(); await prompt.userChoice; setPrompt(null); }
  return <Context.Provider value={{ canInstall: Boolean(prompt), install, waiting, update: apply, version, error }}>{children}</Context.Provider>;
}
export function useAppLifecycle() { return useContext(Context); }
// Ya no pide confirmacion: solo informa, sin boton, si la actualizacion espera a que termine de escribir.
export function AppUpdateBanner() {
  const { waiting } = useAppLifecycle();
  if (!waiting) return null;
  return <p role="status" className="my-3 rounded-lg border border-sky-500/40 px-3 py-2 text-sm text-[var(--mut)]">Hay una versión nueva. Se aplica sola cuando termines lo que estás escribiendo o cambies de pantalla.</p>;
}
