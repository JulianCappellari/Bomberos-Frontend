import { Asset } from "@/types/asset";
import { VehicleCompartment, VehicleInventoryResponse } from "@/types/equipment";
import { formatOperationalDate } from "@/lib/operational-dates";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: string | null | undefined) {
  return formatOperationalDate(date, true);
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
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const ok = allItems.filter((i) => i.state === "OK" && (!i.expiresOn || i.expiresOn.slice(0, 10) >= today)).length;
  return { ok, total: allItems.length };
}
