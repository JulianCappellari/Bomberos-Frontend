"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getErrorMessage } from "@/lib/get-error-message";
import {
  useCreateInventoryItem,
  useCreateVehicleCompartment,
} from "@/hooks/use-vehicle-inventory";
import { InventoryItemState, VehicleCompartment } from "@/types/equipment";

type Props = {
  vehicleId: string;
  compartments: VehicleCompartment[];
};

const NEW_COMPARTMENT = "__new__";

export default function AddInventoryItemForm({
  vehicleId,
  compartments,
}: Props) {
  const createCompartmentMutation = useCreateVehicleCompartment(vehicleId);
  const createItemMutation = useCreateInventoryItem(vehicleId);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    compartmentId: NEW_COMPARTMENT,
    newCompartmentName: "",
    expectedQuantity: "1",
    state: "OK" as InventoryItemState,
    notes: "",
    labelCode: "",
    expiresOn: "",
  });

  const sortedCompartments = useMemo(
    () => [...compartments].sort((a, b) => a.sortOrder - b.sortOrder),
    [compartments],
  );

  const isCreatingNewCompartment =
    form.compartmentId === NEW_COMPARTMENT || sortedCompartments.length === 0;

  const loading =
    createCompartmentMutation.isPending || createItemMutation.isPending;

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const itemName = form.name.trim();
    const expectedQuantity = Number(form.expectedQuantity);

    if (!itemName) {
      setError("Ingresá el nombre de la herramienta o equipo.");
      return;
    }

    if (!Number.isInteger(expectedQuantity) || expectedQuantity < 1) {
      setError("La cantidad debe ser un número entero mayor a cero.");
      return;
    }

    try {
      let targetCompartmentId = form.compartmentId;

      if (isCreatingNewCompartment) {
        const compartmentName = form.newCompartmentName.trim();

        if (!compartmentName) {
          setError("Ingresá el nombre del compartimiento.");
          return;
        }

        const createdCompartment =
          await createCompartmentMutation.mutateAsync({
            name: compartmentName,
            sortOrder: sortedCompartments.length,
          });

        targetCompartmentId = createdCompartment.id;
      }

      await createItemMutation.mutateAsync({
        compartmentId: targetCompartmentId,
        payload: {
          name: itemName,
          expectedQuantity,
          labelCode: form.labelCode.trim().toUpperCase() || null,
          expiresOn: form.expiresOn || null,
          state: form.state,
          notes: form.notes.trim() ? form.notes.trim() : null,
        },
      });

      setSuccess("Ítem agregado al inventario.");
      setForm((prev) => ({
        ...prev,
        name: "",
        labelCode: "",
        expiresOn: "",
        expectedQuantity: "1",
        notes: "",
        newCompartmentName: "",
        compartmentId: targetCompartmentId,
      }));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo agregar el ítem."));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5"
    >
      <h3 className="mb-6 flex items-center gap-2 text-lg font-black uppercase tracking-wide text-emerald-400">
        <Plus className="h-5 w-5" />
        Agregar herramienta / equipo
      </h3>

      <div className="grid gap-5">
        <Field label="Nombre *">
          <input
            className="input-dark"
            placeholder="Ej: Lanza regulable, hacha, manguera 45 mm"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2"><Field label="Codigo de etiqueta"><input className="input-dark" maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,39}" value={form.labelCode} onChange={(e) => updateField("labelCode", e.target.value)} /></Field><Field label="Vencimiento opcional"><input className="input-dark" type="date" value={form.expiresOn} onChange={(e) => updateField("expiresOn", e.target.value)} /></Field></div>
        <Field label="Compartimiento / baulera">
          <select
            className="input-dark"
            value={form.compartmentId}
            onChange={(e) => updateField("compartmentId", e.target.value)}
          >
            <option value={NEW_COMPARTMENT}>Crear nuevo compartimiento</option>
            {sortedCompartments.map((compartment) => (
              <option key={compartment.id} value={compartment.id}>
                {compartment.name}
              </option>
            ))}
          </select>
        </Field>

        {isCreatingNewCompartment && (
          <Field label="Nuevo compartimiento *">
            <input
              className="input-dark"
              placeholder="Ej: Cabina, baulera izquierda, techo"
              value={form.newCompartmentName}
              onChange={(e) => updateField("newCompartmentName", e.target.value)}
            />
          </Field>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Cantidad">
            <input
              type="number"
              min={1}
              className="input-dark"
              value={form.expectedQuantity}
              onChange={(e) => updateField("expectedQuantity", e.target.value)}
            />
          </Field>

          <Field label="Estado inicial">
            <select
              className="input-dark"
              value={form.state}
              onChange={(e) =>
                updateField("state", e.target.value as InventoryItemState)
              }
            >
              <option value="OK">En condiciones</option>
              <option value="REVIEW">Revisar</option>
              <option value="OUT">Fuera</option>
            </select>
          </Field>
        </div>

        <Field label="Descripción / especificaciones">
          <input
            className="input-dark"
            placeholder="Ej: 20 m, diámetro 45 mm, marca XYZ"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </Field>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Plus className="h-4 w-4" />
          {loading ? "Agregando..." : "Agregar al inventario"}
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
