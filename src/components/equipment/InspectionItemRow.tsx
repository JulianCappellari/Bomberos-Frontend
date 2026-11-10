"use client";

import { InspectionResult } from "@/types/inspection";
import { cn } from "./equipment.utils";

const options: { value: InspectionResult; label: string; className: string }[] =
  [
    {
      value: "OK",
      label: "OK",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    },
    {
      value: "MISSING",
      label: "Faltante",
      className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    },
    {
      value: "DAMAGED",
      label: "Dañado",
      className: "border-red-500/30 bg-red-500/10 text-red-400",
    },
    {
      value: "UNCHECKED",
      label: "No revisado",
      className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    },
  ];

export default function InspectionItemRow({
  item,
  value,
  observations,
  observedQuantity,
  onChange,
  onObservationChange,
  onObservedQuantityChange,
  foundLocation,
  onFoundLocationChange,
}: {
  item: {
    id: string;
    name: string;
    expectedQuantity: number;
    compartmentName?: string;
    expiresOn?: string | null;
    inspectionItems?: Array<{ expectedQuantity: number; observedQuantity: number; result: string; observations: string | null }>;
  };
  value: InspectionResult;
  observations: string;
  observedQuantity: number;
  onChange: (value: InspectionResult) => void;
  onObservationChange: (value: string) => void;
  onObservedQuantityChange: (value: number) => void;
  foundLocation?: string;
  onFoundLocationChange: (value: string | undefined) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#16171b] p-4">
      <div className="mb-3">
        <p className="text-lg font-black text-white">{item.name}</p>
        <p className="text-sm text-slate-400">
          {item.compartmentName ? `${item.compartmentName} · ` : ""}
          Cantidad esperada: {item.expectedQuantity}
        </p>
      </div>

      {item.inspectionItems?.[0] && item.inspectionItems[0].observedQuantity < item.inspectionItems[0].expectedQuantity && <p className="mb-3 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-sm text-amber-200">Control anterior: faltaban {item.inspectionItems[0].expectedQuantity - item.inspectionItems[0].observedQuantity}. Verificar reposicion.</p>}
      {item.expiresOn && <p className="mb-2 text-sm text-amber-200">Vencimiento: {item.expiresOn.slice(0, 10)}</p>}

      <div className="grid gap-2 md:grid-cols-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-xl border px-3 py-3 text-sm font-black uppercase tracking-wide transition",
              option.className,
              value !== option.value && "opacity-60 hover:opacity-100",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Cantidad encontrada</span>
        <input
          type="number"
          min={0}
          step={1}
          required
          className="input-dark"
          value={observedQuantity}
          onChange={(event) => onObservedQuantityChange(Math.max(0, Number(event.target.value) || 0))}
        />
      </label>

      {value !== "UNCHECKED" && observedQuantity < item.expectedQuantity && <p role="status" className="mt-2 text-sm text-amber-200">Faltan {item.expectedQuantity - observedQuantity} de {item.expectedQuantity} unidades.</p>}

      <label className="mt-3 flex items-center gap-2 text-sm text-sky-200"><input type="checkbox" checked={foundLocation !== undefined} onChange={(e) => onFoundLocationChange(e.target.checked ? "" : undefined)} /> Encontrado en otro lugar</label>
      {foundLocation !== undefined && <label className="mt-2 block text-sm">Ubicacion encontrada<input required minLength={3} maxLength={200} className="input-dark mt-1" value={foundLocation} onChange={(e) => onFoundLocationChange(e.target.value)} /></label>}
      <textarea
        className="input-dark mt-3 min-h-20 resize-none"
        placeholder={value === "MISSING" || value === "DAMAGED" ? "Detalle de la novedad (obligatorio)" : "Observacion del material"}
        maxLength={4000}
        value={observations}
        onChange={(e) => onObservationChange(e.target.value)}
      />
    </div>
  );
}
