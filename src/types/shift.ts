import { UserRosterItem } from "@/types/user";

export type ShiftAssignment = {
  id: string;
  shiftId: string;
  userId: string;
  assignedAt: string;
  user: UserRosterItem;
};

export type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  notes: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  assignments: ShiftAssignment[];
};

export type CreateShiftPayload = {
  date: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  notes?: string;
  assignedUserIds?: string[];
};
