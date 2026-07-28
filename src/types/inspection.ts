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
  inventoryItemId: string;
  result: InspectionResult;
  observations?: string | null;
}

export interface CreateInspectionPayload {
  vehicleId: string;
  incidentType?: AlertType;
  inspectionDate: string;
  inspectionTime?: string | null;
  observations?: string | null;
  items: InspectionItemPayload[];
}

export interface InspectionHistoryItem {
  id: string;
  inventoryItemId: string;
  expectedQuantity: number;
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
  id: string;
  incidentType: AlertType | null;
  inspectionDate: string;
  inspectionTime: string | null;
  observations: string | null;
  summaryOk: number;
  summaryMissing: number;
  summaryDamaged: number;
  summaryUnchecked: number;
  items: InspectionHistoryItem[];
}
