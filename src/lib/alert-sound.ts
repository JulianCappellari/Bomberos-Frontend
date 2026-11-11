"use client";

// Tonos de alerta dentro de la app, distintos por gravedad. Se generan con Web Audio (sin archivos).
// Limitacion de la web: no puede sonar con el telefono en silencio ni con la app cerrada; para eso
// queda la notificacion del sistema (con vibracion por gravedad en el service worker).
export type AlertPriority = "HIGH" | "MEDIUM" | "LOW";
const KEY = "bomberos:alert-sound";

// [frecuencia Hz, duracion ms, pausa ms]
const patterns: Record<AlertPriority, Array<[number, number, number]>> = {
  HIGH: [[880, 220, 80], [660, 220, 80], [880, 220, 80], [660, 220, 80], [880, 220, 80], [660, 400, 0]],
  MEDIUM: [[740, 250, 150], [740, 250, 150], [740, 250, 0]],
  LOW: [[600, 300, 0]],
};
export const vibrationPatterns: Record<AlertPriority, number[]> = {
  HIGH: [500, 200, 500, 200, 500, 200, 1000],
  MEDIUM: [300, 150, 300, 150, 300],
  LOW: [250],
};

export function alertSoundEnabled() {
  try { return localStorage.getItem(KEY) !== "off"; } catch { return true; }
}
export function setAlertSoundEnabled(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* sin almacenamiento: queda activo */ }
}

let context: AudioContext | null = null;
export function playAlertTone(priority: AlertPriority) {
  if (typeof window === "undefined") return;
  try { navigator.vibrate?.(vibrationPatterns[priority]); } catch { /* sin vibracion */ }
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  context ??= new Ctor();
  if (context.state === "suspended") void context.resume();
  let at = context.currentTime + 0.05;
  for (const [frequency, duration, pause] of patterns[priority]) {
    const osc = context.createOscillator(), gain = context.createGain();
    osc.type = priority === "HIGH" ? "square" : "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(priority === "HIGH" ? 0.25 : 0.18, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration / 1000);
    osc.connect(gain).connect(context.destination);
    osc.start(at); osc.stop(at + duration / 1000 + 0.02);
    at += (duration + pause) / 1000;
  }
}
