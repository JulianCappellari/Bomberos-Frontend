"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";

export default function EquipmentInventoryPage() {
  const params = useParams<{ vehicleId: string }>();
  const vehicleId = params.vehicleId;

  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <EquipmentPageHeader title="Inventario" backHref={`/equipment/${vehicleId}`} />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-[#16171b] p-6">
          <h1 className="text-xl font-black uppercase tracking-wide text-red-400">
            Inventario del vehiculo
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            El inventario completo se administra desde el detalle del vehiculo,
            junto con sus compartimentos, estados y controles.
          </p>

          <Link
            href={`/equipment/${vehicleId}`}
            className="mt-5 inline-flex rounded-xl bg-red-500 px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-red-400"
          >
            Ver detalle del vehiculo
          </Link>
        </section>
      </div>
    </main>
  );
}
