"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAuth } from "@/features/auth/auth-context";
import {
  useDeleteInventoryItem,
  useUpdateInventoryItem,
} from "@/hooks/use-vehicle-inventory";
import {
  InventoryItemState,
  UpdateInventoryItemPayload,
  VehicleCompartment,
  VehicleInventoryItem,
  VehicleInventoryResponse,
} from "@/types/equipment";
import { inventoryStateMap } from "./equipment.constants";
import { cn } from "./equipment.utils";

type Props = {
  inventory: VehicleInventoryResponse;
};

type EditFormState = {
  name: string;
  compartmentId: string;
  expectedQuantity: string;
  state: InventoryItemState;
  notes: string;
};

export default function InventoryAccordion({ inventory }: Props) {
  const { user } = useAuth();
  const updateMutation = useUpdateInventoryItem(inventory.id);
  const deleteMutation = useDeleteInventoryItem(inventory.id);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const sortedCompartments = useMemo(
    () => [...inventory.compartments].sort((a, b) => a.sortOrder - b.sortOrder),
    [inventory.compartments],
  );

  const totalItems = sortedCompartments.reduce(
    (acc, compartment) => acc + compartment.items.length,
    0,
  );
  const canManageInventory = user?.role === "ADMIN" || user?.role === "OPERATOR";

  async function saveItem(
    itemId: string,
    payload: UpdateInventoryItemPayload,
  ) {
    setMessage(null);

    try {
      await updateMutation.mutateAsync({ itemId, payload });
      setEditingItemId(null);
      setMessage({ type: "success", text: "Ítem actualizado." });
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "No se pudo actualizar el ítem."),
      });
    }
  }

  async function deleteItem(item: VehicleInventoryItem) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar "${item.name}" del inventario?`,
    );

    if (!confirmed) return;

    setMessage(null);

    try {
      await deleteMutation.mutateAsync({ itemId: item.id, revision: item.revision });
      setMessage({ type: "success", text: "Ítem eliminado." });
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "No se pudo eliminar el ítem."),
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-black uppercase tracking-wide text-[var(--txt)]">
            Inventario ({totalItems} ítems)
          </h3>
          <p className="text-sm text-[var(--mut)]">
            Editá cantidades, estado, baulera y observaciones sin perder
            historial.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            "rounded-2xl border p-3 text-sm",
            message.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-[var(--ok-text)]"
              : "border-red-500/20 bg-red-500/10 text-red-300",
          )}
        >
          {message.text}
        </div>
      )}

      {sortedCompartments.map((compartment) => (
        <CompartmentCard
          key={compartment.id}
          name={compartment.name}
          itemsCount={compartment.items.length}
        >
          <div className="divide-y divide-[var(--bord)]">
            {compartment.items.length === 0 ? (
              <div className="py-4 text-sm text-[var(--mut)]">
                No hay ítems cargados en este compartimiento.
              </div>
            ) : (
              compartment.items.map((item) =>
                editingItemId === item.id ? (
                  canManageInventory ? (
                  <InventoryItemEditor
                    key={`edit-${item.id}`}
                    item={item}
                    compartments={sortedCompartments}
                    isSaving={updateMutation.isPending}
                    onCancel={() => setEditingItemId(null)}
                    onSave={(payload) => saveItem(item.id, payload)}
                  />
                  ) : (
                    <InventoryItemRow
                      key={item.id}
                      item={item}
                      canManage={canManageInventory}
                      onEdit={() => setEditingItemId(item.id)}
                      onDelete={() => deleteItem(item)}
                      isDeleting={deleteMutation.isPending}
                    />
                  )
                ) : (
                  <InventoryItemRow
                    key={item.id}
                    item={item}
                    canManage={canManageInventory}
                    onEdit={() => setEditingItemId(item.id)}
                    onDelete={() => deleteItem(item)}
                    isDeleting={deleteMutation.isPending}
                  />
                ),
              )
            )}
          </div>
        </CompartmentCard>
      ))}
    </div>
  );
}

function InventoryItemRow({
  item,
  canManage,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: VehicleInventoryItem;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const state = inventoryStateMap[item.state];
  const StateIcon = state.icon;

  return (
    <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-1 flex h-9 w-9 items-center justify-center rounded-lg border",
            state.className,
          )}
        >
          <StateIcon className="h-5 w-5" />
        </div>

        <div>
          <h4 className="text-base font-extrabold text-[var(--txt)] sm:text-lg">{item.name}</h4>
          <p className="text-sm text-[var(--mut)]">
            Cantidad esperada: {item.expectedQuantity}
          </p>
          <p className="mt-1 text-sm text-[var(--txt)]">{state.label}</p>
          {(item.labelCode || item.expiresOn) && <p className="mt-1 text-xs text-[var(--info-text)]">{item.labelCode && `Etiqueta: ${item.labelCode}`}{item.expiresOn && ` · Vence: ${item.expiresOn.slice(0, 10)}`}</p>}
          {item.inspectionItems?.[0] && item.inspectionItems[0].observedQuantity < item.inspectionItems[0].expectedQuantity && <p className="mt-1 text-xs text-[var(--warn-text)]">Ultimo control: faltan {item.inspectionItems[0].expectedQuantity - item.inspectionItems[0].observedQuantity} unidades. Requiere nuevo control para confirmar reposicion.</p>}
          {item.notes && (
            <p className="mt-1 text-sm text-[var(--mut)]">{item.notes}</p>
          )}
        </div>
      </div>

      {canManage && (
      <div className="flex gap-3 self-end md:self-auto">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--bord)] bg-[var(--card2)] text-orange-300 transition hover:brightness-95"
          aria-label={`Editar ${item.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Eliminar ${item.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      )}
    </div>
  );
}

