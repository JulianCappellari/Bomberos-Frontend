import { Asset } from "./asset";

export type ComplianceSubjectType = "USER" | "ASSET";
export type ComplianceCategory =
  | "TRAINING"
  | "CERTIFICATION"
  | "MEDICAL_EXAM"
  | "DRIVER_LICENSE"
  | "INSURANCE"
  | "VTV"
  | "SERVICE"
  | "SCBA_SERVICE"
  | "OTHER";
export type ComplianceStatus = "VALID" | "DUE_SOON" | "EXPIRED" | "NO_EXPIRY";

export type ComplianceRecord = {
  id: string;
  subjectType: ComplianceSubjectType;
  userId: string | null;
  assetId: string | null;
  category: ComplianceCategory;
  title: string;
  issuer: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  warningDays: number;
  documentUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  status: ComplianceStatus;
  daysRemaining: number | null;
  subjectName: string;
  user: {
    id: string;
    username: string;
    profile: { fullName: string; rank: string; badge: string } | null;
  } | null;
  asset: Pick<Asset, "id" | "name" | "assetType" | "status"> & {
    vehicle?: { unitNumber: string; plate: string | null } | null;
  } | null;
};

export type ComplianceInput = {
  subjectType: ComplianceSubjectType;
  userId?: string;
  assetId?: string;
  category: ComplianceCategory;
  title: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
  warningDays: number;
  documentUrl?: string;
  notes?: string;
};

export type ComplianceQuery = Partial<{
  subjectType: ComplianceSubjectType;
  category: ComplianceCategory;
  status: ComplianceStatus;
  userId: string;
  assetId: string;
  q: string;
}>;

export type ComplianceSummary = {
  total: number;
  valid: number;
  dueSoon: number;
  expired: number;
  noExpiry: number;
  critical: ComplianceRecord[];
};
