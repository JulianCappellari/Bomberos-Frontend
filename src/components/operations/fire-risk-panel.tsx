"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, Droplets, ExternalLink, Flame, Sun, Thermometer, Wind } from "lucide-react";
import { api } from "@/lib/api-client";

type FireRisk = {
  place: string; observedAt: string; stale?: boolean;
  level: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH" | "EXTREME"; levelLabel: string; levelIndex: number; levels: string[]; fwi: number;
  current: { temperature: number; humidity: number; wind: number; gusts: number; windFrom: string; spreadTowards: string };
  dryDays: number; codes: { ffmc: number; dmc: number; dc: number; isi: number; bui: number }; source: string;
};

// Color por nivel: fondo del segmento activo, insignia y borde de la tarjeta.
const tones = [
  { bar: "bg-emerald-500", badge: "bg-emerald-600 text-white", border: "border-emerald-500/60", glow: "from-emerald-500/10" },
  { bar: "bg-yellow-400", badge: "bg-yellow-500 text-black", border: "border-yellow-400/60", glow: "from-yellow-400/10" },
  { bar: "bg-orange-500", badge: "bg-orange-600 text-white", border: "border-orange-500/60", glow: "from-orange-500/10" },
  { bar: "bg-red-600", badge: "bg-red-700 text-white", border: "border-red-500/70", glow: "from-red-600/15" },
  { bar: "bg-fuchsia-700", badge: "bg-fuchsia-800 text-white", border: "border-fuchsia-600/70", glow: "from-fuchsia-700/15" },
];
const advice = [
  "Condiciones poco favorables para la propagación.",
  "Un fuego puede propagarse con moderación. Atención a quemas.",
  "Propagación rápida posible. Evitar quemas y reforzar la vigilancia.",
  "Fuego difícil de controlar. Dotaciones atentas y equipos listos.",
  "Condiciones extremas: cualquier foco puede volverse incontrolable.",
];

// Tarjeta de riesgo de incendio del dia: nivel, metricas clave y hacia donde avanzaria un fuego.
export function FireRiskPanel() {
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ["fire-risk"], queryFn: async () => (await api.get<FireRisk>("/station/fire-risk")).data, staleTime: 15 * 60_000, refetchInterval: 30 * 60_000, retry: 1 });
  const data = query.data;
  const tone = tones[data?.levelIndex ?? 0];
  const time = data ? new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(data.observedAt)) : "";

  return <section aria-labelledby="fire-risk-title" className={`my-4 overflow-hidden rounded-2xl border bg-gradient-to-br ${data ? `${tone.border} ${tone.glow}` : "border-[var(--bord)] from-transparent"} to-transparent bg-[var(--card)] p-4`}>
    <div className="flex items-start gap-3">
      <Flame className={`mt-1 h-8 w-8 shrink-0 ${data && data.levelIndex >= 2 ? "text-orange-400" : "text-red-400"}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p id="fire-risk-title" className="text-xs font-bold uppercase tracking-wide text-[var(--mut)]">Riesgo de incendio hoy · {data?.place ?? "Sampacho"}</p>
        {data ? <span className={`mt-1 inline-block rounded-lg px-2.5 py-0.5 text-sm font-black uppercase tracking-wide ${tone.badge}`}>{data.levelLabel}</span>
          : query.isError ? <p className="mt-1 text-sm text-[var(--mut)]">Sin datos en este momento.</p> : <p className="mt-1 text-sm text-[var(--mut)]">Consultando…</p>}
      </div>
      <button type="button" className="shrink-0 text-sm text-[var(--mut)] hover:text-[var(--txt)]" aria-expanded={open} aria-controls="official-fwi" onClick={() => setOpen(!open)}>{open ? "Cerrar" : "Ver"} ›</button>
    </div>

    {data && <>
      <div className="mt-3 grid grid-cols-5 gap-1.5" role="img" aria-label={`Nivel ${data.levelLabel}, ${data.levelIndex + 1} de 5`}>
        {data.levels.map((label, i) => <div key={label} title={label} className={`h-2.5 rounded-full ${i <= data.levelIndex ? tones[i].bar : "bg-[var(--card2)]"} ${i === data.levelIndex ? "" : i < data.levelIndex ? "opacity-60" : ""}`} />)}
      </div>
      <p className="mt-2 text-sm">{advice[data.levelIndex]}</p>

      <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
        {[
          [<Thermometer key="t" className="mx-auto h-5 w-5 text-rose-300" aria-hidden />, `${data.current.temperature}°`, "temperatura"],
          [<Droplets key="h" className="mx-auto h-5 w-5 text-sky-300" aria-hidden />, `${data.current.humidity}%`, "humedad"],
          [<Wind key="w" className="mx-auto h-5 w-5 text-slate-300" aria-hidden />, `${data.current.wind}`, `km/h viento (ráf. ${data.current.gusts})`],
          [<Sun key="d" className="mx-auto h-5 w-5 text-amber-300" aria-hidden />, `${data.dryDays}`, data.dryDays === 1 ? "día sin lluvia" : "días sin lluvia"],
        ].map(([icon, value, label]) => <div key={String(label)} className="min-w-0">{icon}<dd className="mt-0.5 text-xl font-bold tabular-nums sm:text-2xl">{value}</dd><dt className="text-[11px] leading-tight text-[var(--mut)] sm:text-xs">{label}</dt></div>)}
      </dl>

      <p className="mt-3 flex items-center gap-2 text-sm"><Compass className="h-4 w-4 shrink-0 text-amber-300" aria-hidden /><span>Viento del <strong>{data.current.windFrom}</strong> → un fuego avanzaría hacia el <strong>{data.current.spreadTowards}</strong></span></p>
      <p className="mt-2 text-[11px] text-[var(--mut)]">Medido a las {time}{data.stale ? " · sin conexión con el proveedor: último dato disponible" : ""} · FWI {String(data.fwi).replace(".", ",")}</p>
    </>}

    {open && <div id="official-fwi" className="mt-4 min-w-0 border-t border-[var(--bord)] pt-4">
      {data && <dl className="mb-3 grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
        {[["FWI", data.fwi], ["FFMC", data.codes.ffmc], ["DMC", data.codes.dmc], ["DC", data.codes.dc], ["ISI", data.codes.isi], ["BUI", data.codes.bui]].map(([k, v]) => <div key={String(k)} className="rounded-lg bg-[var(--card2)] p-2"><dt className="text-[var(--mut)]">{k}</dt><dd className="font-bold">{String(v).replace(".", ",")}</dd></div>)}
      </dl>}
      <p className="text-xs text-[var(--mut)]">Estimación propia con el método FWI canadiense y datos de Open-Meteo; los niveles usan los umbrales europeos EFFIS. Indica el peligro potencial si se inicia un fuego, no que haya uno. La referencia oficial de la provincia es el mapa diario de IDECOR.</p>
      <a className="app-button app-button-outline mt-3 w-auto" target="_blank" rel="noopener noreferrer" href="https://mapascordoba.gob.ar/viewer/mapa/442">Abrir mapa oficial de IDECOR <ExternalLink size={14} /></a>
    </div>}
  </section>;
}
