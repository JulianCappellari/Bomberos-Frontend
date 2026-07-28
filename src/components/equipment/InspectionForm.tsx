"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/get-error-message";
import { createInspection } from "@/services/inspections.service";
import { VehicleInventoryResponse } from "@/types/equipment";
import { AlertType, InspectionResult } from "@/types/inspection";
import { flattenInventoryItems } from "./equipment.utils";
import InspectionItemRow from "./InspectionItemRow";

type Props = {
  vehicleId: string;
  inventory: VehicleInventoryResponse;
};

export default function InspectionForm({ vehicleId, inventory }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const items = useMemo(() => flattenInventoryItems(inventory), [inventory]);

  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [inspectionTime, setInspectionTime] = useState("");
  const [incidentType, setIncidentType] = useState<AlertType | "">("");
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [results, setResults] = useState<Record<string, InspectionResult>>(
    Object.fromEntries(items.map((item) => [item.id, "UNCHECKED"])),
  );
  const [itemObservations, setItemObservations] = useState<
    Record<string, string>
  >({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!items.length) {
      setError("El vehículo no tiene ítems de inventario para controlar.");
      setLoading(false);
      return;
    }

    try {
      await createInspection({
        vehicleId,
        incidentType: incidentType || undefined,
        inspectionDate,
        inspectionTime: inspectionTime || null,
        observations: observations.trim() ? observations.trim() : null,
        items: items.map((item) => ({
          inventoryItemId: item.id,
          result: results[item.id] ?? "UNCHECKED",
          observations: itemObservations[item.id]?.trim() || null,
        })),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["vehicle-inspection-history", vehicleId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["vehicle-inventory", vehicleId],
        }),
      ]);

      router.push(`/equipment/${inventory.asset.id}/history`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo guardar el control"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-[#16171b] p-5">
        <h2 className="mb-5 text-lg font-black uppercase tracking-wide text-slate-300">
          Datos del control
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Fecha">
            <input
              type="date"
              className="input-dark"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
            />
          </Field>

          <Field label="Hora">
            <input
              type="time"
              className="input-dark"
              value={inspectionTime}
              onChange={(e) => setInspectionTime(e.target.value)}
            />
          </Field>

          <Field label="Tipo de incidente">
            <select
              className="input-dark"
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value as AlertType | "")}
            >
              <option value="">Sin tipo</option>
              <option value="FIRE">Incendio</option>
              <option value="RESCUE">Rescate</option>
              <option value="ACCIDENT">Accidente</option>
              <option value="CHEMICAL">Químico</option>
              <option value="MEDICAL">Médico</option>
              <option value="FLOOD">Inundación</option>
              <option value="OTHER">Otro</option>
            </select>
          </Field>

          <Field label="Observaciones generales">
            <input
              className="input-dark"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-black uppercase tracking-wide text-slate-300">
          Ítems a revisar
        </h2>

        {items.map((item) => (
          <InspectionItemRow
            key={item.id}
            item={item}
            value={results[item.id] ?? "UNCHECKED"}
            observations={itemObservations[item.id] ?? ""}
            onChange={(value) =>
              setResults((prev) => ({
                ...prev,
                [item.id]: value,
              }))
            }
            onObservationChange={(value) =>
              setItemObservations((prev) => ({
                ...prev,
                [item.id]: value,
              }))
            }
          />
        ))}
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Guardando..." : "Guardar control"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
