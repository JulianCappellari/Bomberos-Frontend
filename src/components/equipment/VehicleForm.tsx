"use client";
import { VEHICLE_LICENSE_CATEGORIES } from "@/lib/license-classes";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/get-error-message";
import { useUpdateAsset, useUpsertVehicleData } from "@/hooks/use-assets";
import { Asset, AssetStatus, AssetType, vehicleKinds, VehicleKind } from "@/types/asset";

type Props = {
  asset: Asset;
};

type FormState = {
  kind: VehicleKind;
  licenseCategory: string;
  name: string;
  assetType: AssetType;
  status: AssetStatus;
  lastCheckDate: string;
  notes: string;
  unitNumber: string;
  plate: string;
  year: string;
  mileage: string;
  nextOilChangeMileage: string;
  fuelType: string;
};

function toInputDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export default function VehicleForm({ asset }: Props) {
  const router = useRouter();
  const updateAssetMutation = useUpdateAsset(asset.id);
  const upsertVehicleMutation = useUpsertVehicleData(asset.id);

  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    kind: asset.vehicle?.kind || "UNCLASSIFIED",
    licenseCategory: asset.vehicle?.licenseCategory || "UNSET",
    name: asset.name ?? "",
    assetType: asset.assetType,
    status: asset.status,
    lastCheckDate: toInputDate(asset.lastCheckDate),
    notes: asset.notes ?? "",
    unitNumber: asset.vehicle?.unitNumber ?? "",
    plate: asset.vehicle?.plate ?? "",
    year: asset.vehicle?.year?.toString() ?? "",
    mileage: asset.vehicle?.mileage?.toString() ?? "",
    nextOilChangeMileage: asset.vehicle?.nextOilChangeMileage?.toString() ?? "",
    fuelType: asset.vehicle?.fuelType ?? "",
  });

  const loading =
    updateAssetMutation.isPending || upsertVehicleMutation.isPending;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await updateAssetMutation.mutateAsync({
        name: form.name.trim(),
        assetType: form.assetType,
        status: form.status,
        notes: form.notes.trim() ? form.notes.trim() : null,
        lastCheckDate: form.lastCheckDate ? `${form.lastCheckDate}T00:00:00.000Z` : null,
      });

      if (form.assetType === "VEHICLE") {
        await upsertVehicleMutation.mutateAsync({
          kind: form.kind,
          licenseCategory: form.licenseCategory,
          unitNumber: form.unitNumber.trim() || undefined,
          plate: form.plate.trim() ? form.plate.trim() : null,
          year: parseOptionalNumber(form.year),
          mileage: parseOptionalNumber(form.mileage),
          nextOilChangeMileage: parseOptionalNumber(form.nextOilChangeMileage),
          fuelType: form.fuelType.trim() || null,
        });
      }

      router.push(`/equipment/${asset.id}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo guardar el equipo"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-[#16171b] p-5">
        <h2 className="mb-6 text-lg font-black uppercase tracking-wide text-slate-300">
          Información general
        </h2>

        <div className="grid gap-5">
          <Field label="Nombre del equipo *">
            <input
              className="input-dark"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Tipo">
              <select
                className="input-dark"
                value={form.assetType}
                onChange={(e) =>
                  setField("assetType", e.target.value as AssetType)
                }
              >
                <option value="VEHICLE">Vehículo</option>
                <option value="PPE">PPE</option>
                <option value="OTHER">Otro</option>
              </select>
            </Field>

            <Field label="Estado">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    value: "OPERATIONAL" as AssetStatus,
                    label: "Operativo",
                    className:
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                  },
                  {
                    value: "MAINTENANCE" as AssetStatus,
                    label: "Mantenimiento",
                    className:
                      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
                  },
                  {
                    value: "OUT_OF_SERVICE" as AssetStatus,
                    label: "Fuera de servicio",
                    className: "border-red-500/30 bg-red-500/10 text-red-400",
                  },
                ].map((option) => {
                  const isActive = form.status === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setField("status", option.value)}
                      className={[
                        "rounded-2xl border px-4 py-4 text-sm font-black uppercase tracking-wide transition",
                        isActive
                          ? option.className
                          : "border-white/10 bg-[#1a1b20] text-slate-400 hover:bg-[#20222a] hover:text-white",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <Field label="Último control / revisión">
            <input
              type="date"
              className="input-dark"
              value={form.lastCheckDate}
              onChange={(e) => setField("lastCheckDate", e.target.value)}
            />
          </Field>

          <Field label="Notas">
            <textarea
              className="input-dark min-h-[120px] resize-none"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </Field>
        </div>
      </section>

      {form.assetType === "VEHICLE" && (
        <section className="rounded-3xl border border-white/10 bg-[#16171b] p-5">
          <h2 className="mb-6 text-lg font-black uppercase tracking-wide text-slate-300">
            Datos del vehículo
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Número de unidad *">
              <input
                className="input-dark"
                value={form.unitNumber}
                onChange={(e) => setField("unitNumber", e.target.value)}
              />
            </Field>

            <Field label="Tipo de movil"><select className="input-dark" value={form.kind} onChange={(e) => setField("kind", e.target.value as VehicleKind)}>{Object.entries(vehicleKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
            <Field label="Licencia que exige (para habilitar conductores)"><select className="input-dark" value={form.licenseCategory} onChange={(e) => setField("licenseCategory", e.target.value)}>{Object.entries(VEHICLE_LICENSE_CATEGORIES).map(([key, c]) => <option key={key} value={key}>{c.label}{c.required.length ? ` — ${c.required.join(" + ")}` : ""}</option>)}</select></Field>
            <Field label="Patente">
              <input
                className="input-dark"
                value={form.plate}
                onChange={(e) => setField("plate", e.target.value)}
              />
            </Field>

            <Field label="Año">
              <input
                type="number"
                className="input-dark"
                value={form.year}
                onChange={(e) => setField("year", e.target.value)}
              />
            </Field>

            <Field label="Kilometraje">
              <input
                type="number"
                className="input-dark"
                value={form.mileage}
                onChange={(e) => setField("mileage", e.target.value)}
              />
            </Field>

            <Field label="Combustible">
              <input
                className="input-dark"
                list="fuel-types"
                maxLength={60}
                placeholder="Ej. Gasoil Súper"
                value={form.fuelType}
                onChange={(e) => setField("fuelType", e.target.value)}
              />
              <datalist id="fuel-types"><option value="Gasoil Súper" /><option value="Gasoil Premium" /><option value="Nafta Súper" /><option value="Nafta Premium" /><option value="GNC" /></datalist>
            </Field>

            <Field label="Próximo cambio de aceite">
              <input
                type="number"
                className="input-dark"
                value={form.nextOilChangeMileage}
                onChange={(e) =>
                  setField("nextOilChangeMileage", e.target.value)
                }
              />
            </Field>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-400 disabled:opacity-70"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full rounded-2xl border border-white/10 bg-transparent px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>
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
