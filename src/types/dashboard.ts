import { AlertPriority, AlertStatus } from "./alert";
import { AssetStatus } from "./asset";

export type VehicleControlReadiness =
  | "OK"
  | "ISSUES"
  | "OVERDUE"
  | "DUE_SOON"
  | "NO_CONTROL";

export type DashboardAlert = {
  id: string;
  title: string;
  type: string;
  priority: AlertPriority;
  status: AlertStatus | "CANCELLED";
  location: string;
  description: string;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    fullName: string | null;
  };
  responsesCount: number;
};

export type DashboardShiftSummary = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  notes: string | null;
  assignedCount: number;
  assignments: Array<{
    id: string;
    user: {
      id: string;
      username: string;
      role: "ADMIN" | "FIREFIGHTER" | "OPERATOR" | "GUARD";
      fullName: string | null;
      rank: string | null;
      badge: string | null;
    };
  }>;
};

export type OperationalWarning = {
  code:
    | "NO_SHIFT_TODAY"
    | "SHIFT_WITHOUT_STAFF"
    | "ACTIVE_ALERT_WITHOUT_RESPONSES"
    | "VEHICLE_CONTROLS_ATTENTION"
    | "COMPLIANCE_ATTENTION";
  severity: "HIGH" | "MEDIUM";
  message: string;
  href: string;
};

export type DashboardSummary = {
  attendance: {
    totalMinutes: number;
    totalHours: number;
    totalHoursFormatted: string;
    totalAttendances: number;
    currentMonthMinutes: number;
    currentMonthFormatted: string;
    creditedMonthFormatted?: string;
    creditedMonthMinutes?: number;
    isCurrentlyInside: boolean;
  };
  myOpenAttendance: {
    id: string;
    checkInAt: string | null;
    station: {
      id: string;
      name: string;
    };
  } | null;
  activeAlerts: number;
  myUpcomingShifts: DashboardShiftSummary[];
  recentAlerts: DashboardAlert[];
  ops: {
    openIncidents: number;
    inStation: number;
    activeUsers: number;
    pendingApplications: number;
    todayShifts: DashboardShiftSummary[];
    operationalWarnings: OperationalWarning[];
    vehicles: {
      total: number;
      operational: number;
      maintenance: number;
      outOfService: number;
    };
    vehiclesNeedingAttention: Array<{
      id: string;
      name: string;
      status: AssetStatus;
      unitNumber: string | null;
      plate: string | null;
      updatedAt: string;
    }>;
    vehicleControls: {
      intervalDays: number;
      dueSoonDays: number;
      ok: number;
      withIssues: number;
      overdue: number;
      dueSoon: number;
      withoutControl: number;
      items: Array<{
        vehicleId: string;
        vehicleAssetId: string;
        name: string;
        status: AssetStatus;
        unitNumber: string;
        plate: string | null;
        readiness: VehicleControlReadiness;
        lastInspectionAt: string | null;
        nextDueAt: string | null;
        daysSinceLastControl: number | null;
        summaryMissing: number;
        summaryDamaged: number;
        summaryUnchecked: number;
      }>;
    };
    recentInspections: Array<{
      id: string;
      vehicleAssetId: string;
      vehicleName: string;
      inspectionDate: string;
      inspectionTime: string | null;
      summaryOk: number;
      summaryMissing: number;
      summaryDamaged: number;
      summaryUnchecked: number;
    }>;
    recentActivity: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      createdAt: string;
      actor: {
        id: string;
        username: string;
        fullName: string | null;
      } | null;
    }>;
  } | null;
};
