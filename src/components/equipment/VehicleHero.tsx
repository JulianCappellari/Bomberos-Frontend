import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Asset } from "@/types/asset";
import { VehicleInventoryResponse } from "@/types/equipment";
import { assetStatusMap } from "./equipment.constants";
import { cn, countInventoryOkFromCompartments } from "./equipment.utils";

type Props = {
  asset: Asset;
  inventory?: VehicleInventoryResponse | null;
};

export default function VehicleHero({ asset, inventory }: Props) {
  const status = assetStatusMap[asset.status];
  const StatusIcon = status.icon;

  const counter = inventory
    ? countInventoryOkFromCompartments(inventory.compartments)
    : { ok: 0, total: 0 };
  const materials = inventory?.compartments.flatMap((c) => c.items) || [];
  const unresolved = materials.reduce((sum, item) => { const last = item.inspectionItems?.[0]; return sum + (last ? Math.max(0, last.expectedQuantity - last.observedQuantity) : 0); }, 0);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const expired = materials.filter((item) => item.expiresOn && item.expiresOn.slice(0, 10) < today).length;

  return (
    <section aria-label="Resumen del móvil" className="rounded-2xl border border-white/[0.08] bg-[var(--card)] p-4">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div>
            <p className="text-sm text-white/65">Patente {asset.vehicle?.plate ?? "sin cargar"} · {asset.vehicle?.year ? `Año ${asset.vehicle.year}` : "Año sin dato"}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {unresolved > 0 && <span className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Último control: faltan {unresolved} {unresolved === 1 ? "unidad" : "unidades"}. Confirmar reposición.</span>}
              {expired > 0 && <span className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{expired} {expired === 1 ? "material vencido" : "materiales vencidos"}</span>}
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
                  status.className
                )}
              >
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </span>

              {inventory && (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300">
                  {counter.ok} de {counter.total} materiales en condiciones
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/equipment/${asset.id}/history`}
          className="app-button w-auto"
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          Historial de controles
        </Link>
      </div>
    </section>
  );
}
