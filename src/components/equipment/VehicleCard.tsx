"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Truck, Wrench } from "lucide-react";
import { getErrorMessage } from "@/lib/get-error-message";
import { deleteAssetRequest } from "@/services/assets.service";
import { Asset } from "@/types/asset";
import { assetStatusMap } from "./equipment.constants";
import { cn, formatDate } from "./equipment.utils";

type Props = {
  asset: Asset;
};

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  );
}

export default function VehicleCard({ asset }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = assetStatusMap[asset.status];
  const StatusIcon = status.icon;
  const vehicle = asset.vehicle;

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar ${asset.name}?`,
    );

    if (!confirmed) return;

    try {
      await deleteAssetRequest(asset.id);
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      router.refresh();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "No se pudo eliminar el equipo"));
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#16171b] p-5 shadow-[0_15px_50px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <Truck className="h-8 w-8" />
          </div>

          <div className="min-w-0">
            <Link
              href={`/equipment/${asset.id}`}
              className="block truncate text-2xl font-black text-white transition hover:text-red-400"
            >
              {asset.name}
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
              <span>{vehicle?.plate ?? "Sin patente"}</span>
              <span>·</span>
              <span>{vehicle?.year ?? "Sin año"}</span>
              <span>·</span>
              <span>Ctrl: {formatDate(asset.lastCheckDate)}</span>
            </div>

            {asset.notes && (
              <p className="mt-2 text-sm text-slate-500">{asset.notes}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className={status.className}>
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </Badge>

              <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-300">
                <Wrench className="h-4 w-4" />
                Herramientas
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:min-w-[360px] md:grid-cols-[1fr_1fr_auto]">
          <Link
            href={`/equipment/${asset.id}/edit`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#111216] px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:border-orange-400/40 hover:text-orange-300"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>

          <Link
            href={`/equipment/${asset.id}`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-sky-300 transition hover:bg-sky-500/20"
          >
            <Truck className="h-4 w-4" />
            Herramientas
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            className="flex h-full items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 transition hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
