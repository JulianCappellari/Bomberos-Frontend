"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Siren, WifiOff } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useAlerts } from "@/hooks/use-alerts";
import { alertSoundEnabled, playAlertTone } from "@/lib/alert-sound";
import { offlineCacheSavedAt } from "@/lib/offline-cache";

// Sin conexion: avisa antes de que la persona intente fichar o responder y falle sin entender por que.
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  useEffect(() => {
    const update = () => { setOnline(navigator.onLine); setSavedAt(offlineCacheSavedAt()); };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online) return null;
  return (
    <p role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-50">
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden /> <span>Sin conexión. {savedAt ? `Mostrando datos guardados a las ${new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(savedAt)}. ` : ""}Los mensajes y tareas se guardan y se envían al volver la señal; fichar y responder alertas necesitan conexión.</span>
    </p>
  );
}

// Alerta activa sin respuesta: visible desde cualquier pantalla, no solo desde Alertas.
export function PendingAlertBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const alerts = useAlerts();
  const pending = (alerts.data ?? []).filter((alert) => alert.status === "ACTIVE" && alert.viewerIsRecipient && !alert.responses?.some((row) => row.userId === user?.id));
  const announced = useRef<Set<string> | null>(null);
  const pendingKey = pending.map((alert) => alert.id).join(",");
  // Tono por gravedad solo para alertas que aparecen mientras la app esta abierta (no al cargar la pagina).
  useEffect(() => {
    if (!alerts.data) return;
    const ids = pendingKey ? pendingKey.split(",") : [];
    if (!announced.current) { announced.current = new Set(ids); return; }
    const fresh = pending.filter((alert) => !announced.current!.has(alert.id));
    ids.forEach((id) => announced.current!.add(id));
    if (!fresh.length || !alertSoundEnabled()) return;
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
    playAlertTone(fresh.sort((a, b) => order[a.priority] - order[b.priority])[0].priority);
  }, [pendingKey, alerts.data]); // eslint-disable-line react-hooks/exhaustive-deps
  // En Alertas y en el Inicio la alerta ya se muestra en grande con su boton "Responder": no se repite el aviso.
  if (!user || pathname.startsWith("/alerts") || pathname === "/dashboard" || pathname === "/") return null;
  if (pending.length === 0) return null;
  const first = pending[0];
  return (
    <Link href="/alerts" className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-500/15 p-3 text-sm text-white hover:bg-red-500/20">
      <Siren className="h-5 w-5 shrink-0 animate-pulse text-red-400" aria-hidden />
      <span className="min-w-0 flex-1"><span className="block font-bold">{pending.length === 1 ? "Alerta activa esperando tu respuesta" : `${pending.length} alertas activas esperando tu respuesta`}</span><span className="block truncate text-white/70">{first.location}</span></span>
      <span className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 font-semibold">Responder</span>
    </Link>
  );
}
