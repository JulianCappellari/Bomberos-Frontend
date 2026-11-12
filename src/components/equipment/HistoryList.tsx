import { InspectionHistoryEntry } from "@/types/inspection";
import { formatDate } from "./equipment.utils";
import { InspectionAmendment } from "@/components/operations/inspection-amendment";
import { InspectionConfirmation } from "@/components/operations/inspection-confirmation";
import { fluidLabel, fluidTone, fuelLabel } from "@/lib/vehicle-fluids";

type Props = {
  history: InspectionHistoryEntry[];
};

export default function HistoryList({ history }: Props) {
  if (!history.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#16171b] p-6 text-slate-400">
        No hay controles registrados todavía.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <div
          key={entry.id}
          className="rounded-3xl border border-white/10 bg-[#16171b] p-5"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-black text-white">
                Control #{history.length - index}
              </h3>
              <p className="text-sm text-slate-400">
                {formatDate(entry.inspectionDate)}
                {entry.inspectionTime ? ` · ${entry.inspectionTime}` : ""}
              </p>
            </div>

            {entry.incidentType && (
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-300">
                {entry.incidentType}
              </span>
            )}
            <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${!entry.voidedAt && entry.resultingAssetStatus === "OPERATIONAL" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
              {entry.voidedAt ? "Control anulado" : entry.confirmationsComplete === false ? "Pendiente de firmas" : entry.resultingAssetStatus === "OPERATIONAL" ? "Sin fallas al controlar" : "Requiere correccion"}
            </span>
          </div>

          <div className="mt-4 grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-300 md:grid-cols-4">
            <SummaryPill label="OK" value={entry.summaryOk} />
            <SummaryPill label="Faltantes" value={entry.summaryMissing} />
            <SummaryPill label="Dañados" value={entry.summaryDamaged} />
            <SummaryPill label="Sin revisar" value={entry.summaryUnchecked} />
          </div>

          {(entry.oilLevel || entry.coolantLevel || entry.fuelLevel) && (
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3" aria-label="Fluidos del móvil">
              <FluidPill label="Aceite" value={fluidLabel(entry.oilLevel)} tone={fluidTone(entry.oilLevel)} />
              <FluidPill label="Refrigerante" value={fluidLabel(entry.coolantLevel)} tone={fluidTone(entry.coolantLevel)} />
              <FluidPill label="Combustible" value={fuelLabel(entry.fuelLevel)} tone={fluidTone(entry.fuelLevel)} />
            </dl>
          )}

          {entry.observations && (
            <p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-300">{entry.observations}</p>
          )}
          <InspectionConfirmation entry={entry} />
          <InspectionAmendment entry={entry} />

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
            <div className="font-bold text-white">
              Encargado: {entry.leader?.profile?.fullName || entry.leader?.username || "No informado (control historico)"}
            </div>
            <div className="mt-1 text-slate-400">
              Equipo: {entry.responsibles?.map((responsible) => responsible.user.profile?.fullName || responsible.user.username).join(", ") || "No informado"}
            </div>
          </div>

          {entry.items.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {entry.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="text-sm font-bold text-white">
                    {item.inventoryItem?.name ?? "Ítem"}
                  </div>
                  {item.inventoryItem?.compartment?.name && (
                    <div className="mt-1 text-xs text-slate-500">
                      {item.inventoryItem.compartment.name}
                    </div>
                  )}
                  <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    Resultado: {item.result} · Encontrados: {item.observedQuantity} / {item.expectedQuantity}
                  </div>
                  {item.observations && (
                    <div className="mt-2 text-sm text-slate-300">
                      {item.observations}
                    </div>
                  )}
                  {item.foundElsewhere && <p className="mt-2 text-sm text-amber-200">Encontrado en otro lugar: {item.foundLocation}. Requiere revisar y reponer.</p>}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      {label}: <span className="text-white">{value}</span>
    </div>
  );
}

function FluidPill({ label, value, tone }: { label: string; value: string | null; tone: "ok" | "warn" | "bad" | "muted" }) {
  const color = tone === "bad" ? "text-red-400" : tone === "warn" ? "text-[var(--warn-text)]" : tone === "ok" ? "text-[var(--ok-text)]" : "text-[var(--mut)]";
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--bord)] bg-[var(--card2)] px-3 py-2 sm:block">
      <dt className="text-xs font-bold uppercase tracking-wide text-[var(--mut)]">{label}</dt>
      <dd className={`font-bold ${color}`}>{value ?? "—"}</dd>
    </div>
  );
}
