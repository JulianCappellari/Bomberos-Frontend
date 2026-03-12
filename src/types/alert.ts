export type AlertPriority = "HIGH" | "MEDIUM" | "LOW";
export type AlertStatus = "ACTIVE" | "RESOLVED";

export type Alert = {
  id: string;
  title: string;
  type: string;
  description: string;
  location: string;
  phone?: string | null;
  priority: AlertPriority;
  status: AlertStatus;
  createdAt: string;
  resolvedAt: string | null;
};

export type CreateAlertPayload = {
  title?: string;
  type: "FIRE" | "RESCUE" | "ACCIDENT" | "CHEMICAL" | "MEDICAL" | "FLOOD" | "OTHER";
  description?: string;
  location: string;
  contactPhone?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};