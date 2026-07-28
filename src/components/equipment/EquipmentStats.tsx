import { Asset } from "@/types/asset";
import { getEquipmentStats } from "./equipment.utils";

type Props = {
  assets: Asset[];
};

function StatCard({
  value,
  label,
  valueClassName,
}: {
  value: number;
  label: string;
  valueClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141417] px-6 py-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className={`text-center text-5xl font-black ${valueClassName}`}>
        {value}
      </div>
      <div className="mt-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

export default function EquipmentStats({ assets }: Props) {
  const stats = getEquipmentStats(assets);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatCard value={stats.operational} label="Operativos" valueClassName="text-emerald-400" />
      <StatCard value={stats.maintenance} label="Mantenimiento" valueClassName="text-yellow-300" />
      <StatCard value={stats.total} label="Total equipos" valueClassName="text-red-400" />
      <StatCard value={stats.outOfService} label="Fuera servicio" valueClassName="text-red-500" />
    </div>
  );
}