export type AssetStatus = "OPERATIONAL" | "MAINTENANCE" | "OUT_OF_SERVICE";
export const vehicleKinds = { UNCLASSIFIED: "Sin clasificar", ENGINE: "Autobomba", TANKER: "Cisterna", RESCUE: "Rescate", AMBULANCE: "Ambulancia", SUPPORT: "Apoyo", OTHER: "Otro" } as const;
export type VehicleKind = keyof typeof vehicleKinds;
export type AssetType = "VEHICLE" | "PPE" | "OTHER";

export interface Vehicle {
  kind?: VehicleKind;
  licenseCategory?: string;
  id: string;
  assetId: string;
  unitNumber: string;
  plate: string | null;
  year: number | null;
  mileage: number | null;
  nextOilChangeMileage: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  assetType: AssetType;
  status: AssetStatus;
  notes: string | null;
  lastCheckDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  vehicle?: Vehicle | null;
}

export interface UpdateAssetPayload {
  name?: string;
  assetType?: AssetType;
  status?: AssetStatus;
  notes?: string | null;
  lastCheckDate?: string | null;
}

export interface UpsertVehiclePayload {
  kind?: VehicleKind;
  licenseCategory?: string;
  unitNumber?: string;
  plate?: string | null;
  year?: number;
  mileage?: number;
  nextOilChangeMileage?: number;
}

export interface CreateAssetPayload {
  name: string;
  assetType: AssetType;
  status?: AssetStatus;
  notes?: string | null;
  lastCheckDate?: string | null;
  vehicle?: {
    kind?: VehicleKind;
    licenseCategory?: string;
    unitNumber: string;
    plate?: string | null;
    year?: number;
    mileage?: number;
    nextOilChangeMileage?: number;
  };
}
