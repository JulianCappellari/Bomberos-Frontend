"use client";

import { useParams } from "next/navigation";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import InspectionForm from "@/components/equipment/InspectionForm";
import { useAsset } from "@/hooks/use-assets";
import { useVehicleInventory } from "@/hooks/use-vehicle-inventory";
import { useControlEligibility } from "@/hooks/use-control-eligibility";

export default function NewInspectionPage() {
  const params = useParams<{ vehicleId: string }>();
  const assetId = params.vehicleId;
  const { data: asset, isLoading: assetLoading, error: assetError } =
    useAsset(assetId);
  const vehicleId = asset?.vehicle?.id ?? "";
  const eligibility = useControlEligibility();
  const roster = eligibility.data?.group?.members.map((m) => m.user) || [];
  const rosterLoading = eligibility.isLoading;
  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useVehicleInventory(vehicleId);

  return (
    <div className="space-y-4">
      <EquipmentPageHeader title="Nuevo control" backHref={`/equipment/${assetId}`} />

      <div className="max-w-6xl">
        {!eligibility.isLoading && !eligibility.data?.allowed ? <p className="rounded-lg border border-amber-500/40 p-4">{eligibility.isError ? "No se pudo verificar la semana de control." : eligibility.data?.reason || "Control no habilitado para su grupo esta semana."}</p> : assetLoading || inventoryLoading || rosterLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-300">
            Cargando inventario...
          </div>
        ) : assetError || inventoryError || !asset?.vehicle || !inventory ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            No se pudo preparar el control del vehículo.
          </div>
        ) : (
          <InspectionForm vehicleId={vehicleId} inventory={inventory} roster={roster} />
        )}
      </div>
    </div>
  );
}
