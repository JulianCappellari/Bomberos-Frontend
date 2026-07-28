"use client";

import { useParams } from "next/navigation";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import InspectionForm from "@/components/equipment/InspectionForm";
import { useAsset } from "@/hooks/use-assets";
import { useVehicleInventory } from "@/hooks/use-vehicle-inventory";

export default function NewInspectionPage() {
  const params = useParams<{ vehicleId: string }>();
  const assetId = params.vehicleId;
  const { data: asset, isLoading: assetLoading, error: assetError } =
    useAsset(assetId);
  const vehicleId = asset?.vehicle?.id ?? "";
  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useVehicleInventory(vehicleId);

  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <EquipmentPageHeader title="Nuevo control" backHref={`/equipment/${assetId}`} />

      <div className="mx-auto max-w-5xl px-4 py-6">
        {assetLoading || inventoryLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-300">
            Cargando inventario...
          </div>
        ) : assetError || inventoryError || !asset?.vehicle || !inventory ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            No se pudo preparar el control del vehículo.
          </div>
        ) : (
          <InspectionForm vehicleId={vehicleId} inventory={inventory} />
        )}
      </div>
    </main>
  );
}
