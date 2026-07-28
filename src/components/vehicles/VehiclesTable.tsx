"use client";

import Link from "next/link";
import { Asset } from "@/types/asset";
import { VehicleStatusBadge } from "./VehicleStatusBadge";

export function VehiclesTable({ vehicles }: { vehicles: Asset[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3">Unidad</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Patente</th>
            <th className="px-4 py-3">Kilometraje</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((asset) => (
            <tr key={asset.id} className="border-t">
              <td className="px-4 py-3 font-medium">{asset.vehicle?.unitNumber ?? "-"}</td>
              <td className="px-4 py-3">{asset.name}</td>
              <td className="px-4 py-3">{asset.vehicle?.plate ?? "-"}</td>
              <td className="px-4 py-3">{asset.vehicle?.mileage ?? "-"}</td>
              <td className="px-4 py-3">
                <VehicleStatusBadge status={asset.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/vehicles/${asset.vehicle?.id}`}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                >
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}