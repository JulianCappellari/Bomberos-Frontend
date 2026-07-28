"use client";

import { useParams } from "next/navigation";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import VehicleForm from "@/components/equipment/VehicleForm";
import { useAsset } from "@/hooks/use-assets";

export default function EditVehiclePage() {
  const params = useParams<{ vehicleId: string }>();
  const vehicleId = params.vehicleId;

  const { data: asset, isLoading, error } = useAsset(vehicleId);

  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <EquipmentPageHeader title="Editar equipo" backHref="/equipment" />

      <div className="mx-auto max-w-4xl px-4 py-6">
        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-300">
            Cargando equipo...
          </div>
        ) : error || !asset ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            No se pudo cargar el equipo.
          </div>
        ) : (
          <VehicleForm asset={asset} />
        )}
      </div>
    </main>
  );
}