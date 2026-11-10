import { UserRosterItem } from "./user";
export const equipmentCategories = { HELMET: "Casco", COAT: "Chaqueton", TROUSERS: "Pantalon", BOOTS: "Botas", GLOVES: "Guantes", HOOD: "Monja", OTHER: "Otro" } as const;
export type EquipmentCategory = keyof typeof equipmentCategories;
export type EquipmentCondition = "OK" | "REVIEW" | "OUT";
export type EquipmentIssue = { id: string; userId: string; issuedAt: string; returnedAt: string | null; issueNotes: string | null; returnNotes: string | null; returnCondition: EquipmentCondition | null; user: UserRosterItem; issuedBy: UserRosterItem; receivedBy?: UserRosterItem | null };
export type PersonalEquipment = {
  id: string; assetId: string; code: string; category: EquipmentCategory; size: string | null; revision: number; archivedAt: string | null;
  asset: { id: string; name: string; status: "OPERATIONAL" | "MAINTENANCE" | "OUT_OF_SERVICE" };
  assigned: boolean; available: boolean; blockingMaintenance: boolean; currentIssue: EquipmentIssue | null;
  checks: { id: string; condition: EquipmentCondition; checkedAt: string; notes: string; checkedBy: UserRosterItem }[];
};
export type EquipmentPage = { items: PersonalEquipment[]; total: number; page: number; pageSize: number };
export type EquipmentHistoryPage = { issues: EquipmentIssue[]; total: number; page: number; pageSize: number };
export type EquipmentRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED" | "CANCELLED";
export type EquipmentRequest = { id: string; userId: string; user: UserRosterItem; category: EquipmentCategory; size: string | null; reason: string; status: EquipmentRequestStatus; revision: number; createdAt: string; reviewedAt: string | null; reviewedBy: UserRosterItem | null; reviewNotes: string | null; fulfilledAt: string | null; fulfilledIssue: { id: string; issuedAt: string; equipment: { code: string; asset: { name: string } } } | null };
export type EquipmentRequestsPage = { items: EquipmentRequest[]; total: number; page: number; pageSize: number };
