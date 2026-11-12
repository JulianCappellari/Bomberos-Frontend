export type InventoryItemState = "OK" | "REVIEW" | "OUT";

export interface VehicleInventoryItem {
  revision: number;
  labelCode?: string | null;
  expiresOn?: string | null;
  inspectionItems?: Array<{ expectedQuantity: number; observedQuantity: number; result: string; observations: string | null }>;
  id: string;
  name: string;
  expectedQuantity: number;
  state: InventoryItemState;
  notes: string | null;
  compartmentId: string;
}

export interface VehicleCompartment {
  revision: number;
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
  fuelType?: string | null;
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
  labelCode?: string | null;
  expiresOn?: string | null;
  name: string;
  expectedQuantity: number;
  state?: InventoryItemState;
  notes?: string | null;
}

export interface UpdateInventoryItemPayload {
  revision: number;
  labelCode?: string | null;
  expiresOn?: string | null;
  compartmentId?: string;
  name?: string;
  expectedQuantity?: number;
  state?: InventoryItemState;
  notes?: string | null;
}
