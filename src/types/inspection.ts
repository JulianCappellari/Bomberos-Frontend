import type { InspectionFluids } from "@/lib/vehicle-fluids";
export type InspectionResult = "OK" | "MISSING" | "DAMAGED" | "UNCHECKED";
export type AlertType =
  | "FIRE"
  | "RESCUE"
  | "ACCIDENT"
  | "CHEMICAL"
  | "MEDICAL"
  | "FLOOD"
  | "OTHER";

export interface InspectionItemPayload {
  foundElsewhere?: boolean;
  foundLocation?: string | null;
  inventoryItemId: string;
  observedQuantity: number;
  result: Exclude<InspectionResult, "UNCHECKED">;
  observations?: string | null;
}

export interface CreateInspectionPayload {
  draftId?: string;
  sectionComments?: Array<{ compartmentId: string; observations: string }>;
  vehicleId: string;
  incidentType?: AlertType;
  inspectionDate: string;
  inspectionTime?: string | null;
  observations?: string | null;
  leaderUserId: string;
  responsibleUserIds: string[];
  fluids?: InspectionFluids;
  items: InspectionItemPayload[];
}

export interface InspectionHistoryItem {
  foundElsewhere?: boolean;
  foundLocation?: string | null;
  id: string;
  inventoryItemId: string;
  expectedQuantity: number;
  observedQuantity: number;
  result: InspectionResult;
  observations: string | null;
  inventoryItem?: {
    id: string;
    name: string;
    compartment?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface InspectionHistoryEntry {
  createdAt?: string;
  createdByUserId?: string;
  confirmationsComplete?: boolean;
  repairTaskId?: string | null;
  revision?: number;
  amendment?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  id: string;
  incidentType: AlertType | null;
  inspectionDate: string;
  inspectionTime: string | null;
  observations: string | null;
  oilLevel?: string | null;
  coolantLevel?: string | null;
  fuelLevel?: string | null;
  resultingAssetStatus: "OPERATIONAL" | "MAINTENANCE" | "OUT_OF_SERVICE" | null;
  leader?: { id: string; username: string; profile?: { fullName: string; rank: string } | null } | null;
  responsibles: Array<{
    confirmedAt?: string | null;
    id: string;
    user: { id: string; username: string; profile?: { fullName: string; rank: string } | null };
  }>;
  summaryOk: number;
  summaryMissing: number;
  summaryDamaged: number;
  summaryUnchecked: number;
  items: InspectionHistoryItem[];
}
