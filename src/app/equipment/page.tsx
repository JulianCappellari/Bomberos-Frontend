"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Truck } from "lucide-react";
import { useAssets } from "@/hooks/use-assets";
import { useAuth } from "@/features/auth/auth-context";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedPage } from "@/components/ui/animated-layout";
import VehicleCard from "@/components/equipment/VehicleCard";
import { LabelLookup } from "@/components/equipment/LabelLookup";

export default function EquipmentPage() {
  const { user } = useAuth();
  const manager = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const { data, isLoading, error } = useAssets();

  const assets = (data ?? []).filter((asset) => asset.assetType === "VEHICLE");
  const [filter, setFilter] = useState<"ALL" | "OPERATIONAL" | "MAINTENANCE" | "OUT_OF_SERVICE">("ALL");
  const count = (status: string) => assets.filter((asset) => asset.status === status).length;
  const visible = filter === "ALL" ? assets : assets.filter((asset) => asset.status === filter);
  const filters = [["ALL", `Todos (${assets.length})`], ["OPERATIONAL", `Operativos (${count("OPERATIONAL")})`], ["MAINTENANCE", `En mantenimiento (${count("MAINTENANCE")})`], ["OUT_OF_SERVICE", `Fuera de servicio (${count("OUT_OF_SERVICE")})`]] as const;

  return (
    <ProtectedLayout>
      <AnimatedPage className="space-y-6">
        <PageHeader
          title="Móviles"
          subtitle="Estado de cada unidad, inventario y controles semanales"
          icon={<Truck className="h-6 w-6" />}
          actions={
            manager ? (
              <Link href="/equipment/new">
                <Button variant="primary" size="md" icon={<Plus className="h-4 w-4" />}>
                  Agregar móvil
                </Button>
              </Link>
            ) : undefined
          }
        />

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
            No se pudo obtener el estado del parque automotor. Verificá la conexión con el servidor.
          </div>
        ) : (
          <div className="space-y-6">
            <div role="tablist" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
              {filters.map(([id, text]) => (
                <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
                  className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${filter === id ? "border-red-500 bg-red-600 text-white" : "border-white/[0.1] bg-[var(--card)] text-white/75 hover:border-white/25"}`}>{text}</button>
              ))}
            </div>

            <section className="space-y-4" aria-label="Listado de móviles">

              {assets.length === 0 ? (
                <EmptyState
                  icon={<Truck className="h-8 w-8" />}
                  title="Sin Vehículos Registrados"
                  description="No hay unidades cargadas en el inventario del cuartel actualmente."
                  action={
                    manager
                      ? {
                          label: "Registrar primer vehículo",
                          href: "/equipment/new",
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {visible.length === 0 && <p className="text-sm text-white/60">No hay móviles en este estado.</p>}
                  {visible.map((asset) => (
                    <VehicleCard key={asset.id} asset={asset} />
                  ))}
                </div>
              )}
            </section>

            <details className="rounded-xl border border-white/[0.08] bg-[var(--card)] p-4">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-white/85"><Search className="h-4 w-4" aria-hidden /> Buscar una herramienta por su etiqueta</summary>
              <div className="mt-3"><LabelLookup /></div>
            </details>
          </div>
        )}
      </AnimatedPage>
    </ProtectedLayout>
  );
}
