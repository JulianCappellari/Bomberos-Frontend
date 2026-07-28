export type InventoryItemState = "OK" | "REVIEW" | "OUT";

export interface VehicleInventoryItem {
  id: string;
  name: string;
  expectedQuantity: number;
  state: InventoryItemState;
  notes: string | null;
  compartmentId: string;
}

export interface VehicleCompartment {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  items: VehicleInventoryItem[];
}

export interface VehicleInventoryResponse {
  id: string;
  unitNumber: string;
  plate: string | null;
  mileage: number | null;
  asset: {
    id: string;
    name: string;
    status: string;
  };
  compartments: VehicleCompartment[];
}

export interface CreateVehicleCompartmentPayload {
  name: string;
  description?: string | null;
  sortOrder?: number;
}

export interface CreateInventoryItemPayload {
  name: string;
  expectedQuantity: number;
  state?: InventoryItemState;
  notes?: string | null;
}

export interface UpdateInventoryItemPayload {
  compartmentId?: string;
  name?: string;
  expectedQuantity?: number;
  state?: InventoryItemState;
  notes?: string | null;
}
