import { AlertPriority } from "./alert";
import { AssetStatus } from "./asset";

export type OperationalReadinessStatus = "READY" | "LIMITED" | "NOT_READY";

export type OperationalReadiness = {
  generatedAt: string;
  status: OperationalReadinessStatus;
  recommendedCrewSize: number;
  blockingReasons: string[];
  warnings: string[];
  personnel: {
    presentCount: number;
    commandPresentCount: number;
    items: Array<{
      attendanceId: string;
      userId: string;
      username: string;
      fullName: string;
      rank: string | null;
      badge: string | null;
      checkInAt: string;
      checkInTrust: "HIGH" | "MEDIUM" | "REJECTED" | null;
      station: {
        id: string;
        name: string;
      };
      isCommand: boolean;
    }>;
  };
  shifts: {
    activeShiftId: string | null;
    items: Array<{
      id: string;
      shiftType: string;
      startTime: string;
      endTime: string;
      phase: "UPCOMING" | "ACTIVE" | "FINISHED";
      assignedCount: number;
      presentAssignedCount: number;
      coveragePercent: number;
      assignments: Array<{
        userId: string;
        fullName: string;
        rank: string | null;
        isPresent: boolean;
      }>;
    }>;
  };
  vehicles: {
    total: number;
    readyCount: number;
    items: Array<{
      vehicleId: string;
      vehicleAssetId: string;
      name: string;
      unitNumber: string;
      plate: string | null;
      status: AssetStatus;
      ready: boolean;
      blockers: string[];
      lastInspectionAt: string | null;
      controlExpiresAt: string | null;
    }>;
  };
  alerts: {
    activeCount: number;
    items: Array<{
      id: string;
      type: string;
      priority: AlertPriority;
      location: string;
      createdAt: string;
      goingCount: number;
      presentResponderCount: number;
    }>;
  };
};
