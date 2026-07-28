"use client";

import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import EquipmentStats from "@/components/equipment/EquipmentStats";
import VehicleCard from "@/components/equipment/VehicleCard";
import { useAssets } from "@/hooks/use-assets";

export default function EquipmentPage() {
  const { data, isLoading, error } = useAssets();

  const assets = (data ?? []).filter((asset) => asset.assetType === "VEHICLE");

  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <EquipmentPageHeader
        title="Equipamiento"
        actionHref="/equipment/new"
        actionLabel="Agregar"
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-300">
            Cargando vehículos...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            No se pudieron cargar los vehículos.
          </div>
        ) : (
          <>
            <EquipmentStats assets={assets} />

            <section className="space-y-4">
              <div className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                🚒 Vehículos
              </div>

              {assets.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#16171b] p-6 text-slate-400">
                  No hay vehículos cargados.
                </div>
              ) : (
                assets.map((asset) => <VehicleCard key={asset.id} asset={asset} />)
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}