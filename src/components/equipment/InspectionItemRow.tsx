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
  onChange,
  onObservationChange,
}: {
  item: {
    id: string;
    name: string;
    expectedQuantity: number;
    compartmentName?: string;
  };
  value: InspectionResult;
  observations: string;
  onChange: (value: InspectionResult) => void;
  onObservationChange: (value: string) => void;
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

      <div className="grid gap-2 md:grid-cols-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
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

      <textarea
        className="input-dark mt-3 min-h-20 resize-none"
        placeholder="Observación del ítem (opcional)"
        value={observations}
        onChange={(e) => onObservationChange(e.target.value)}
      />
    </div>
  );
}
