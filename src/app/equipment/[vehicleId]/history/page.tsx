"use client";

import { useParams } from "next/navigation";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import HistoryList from "@/components/equipment/HistoryList";
import { useAsset } from "@/hooks/use-assets";
import { useVehicleInspectionHistory } from "@/hooks/use-inspections";

export default function VehicleHistoryPage() {
  const params = useParams<{ vehicleId: string }>();
  const assetId = params.vehicleId;
  const { data: asset, isLoading: assetLoading, error: assetError } =
    useAsset(assetId);
  const vehicleId = asset?.vehicle?.id ?? "";
  const { data: history, isLoading, error } =
    useVehicleInspectionHistory(vehicleId);

  return (
    <div className="space-y-4">
      <EquipmentPageHeader title="Historial" backHref={`/equipment/${assetId}`} />

      <div className="max-w-6xl">
        {assetLoading || isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-300">
            Cargando historial...
          </div>
        ) : assetError || error || !asset?.vehicle ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            No se pudo cargar el historial.
          </div>
        ) : (
          <HistoryList history={history ?? []} />
        )}
      </div>
    </div>
  );
}
