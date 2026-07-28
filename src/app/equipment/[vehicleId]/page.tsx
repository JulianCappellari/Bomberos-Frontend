"use client";

import { useParams } from "next/navigation";
import AddInventoryItemForm from "@/components/equipment/AddInventoryItemForm";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import InventoryAccordion from "@/components/equipment/InventoryAccordion";
import VehicleHero from "@/components/equipment/VehicleHero";
import { useAuth } from "@/features/auth/auth-context";
import { useAsset } from "@/hooks/use-assets";
import { useVehicleInventory } from "@/hooks/use-vehicle-inventory";

export default function VehicleDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ vehicleId: string }>();
  const assetId = params.vehicleId;
  const canManageInventory = user?.role === "ADMIN" || user?.role === "OPERATOR";

  const {
    data: asset,
    isLoading: assetLoading,
    error: assetError,
  } = useAsset(assetId);

  const realVehicleId = asset?.vehicle?.id ?? "";

  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useVehicleInventory(realVehicleId);

  if (assetLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a0d] text-white">
        <EquipmentPageHeader title="Vehículo" backHref="/equipment" />
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-300">
            Cargando vehículo...
          </div>
        </div>
      </main>
    );
  }

  if (assetError || !asset) {
    return (
      <main className="min-h-screen bg-[#0a0a0d] text-white">
        <EquipmentPageHeader title="Vehículo" backHref="/equipment" />
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            No se pudo cargar el vehículo.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <EquipmentPageHeader
        title={asset.name}
        backHref="/equipment"
        actionHref={
          canManageInventory ? `/equipment/${asset.id}/inspection/new` : undefined
        }
        actionLabel={canManageInventory ? "Control" : undefined}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <VehicleHero asset={asset} inventory={inventory} />

        {asset.vehicle ? (
          inventoryLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-300">
              Cargando inventario...
            </div>
          ) : inventoryError || !inventory ? (
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-yellow-200">
              Se cargó el vehículo, pero no se pudo cargar el inventario.
            </div>
          ) : (
            <>
              {canManageInventory && (
                <AddInventoryItemForm
                  vehicleId={realVehicleId}
                  compartments={inventory.compartments}
                />
              )}
              <InventoryAccordion inventory={inventory} />
            </>
          )
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-400">
            Este asset no tiene datos de vehículo asociados.
          </div>
        )}
      </div>
    </main>
  );
}