function InventoryItemEditor({
  item,
  compartments,
  isSaving,
  onCancel,
  onSave,
}: {
  item: VehicleInventoryItem;
  compartments: VehicleCompartment[];
  isSaving: boolean;
  onCancel: () => void;
  onSave: (payload: UpdateInventoryItemPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<EditFormState>({
    name: item.name,
    compartmentId: item.compartmentId,
    expectedQuantity: item.expectedQuantity.toString(),
    state: item.state,
    notes: item.notes ?? "",
  });
  const [validationError, setValidationError] = useState("");

  function updateField<K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setValidationError("");

    const name = form.name.trim();
    const expectedQuantity = Number(form.expectedQuantity);

    if (!name) {
      setValidationError("El nombre es obligatorio.");
      return;
    }

    if (!Number.isInteger(expectedQuantity) || expectedQuantity < 1) {
      setValidationError("La cantidad debe ser un entero mayor a cero.");
      return;
    }

    await onSave({
      revision: item.revision,
      name,
      compartmentId: form.compartmentId,
      expectedQuantity,
      state: form.state,
      notes: form.notes.trim() ? form.notes.trim() : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre">
          <input
            className="input-dark"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </Field>

        <Field label="Compartimiento">
          <select
            className="input-dark"
            value={form.compartmentId}
            onChange={(event) =>
              updateField("compartmentId", event.target.value)
            }
          >
            {compartments.map((compartment) => (
              <option key={compartment.id} value={compartment.id}>
                {compartment.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cantidad">
          <input
            type="number"
            min={1}
            className="input-dark"
            value={form.expectedQuantity}
            onChange={(event) =>
              updateField("expectedQuantity", event.target.value)
            }
          />
        </Field>

        <Field label="Estado">
          <select
            className="input-dark"
            value={form.state}
            onChange={(event) =>
              updateField("state", event.target.value as InventoryItemState)
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
          className="input-dark min-h-20 resize-none"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
        />
      </Field>

      {validationError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {validationError}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--bord)] bg-[var(--card2)] px-4 py-3 text-sm font-black uppercase tracking-wide text-[var(--txt)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-4 w-4" />
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
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--mut)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function CompartmentCard({
  name,
  itemsCount,
  children,
}: {
  name: string;
  itemsCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--bord)] bg-[var(--card)] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <div className="text-lg font-black text-[var(--txt)] sm:text-xl">{name}</div>
          <div className="text-sm text-[var(--mut)]">{itemsCount} ítems</div>
        </div>

        <ChevronDown
          className={cn(
            "h-5 w-5 text-[var(--mut)] transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}
