import { z } from "zod";

export const inspectionDraftSchema = z.object({
  version: z.literal(1),
  savedAt: z.number().finite(),
  inventorySignature: z.string(),
  inspectionDate: z.string().date(),
  inspectionTime: z.string(),
  incidentType: z.enum(["", "FIRE", "RESCUE", "ACCIDENT", "CHEMICAL", "MEDICAL", "FLOOD", "OTHER"]),
  observations: z.string().max(10000),
  sectionComments: z.record(z.string(), z.string().max(2000)).default({}),
  foundLocations: z.record(z.string(), z.string().max(200)).default({}),
  responsibleUserIds: z.array(z.string()),
  leaderUserId: z.string(),
  results: z.record(z.string(), z.enum(["OK", "MISSING", "DAMAGED", "UNCHECKED"])),
  itemObservations: z.record(z.string(), z.string().max(4000)),
  observedQuantities: z.record(z.string(), z.number().int().min(0)),
  fluids: z.object({
    oil: z.enum(["", "OK", "LOW", "ADDED"]),
    coolant: z.enum(["", "OK", "LOW", "ADDED"]),
    fuel: z.enum(["", "FULL", "THREE_QUARTERS", "HALF", "QUARTER", "RESERVE"]),
  }).default({ oil: "", coolant: "", fuel: "" }),
});
export type InspectionDraft = z.infer<typeof inspectionDraftSchema>;

export function readInspectionDraft(raw: string | null): InspectionDraft | null {
  if (!raw) return null;
  try {
    const parsed = inspectionDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const age = Date.now() - parsed.data.savedAt;
    return age >= 0 && age < 24 * 60 * 60 * 1000 ? parsed.data : null;
  } catch { return null; }
}

export function inventorySignature(items: Array<{ id: string; expectedQuantity: number; compartmentName?: string }>) {
  return JSON.stringify(items.map((item) => [item.id, item.expectedQuantity, item.compartmentName || ""]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}
