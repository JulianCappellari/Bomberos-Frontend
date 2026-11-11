"use client";
import { CountUp } from "@/components/ui/count-up";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Maximize2, Minimize2, Siren, Truck, Users } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useOperationalReadiness } from "@/hooks/use-dashboard";
import { getBoard } from "@/services/station.service";

const typeLabel: Record<string, string> = { FIRE: "Incendio", RESCUE: "Rescate", ACCIDENT: "Accidente", CHEMICAL: "Químico", MEDICAL: "Médico", FLOOD: "Inundación", OTHER: "Otro" };
const priorityTone = { HIGH: "border-red-500 bg-red-500/15", MEDIUM: "border-amber-500 bg-amber-500/10", LOW: "border-emerald-500/60 bg-emerald-500/10" } as const;
const statusTone = { READY: "bg-emerald-600", LIMITED: "bg-amber-600", NOT_READY: "bg-red-700" } as const;
const statusLabel = { READY: "LISTOS PARA SALIR", LIMITED: "RESPUESTA LIMITADA", NOT_READY: "SIN ALISTAMIENTO" } as const;

function elapsed(from: string, now: number) {
  const s = Math.max(0, Math.floor((now - new Date(from).getTime()) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}
const clock = (d: number) => new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" }).format(d);

// 2: pantalla para el televisor del cuartel. Se actualiza sola y los tiempos corren en vivo.
export default function CommandBoardPage() {
  const readiness = useOperationalReadiness();
  const board = useQuery({ queryKey: ["station-board"], queryFn: getBoard, refetchInterval: 15000 });
  const [now, setNow] = useState(() => Date.now());
  const [full, setFull] = useState(false);
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  useEffect(() => { const sync = () => setFull(Boolean(document.fullscreenElement)); document.addEventListener("fullscreenchange", sync); return () => document.removeEventListener("fullscreenchange", sync); }, []);
  function toggleFull() { if (document.fullscreenElement) void document.exitFullscreen(); else void document.getElementById("command-board")?.requestFullscreen(); }

  const r = readiness.data;
  const incidents = board.data?.incidents ?? [];
  const vehiclesOut = incidents.reduce((n, i) => n + i.movements.length, 0);

  return <ProtectedLayout><main className="screen-body">
    <section id="command-board" className="space-y-4 bg-[var(--bg)] p-1 sm:p-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Tablero de comando</h1>
          <p className="text-sm text-[var(--mut)]">Se actualiza solo cada 15 segundos.{board.isError || readiness.isError ? " Sin conexión: mostrando los últimos datos." : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-3xl font-bold tabular-nums sm:text-4xl" aria-label="Hora actual">{clock(now)}</span>
          <button type="button" className="btn-icon" onClick={toggleFull} title={full ? "Salir de pantalla completa" : "Pantalla completa"} aria-label={full ? "Salir de pantalla completa" : "Pantalla completa"}>{full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
        </div>
      </header>

      {r && <div className={`rounded-2xl px-5 py-4 text-white ${statusTone[r.status]}`}>
        <p className="text-2xl font-black tracking-wide sm:text-3xl">{statusLabel[r.status]}</p>
        {r.blockingReasons[0] && <p className="mt-1 text-sm text-white/90">{r.blockingReasons[0]}</p>}
      </div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[[<Siren key="a" className="h-5 w-5" />, "Alertas activas", r?.alerts.activeCount ?? "–"], [<Truck key="b" className="h-5 w-5" />, "Móviles en la calle", vehiclesOut], [<Users key="c" className="h-5 w-5" />, "Personal en el cuartel", r?.personnel.presentCount ?? "–"], [<Truck key="d" className="h-5 w-5" />, "Móviles listos", r ? `${r.vehicles.readyCount}/${r.vehicles.total}` : "–"]].map(([icon, label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-2 text-[var(--mut)]">{icon}<span className="text-sm">{label}</span></div>
            <p className="mt-1 text-4xl font-black tabular-nums">{typeof value === "number" ? <CountUp value={value} /> : value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="board-incidents" className="space-y-3">
          <h2 id="board-incidents" className="text-lg font-bold">Intervenciones en curso</h2>
          {board.data && !incidents.length && <p className="rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-5 text-[var(--mut)]">Sin intervenciones abiertas.</p>}
          {incidents.map((inc) => <article key={inc.id} className={`rounded-2xl border-l-4 p-4 ${inc.alert ? priorityTone[inc.alert.priority] : "border-[var(--bord)] bg-[var(--card)]"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold">{typeLabel[inc.type] ?? inc.type} · {inc.location}</h3>
              <span className="font-mono text-2xl font-bold tabular-nums" title="Tiempo desde el aviso">{elapsed(inc.alert?.createdAt ?? inc.occurredAt, now)}</span>
            </div>
            <p className="text-sm text-[var(--mut)]">{inc.title}</p>
            {inc.agencies.length > 0 && <p className="mt-1 text-sm">También en el lugar: <strong>{inc.agencies.map((a) => a.unit ? `${a.name} (${a.unit})` : a.name).join(" · ")}</strong></p>}
            {inc.movements.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{inc.movements.map((m) => <li key={m.id} className="rounded-xl border border-[var(--bord)] bg-[var(--card)] p-3">
              <div className="flex items-center justify-between gap-2"><strong className="truncate">{m.vehicle}</strong><span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${m.arrivedAt ? "bg-emerald-700 text-white" : "bg-amber-600 text-white"}`}>{m.arrivedAt ? "En el lugar" : "En camino"}</span></div>
              <p className="mt-1 text-sm text-[var(--mut)]">A cargo: {m.leader} · Chofer: {m.driver} · {m.crew} en dotación</p>
              <p className="mt-1 font-mono text-sm tabular-nums">Salió hace {elapsed(m.departedAt, now)}{m.arrivedAt ? ` · llegó hace ${elapsed(m.arrivedAt, now)}` : ""}</p>
            </li>)}</ul> : <p className="mt-2 text-sm font-semibold text-amber-300">Ningún móvil salió todavía.</p>}
          </article>)}

          {r && r.alerts.items.length > 0 && <>
            <h2 className="pt-2 text-lg font-bold">Convocatorias activas</h2>
            <ul className="grid gap-2 sm:grid-cols-2">{r.alerts.items.map((a) => <li key={a.id} className={`rounded-xl border-l-4 p-3 ${priorityTone[a.priority]}`}>
              <div className="flex items-baseline justify-between gap-2"><strong className="truncate">{typeLabel[a.type] ?? a.type} · {a.location}</strong><span className="font-mono tabular-nums">{elapsed(a.createdAt, now)}</span></div>
              <p className="text-sm text-[var(--mut)]">{a.goingCount} dijeron “Voy” · {a.presentResponderCount} ya en el cuartel</p>
            </li>)}</ul>
          </>}
        </section>

        <aside className="space-y-4">
          <section aria-labelledby="board-people" className="rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4">
            <h2 id="board-people" className="text-lg font-bold">En el cuartel ({r?.personnel.presentCount ?? 0})</h2>
            <ul className="mt-2 divide-y divide-[var(--bord)]">{r?.personnel.items.map((p) => <li key={p.attendanceId} className="flex items-center justify-between gap-2 py-2"><span className="truncate">{p.fullName}</span><span className="shrink-0 text-xs text-[var(--mut)]">{p.isCommand ? "Mando · " : ""}{elapsed(p.checkInAt, now)}</span></li>)}</ul>
            {r && !r.personnel.items.length && <p className="mt-2 text-sm text-[var(--mut)]">Nadie registró ingreso con QR.</p>}
          </section>
          <section aria-labelledby="board-fleet" className="rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4">
            <h2 id="board-fleet" className="text-lg font-bold">Móviles</h2>
            <ul className="mt-2 space-y-2">{r?.vehicles.items.map((v) => <li key={v.vehicleId} className="flex items-start justify-between gap-2"><span className="min-w-0"><span className="block truncate font-semibold">{v.name}</span>{!v.ready && <span className="block truncate text-xs text-[var(--mut)]">{v.blockers.join(" · ")}</span>}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white ${v.ready ? "bg-emerald-700" : "bg-red-700"}`}>{v.ready ? "Listo" : "No disponible"}</span></li>)}</ul>
          </section>
        </aside>
      </div>
    </section>
  </main></ProtectedLayout>;
}
