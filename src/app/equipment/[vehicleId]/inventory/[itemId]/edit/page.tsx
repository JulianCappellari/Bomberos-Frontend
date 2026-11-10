"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EquipmentPageHeader from "@/components/equipment/EquipmentPageHeader";
import { useAuth } from "@/features/auth/auth-context";
import { useAsset } from "@/hooks/use-assets";
import {
  useUpdateInventoryItem,
  useVehicleInventory,
} from "@/hooks/use-vehicle-inventory";
import { getErrorMessage } from "@/lib/get-error-message";
import {
  InventoryItemState,
  UpdateInventoryItemPayload,
  VehicleCompartment,
  VehicleInventoryResponse,
  VehicleInventoryItem,
} from "@/types/equipment";

type Draft = {
  name: string;
  compartmentId: string;
  expectedQuantity: string;
  state: InventoryItemState;
  notes: string;
};

function canManageInventory(role?: string) {
  return role === "ADMIN" || role === "OPERATOR";
}

function findInventoryItem(
  compartments: VehicleCompartment[],
  itemId: string,
): VehicleInventoryItem | null {
  for (const compartment of compartments) {
    const item = compartment.items.find((candidate) => candidate.id === itemId);
    if (item) return item;
  }

  return null;
}

export default function EquipmentInventoryItemPage() {
  const { user } = useAuth();
  const params = useParams<{ vehicleId: string; itemId: string }>();
  const assetId = params.vehicleId;
  const itemId = params.itemId;
  const canManage = canManageInventory(user?.role);
  const { data: asset, isLoading: assetLoading, error: assetError } =
    useAsset(assetId);
  const vehicleId = asset?.vehicle?.id ?? "";
  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useVehicleInventory(vehicleId);
  const item = useMemo(
    () => (inventory ? findInventoryItem(inventory.compartments, itemId) : null),
    [inventory, itemId],
  );

  return (
    <div className="space-y-4">
      <EquipmentPageHeader
        title="Editar item"
        backHref={`/equipment/${assetId}`}
      />

      <div className="max-w-4xl">
        {!canManage ? (
          <PanelMessage tone="error">
            Solo ADMIN y OPERATOR pueden administrar inventario.
          </PanelMessage>
        ) : assetLoading || inventoryLoading ? (
          <PanelMessage>Cargando item...</PanelMessage>
        ) : assetError || inventoryError || !asset || !inventory ? (
          <PanelMessage tone="error">
            No se pudo cargar el vehiculo o su inventario.
          </PanelMessage>
        ) : !item ? (
          <PanelMessage tone="error">
            El item solicitado no existe en este vehiculo.
          </PanelMessage>
        ) : (
          <InventoryItemEditForm
            key={item.id}
            assetId={assetId}
            vehicleId={vehicleId}
            itemId={itemId}
            item={item}
            inventory={inventory}
          />
        )}
      </div>
    </div>
  );
}

function InventoryItemEditForm({
  assetId,
  vehicleId,
  itemId,
  item,
  inventory,
}: {
  assetId: string;
  vehicleId: string;
  itemId: string;
  item: VehicleInventoryItem;
  inventory: VehicleInventoryResponse;
}) {
  const router = useRouter();
  const updateMutation = useUpdateInventoryItem(vehicleId);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft>({
    name: item.name,
    compartmentId: item.compartmentId,
    expectedQuantity: String(item.expectedQuantity),
    state: item.state,
    notes: item.notes ?? "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const expectedQuantity = Number(draft.expectedQuantity);

    if (!draft.name.trim()) {
      setError("Ingresa el nombre del item.");
      return;
    }

    if (!Number.isInteger(expectedQuantity) || expectedQuantity < 1) {
      setError("La cantidad debe ser un numero entero mayor a cero.");
      return;
    }

    if (!draft.compartmentId) {
      setError("Selecciona un compartimiento.");
      return;
    }

    const payload: UpdateInventoryItemPayload = {
      revision: item.revision,
      name: draft.name.trim(),
      compartmentId: draft.compartmentId,
      expectedQuantity,
      state: draft.state,
      notes: draft.notes.trim() ? draft.notes.trim() : null,
    };

    try {
      await updateMutation.mutateAsync({ itemId, payload });
      router.push(`/equipment/${assetId}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo actualizar el item."));
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-white/10 bg-[#16171b] p-5"
    >
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-wide text-red-400">
          {item.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Actualiza datos, estado y ubicacion dentro del camion.
        </p>
      </div>

      <div className="grid gap-5">
        <Field label="Nombre">
          <input
            className="input-dark"
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </Field>

        <Field label="Compartimiento">
          <select
            className="input-dark"
            value={draft.compartmentId}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                compartmentId: event.target.value,
              }))
            }
          >
            {inventory.compartments.map((compartment) => (
              <option key={compartment.id} value={compartment.id}>
                {compartment.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Cantidad esperada">
            <input
              type="number"
              min={1}
              className="input-dark"
              value={draft.expectedQuantity}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  expectedQuantity: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Estado">
            <select
              className="input-dark"
              value={draft.state}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  state: event.target.value as InventoryItemState,
                }))
              }
            >
              <option value="OK">En condiciones</option>
              <option value="REVIEW">Revisar</option>
              <option value="OUT">Fuera</option>
            </select>
          </Field>
        </div>

        <Field label="Notas">
          <textarea
            rows={4}
            className="input-dark resize-none"
            value={draft.notes}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
          />
        </Field>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
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

function PanelMessage({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <section
      className={[
        "rounded-2xl border p-6 text-sm",
        tone === "error"
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-white/10 bg-[#16171b] text-slate-300",
      ].join(" ")}
    >
      {children}
    </section>
  );
}
