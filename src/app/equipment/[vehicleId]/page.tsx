"use client";

import { useParams } from "next/navigation";
import AddInventoryItemForm from "@/components/equipment/AddInventoryItemForm";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import InventoryAccordion from "@/components/equipment/InventoryAccordion";
import { InventoryManagement } from "@/components/equipment/InventoryManagement";
import VehicleHero from "@/components/equipment/VehicleHero";
import { useAuth } from "@/features/auth/auth-context";
import { useAsset } from "@/hooks/use-assets";
import { useVehicleInventory } from "@/hooks/use-vehicle-inventory";
import { useControlEligibility } from "@/hooks/use-control-eligibility";
import { FleetStatus } from "@/components/operations/fleet-status";

export default function VehicleDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ vehicleId: string }>();
  const assetId = params.vehicleId;
  const canManageInventory = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const eligibility = useControlEligibility();
  const canInspect = eligibility.data?.allowed;

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
      <div className="space-y-4">
        <EquipmentPageHeader title="Vehículo" backHref="/equipment" />
        <div className="max-w-7xl">
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-300">
            Cargando vehículo...
          </div>
        </div>
      </div>
    );
  }

  if (assetError || !asset) {
    return (
      <div className="space-y-4">
        <EquipmentPageHeader title="Vehículo" backHref="/equipment" />
        <div className="max-w-7xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            No se pudo cargar el vehículo.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EquipmentPageHeader
        title={asset.name}
        backHref="/equipment"
        actionHref={
          canInspect ? `/equipment/${asset.id}/inspection/new` : undefined
        }
        actionLabel={canInspect ? "Iniciar control semanal" : undefined}
      />

      <div className="max-w-7xl space-y-6">
        <VehicleHero asset={asset} inventory={inventory} />
        <FleetStatus asset={asset} />

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
              <InventoryAccordion inventory={inventory} />
              {canManageInventory && (
                <details className="rounded-2xl border border-white/[0.08] bg-[var(--card)] p-4">
                  <summary className="cursor-pointer font-semibold text-white">Administrar inventario: bauleras y herramientas</summary>
                  <div className="mt-4 space-y-6">
                    <InventoryManagement inventory={inventory} />
                    <AddInventoryItemForm vehicleId={realVehicleId} compartments={inventory.compartments} />
                  </div>
                </details>
              )}
            </>
          )
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-400">
            Este asset no tiene datos de vehículo asociados.
          </div>
        )}
      </div>
    </div>
  );
}
