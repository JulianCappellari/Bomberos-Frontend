"use client";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { alertSoundEnabled, playAlertTone, setAlertSoundEnabled, type AlertPriority } from "@/lib/alert-sound";

// Preferencia por dispositivo: sonido y vibracion de alertas con la app abierta, con prueba por gravedad.
export function AlertSoundSettings() {
  const [on, setOn] = useState(true);
  useEffect(() => { const frame = requestAnimationFrame(() => setOn(alertSoundEnabled())); return () => cancelAnimationFrame(frame); }, []);
  function toggle() { const next = !on; setOn(next); setAlertSoundEnabled(next); }
  const tests: Array<[AlertPriority, string]> = [["HIGH", "Alta"], ["MEDIUM", "Media"], ["LOW", "Baja"]];
  return (
    <section className="my-5 border-b border-[var(--bord)] pb-5" aria-labelledby="alert-sound-title">
      <h2 id="alert-sound-title" className="font-bold">Sonido de alertas</h2>
      <p className="mt-1 text-sm text-[var(--mut)]">Con la app abierta, cada alerta nueva suena y vibra distinto según su prioridad. Con la app cerrada llega la notificación del celular, que también vibra según la prioridad.</p>
      <button type="button" role="switch" aria-checked={on} onClick={toggle} className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${on ? "border-emerald-500/50 text-emerald-300" : "border-[var(--bord)] text-[var(--mut)]"}`}>
        {on ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}{on ? "Sonido activado" : "Sonido desactivado"}
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--mut)]">Probar:</span>
        {tests.map(([priority, label]) => <button key={priority} type="button" className="app-button app-button-outline w-auto" onClick={() => playAlertTone(priority)}>{label}</button>)}
      </div>
      <p className="mt-2 text-xs text-[var(--mut)]">Las páginas web no pueden sonar con el celular en modo silencio. Para emergencias, mantené la sirena y la radio del cuartel como aviso principal.</p>
    </section>
  );
}
