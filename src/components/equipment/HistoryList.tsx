import { InspectionHistoryEntry } from "@/types/inspection";
import { formatDate } from "./equipment.utils";

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
          </div>

          <div className="mt-4 grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-300 md:grid-cols-4">
            <SummaryPill label="OK" value={entry.summaryOk} />
            <SummaryPill label="Faltantes" value={entry.summaryMissing} />
            <SummaryPill label="Dañados" value={entry.summaryDamaged} />
            <SummaryPill label="Sin revisar" value={entry.summaryUnchecked} />
          </div>

          {entry.observations && (
            <p className="mt-4 text-sm text-slate-300">{entry.observations}</p>
          )}

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
                    Resultado: {item.result}
                  </div>
                  {item.observations && (
                    <div className="mt-2 text-sm text-slate-300">
                      {item.observations}
                    </div>
                  )}
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
