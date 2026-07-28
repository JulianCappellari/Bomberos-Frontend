import { Asset } from "@/types/asset";
import { VehicleCompartment, VehicleInventoryResponse } from "@/types/equipment";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "Sin fecha";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("es-AR");
}

export function getEquipmentStats(assets: Asset[]) {
  const total = assets.length;
  const operational = assets.filter((a) => a.status === "OPERATIONAL").length;
  const maintenance = assets.filter((a) => a.status === "MAINTENANCE").length;
  const outOfService = assets.filter((a) => a.status === "OUT_OF_SERVICE").length;

  return {
    total,
    operational,
    maintenance,
    outOfService,
  };
}

export function flattenInventoryItems(inventory: VehicleInventoryResponse) {
  return inventory.compartments.flatMap((compartment) =>
    compartment.items.map((item) => ({
      ...item,
      compartmentName: compartment.name,
    }))
  );
}

export function countInventoryOkFromCompartments(compartments: VehicleCompartment[]) {
  const allItems = compartments.flatMap((c) => c.items);
  const ok = allItems.filter((i) => i.state === "OK").length;
  return { ok, total: allItems.length };
}