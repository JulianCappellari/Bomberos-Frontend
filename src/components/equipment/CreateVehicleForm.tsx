"use client";
import { VEHICLE_LICENSE_CATEGORIES } from "@/lib/license-classes";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/get-error-message";
import { createAssetRequest } from "@/services/assets.service";
import { AssetStatus, vehicleKinds, VehicleKind } from "@/types/asset";

type FormState = {
  kind: VehicleKind;
  licenseCategory: string;
  name: string;
  status: AssetStatus;
  lastCheckDate: string;
  notes: string;
  unitNumber: string;
  plate: string;
  year: string;
  mileage: string;
  nextOilChangeMileage: string;
};

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export default function CreateVehicleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    kind: "UNCLASSIFIED",
    licenseCategory: "UNSET",
    name: "",
    status: "OPERATIONAL",
    lastCheckDate: "",
    notes: "",
    unitNumber: "",
    plate: "",
    year: "",
    mileage: "",
    nextOilChangeMileage: "",
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const created = await createAssetRequest({
        name: form.name.trim(),
        assetType: "VEHICLE",
        status: form.status,
        notes: form.notes.trim() ? form.notes.trim() : null,
        lastCheckDate: form.lastCheckDate ? `${form.lastCheckDate}T00:00:00.000Z` : null,
        vehicle: {
          kind: form.kind,
          licenseCategory: form.licenseCategory,
          unitNumber: form.unitNumber.trim(),
          plate: form.plate.trim() ? form.plate.trim() : null,
          year: parseOptionalNumber(form.year),
          mileage: parseOptionalNumber(form.mileage),
          nextOilChangeMileage: parseOptionalNumber(form.nextOilChangeMileage),
        },
      });

      router.push(`/equipment/${created.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo crear el vehículo"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-[#16171b] p-5">
        <h2 className="mb-6 text-lg font-black uppercase tracking-wide text-slate-300">
          Nuevo vehículo
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
            <Field label="Estado">
              <select
                className="input-dark"
                value={form.status}
                onChange={(e) =>
                  setField("status", e.target.value as AssetStatus)
                }
              >
                <option value="OPERATIONAL">Operativo</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="OUT_OF_SERVICE">Fuera de servicio</option>
              </select>
            </Field>

            <Field label="Último control / revisión">
              <input
                type="date"
                className="input-dark"
                value={form.lastCheckDate}
                onChange={(e) => setField("lastCheckDate", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notas">
            <textarea
              className="input-dark min-h-[120px] resize-none"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </Field>
        </div>
      </section>

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

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-400 disabled:opacity-70"
      >
        {loading ? "Creando..." : "Crear vehículo"}
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
