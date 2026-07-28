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

  return (
    <div className="rounded-3xl border border-sky-500/20 bg-[radial-gradient(circle_at_top,_rgba(20,60,120,0.25),_rgba(16,17,24,1)_70%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-4xl">
            🚒
          </div>

          <div>
            <h2 className="text-3xl font-black text-white">{asset.name}</h2>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
              <span>📌 {asset.vehicle?.plate ?? "Sin patente"}</span>
              <span>{asset.vehicle?.year ?? "S/Año"}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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
                  📋 {counter.ok}/{counter.total} OK
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/equipment/${asset.id}/history`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/10"
        >
          <ClipboardList className="h-4 w-4" />
          Historial
        </Link>
      </div>
    </div>
  );
}