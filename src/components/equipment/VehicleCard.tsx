"use client";

import Link from "next/link";
import { ChevronRight, ClipboardCheck, Pencil, Truck } from "lucide-react";
import { Asset } from "@/types/asset";
import { assetStatusMap } from "./equipment.constants";
import { useAuth } from "@/features/auth/auth-context";
import { Badge } from "@/components/ui/badge";

type Props = {
  asset: Asset;
};

// Dias desde el ultimo control; el control semanal vence a los 7 dias (H01/I11).
function controlAge(value: string | null) {
  if (!value) return { text: "Sin controles registrados", warn: true };
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  const text = days <= 0 ? "Último control: hoy" : days === 1 ? "Último control: ayer" : `Último control: hace ${days} días`;
  return { text, warn: days > 7 };
}

export default function VehicleCard({ asset }: Props) {
  const { user } = useAuth();
  const manager = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const status = assetStatusMap[asset.status];
  const StatusIcon = status.icon;
  const vehicle = asset.vehicle;
  const control = controlAge(asset.lastCheckDate);
  const badgeVariant = asset.status === "OPERATIONAL" ? "green" : asset.status === "MAINTENANCE" ? "yellow" : "red";

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[var(--card)] p-4 transition-colors hover:border-white/20">
      <Link href={`/equipment/${asset.id}`} className="group flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          <Truck className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words font-bold leading-snug text-white group-hover:underline underline-offset-4">{asset.name}</span>
          <span className="mt-0.5 block text-xs text-white/60">{vehicle?.plate ?? "Sin patente"} · {vehicle?.year ? `Año ${vehicle.year}` : "Año sin dato"}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={badgeVariant} size="sm"><StatusIcon className="mr-1 inline h-3 w-3" aria-hidden />{status.label}</Badge>
            <span className={`text-xs ${control.warn ? "text-amber-300" : "text-white/60"}`}>{control.text}{control.warn ? " · control vencido" : ""}</span>
          </span>
          {asset.notes && <span className="mt-2 block text-xs text-white/55 line-clamp-2">{asset.notes}</span>}
        </span>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-white/30" aria-hidden />
      </Link>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
        <Link href={`/equipment/${asset.id}/history`} className="app-button app-button-outline w-auto">
          <ClipboardCheck className="h-4 w-4" aria-hidden /> Controles
        </Link>
        {manager && (
          <Link href={`/equipment/${asset.id}/edit`} className="app-button app-button-outline w-auto">
            <Pencil className="h-4 w-4" aria-hidden /> Editar
          </Link>
        )}
      </div>
    </article>
  );
}
