// Fluidos del movil que se registran en cada control vehicular.
export type FluidLevel = "OK" | "LOW" | "ADDED";
export type FuelLevel = "FULL" | "THREE_QUARTERS" | "HALF" | "QUARTER" | "RESERVE";
export type InspectionFluids = { oil: FluidLevel; coolant: FluidLevel; fuel: FuelLevel };

export const FLUID_OPTIONS: Array<{ value: FluidLevel; label: string }> = [
  { value: "OK", label: "OK" },
  { value: "LOW", label: "Bajo" },
  { value: "ADDED", label: "Se agregó" },
];
export const FUEL_OPTIONS: Array<{ value: FuelLevel; label: string }> = [
  { value: "FULL", label: "Lleno" },
  { value: "THREE_QUARTERS", label: "3/4" },
  { value: "HALF", label: "1/2" },
  { value: "QUARTER", label: "1/4" },
  { value: "RESERVE", label: "Reserva" },
];
export const fluidLabel = (v?: string | null) => FLUID_OPTIONS.find((o) => o.value === v)?.label ?? null;
export const fuelLabel = (v?: string | null) => FUEL_OPTIONS.find((o) => o.value === v)?.label ?? null;
/** Tono para mostrar el valor: lo que requiere atencion se resalta. */
export function fluidTone(v?: string | null): "ok" | "warn" | "bad" | "muted" {
  if (!v) return "muted";
  if (v === "LOW" || v === "QUARTER") return "warn";
  if (v === "RESERVE") return "bad";
  return "ok";
}
