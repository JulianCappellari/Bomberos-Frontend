"use client";

import { useParams } from "next/navigation";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import VehicleForm from "@/components/equipment/VehicleForm";
import { DeleteVehicle } from "@/components/equipment/DeleteVehicle";
import { useAsset } from "@/hooks/use-assets";

export default function EditVehiclePage() {
  const params = useParams<{ vehicleId: string }>();
  const vehicleId = params.vehicleId;

  const { data: asset, isLoading, error } = useAsset(vehicleId);

  return (
    <div className="space-y-4">
      <EquipmentPageHeader title={asset ? `Editar ${asset.name}` : "Editar móvil"} backHref="/equipment" />

      <div className="max-w-5xl">
        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-300">
            Cargando equipo...
          </div>
        ) : error || !asset ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            No se pudo cargar el equipo.
          </div>
        ) : (
          <>
            <VehicleForm asset={asset} />
            <DeleteVehicle asset={asset} />
          </>
        )}
      </div>
    </div>
  );
}
