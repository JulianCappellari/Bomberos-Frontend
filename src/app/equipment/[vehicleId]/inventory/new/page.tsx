"use client";

import { useParams } from "next/navigation";
import AddInventoryItemForm from "@/components/equipment/AddInventoryItemForm";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import { useAuth } from "@/features/auth/auth-context";
import { useAsset } from "@/hooks/use-assets";
import { useVehicleInventory } from "@/hooks/use-vehicle-inventory";

function canManageInventory(role?: string) {
  return role === "ADMIN" || role === "OPERATOR";
}

export default function NewEquipmentInventoryPage() {
  const { user } = useAuth();
  const params = useParams<{ vehicleId: string }>();
  const assetId = params.vehicleId;
  const canManage = canManageInventory(user?.role);
  const { data: asset, isLoading: assetLoading, error: assetError } =
    useAsset(assetId);
  const vehicleId = asset?.vehicle?.id ?? "";
  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useVehicleInventory(vehicleId);

  return (
    <div className="space-y-4">
      <EquipmentPageHeader
        title="Nuevo item"
        backHref={`/equipment/${assetId}`}
      />

      <div className="max-w-5xl">
        {!canManage ? (
          <PanelMessage tone="error">
            Solo ADMIN y OPERATOR pueden administrar inventario.
          </PanelMessage>
        ) : assetLoading || inventoryLoading ? (
          <PanelMessage>Cargando inventario...</PanelMessage>
        ) : assetError || inventoryError || !asset || !inventory ? (
          <PanelMessage tone="error">
            No se pudo cargar el vehiculo o su inventario.
          </PanelMessage>
        ) : (
          <AddInventoryItemForm
            vehicleId={vehicleId}
            compartments={inventory.compartments}
          />
        )}
      </div>
    </div>
  );
}

function PanelMessage({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <section
      className={[
        "rounded-2xl border p-6 text-sm",
        tone === "error"
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-white/10 bg-[#16171b] text-slate-300",
      ].join(" ")}
    >
      {children}
    </section>
  );
}
