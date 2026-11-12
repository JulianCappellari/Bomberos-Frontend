"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BellOff } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

type State = "ok" | "unsupported" | "denied" | "off" | "checking";

// Aviso en el inicio cuando este celular NO recibe notificaciones (desactivadas o nunca activadas).
// Cuando estan activas no se muestra nada.
export function PushStatusBanner() {
  const { user } = useAuth();
  const [state, setState] = useState<State>("checking");
  useEffect(() => {
    let cancelled = false;
    async function check() {
      const supported = window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) { if (!cancelled) setState("unsupported"); return; }
      if (Notification.permission === "denied") { if (!cancelled) setState("denied"); return; }
      if (Notification.permission !== "granted") { if (!cancelled) setState("off"); return; }
      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (!cancelled) setState(subscription ? "ok" : "off");
      } catch { if (!cancelled) setState("off"); }
    }
    void check();
    const again = () => void check();
    window.addEventListener("focus", again); window.addEventListener("bomberos-notification-permission", again);
    document.addEventListener("visibilitychange", again);
    return () => { cancelled = true; window.removeEventListener("focus", again); window.removeEventListener("bomberos-notification-permission", again); document.removeEventListener("visibilitychange", again); };
  }, []);
  if (!user || user.mustChangePassword || state === "ok" || state === "checking") return null;
  const text = state === "denied" ? "Bloqueaste las notificaciones en este celular: no te van a llegar las alertas ni los avisos. Activalas desde la configuración del navegador o del teléfono."
    : state === "unsupported" ? "Este navegador no puede recibir notificaciones. En iPhone, agregá la app a la pantalla de inicio y abrila desde ahí."
    : "Las notificaciones están desactivadas en este celular: no te van a llegar las alertas ni los avisos.";
  return <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
    <BellOff className="h-5 w-5 shrink-0 text-[var(--warn-text)]" aria-hidden />
    <p className="min-w-0 flex-1">{text}</p>
    {state !== "unsupported" && <Link href="/notifications" className="app-button w-auto shrink-0">{state === "denied" ? "Cómo activarlas" : "Activar"}</Link>}
  </div>;
}
