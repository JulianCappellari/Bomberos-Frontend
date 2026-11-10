"use client";

import { Asset } from "@/types/asset";
import { getEquipmentStats } from "./equipment.utils";
import { StatCard } from "@/components/ui/stat-card";
import { Truck, CheckCircle2, Wrench, AlertOctagon } from "lucide-react";

type Props = {
  assets: Asset[];
};

export default function EquipmentStats({ assets }: Props) {
  const stats = getEquipmentStats(assets);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
      <StatCard
        icon={<CheckCircle2 className="h-5 w-5" />}
        value={stats.operational}
        label="Operativos"
        trend="up"
        trendValue="Listos"
        subtitle="Listos para despacho"
      />
      <StatCard
        icon={<Wrench className="h-5 w-5" />}
        value={stats.maintenance}
        label="En Taller"
        trend={stats.maintenance > 0 ? "down" : "neutral"}
        trendValue="Mantenimiento"
        subtitle="Reparación preventiva"
      />
      <StatCard
        icon={<Truck className="h-5 w-5" />}
        value={stats.total}
        label="Total Parque"
        subtitle="Unidades registradas"
      />
      <StatCard
        icon={<AlertOctagon className="h-5 w-5" />}
        value={stats.outOfService}
        label="Fuera de Servicio"
        trend={stats.outOfService > 0 ? "down" : "neutral"}
        trendValue="Inactivo"
        subtitle="Baja temporal"
      />
    </div>
  );
}
