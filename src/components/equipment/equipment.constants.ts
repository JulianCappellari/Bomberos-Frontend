import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Wrench,
  XCircle,
} from "lucide-react";
import { AssetStatus } from "@/types/asset";
import { InventoryItemState } from "@/types/equipment";
import { InspectionResult } from "@/types/inspection";

export const assetStatusMap: Record<
  AssetStatus,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  OPERATIONAL: {
    label: "Operativo",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: CheckCircle2,
  },
  MAINTENANCE: {
    label: "Mantenimiento",
    className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    icon: Wrench,
  },
  OUT_OF_SERVICE: {
    label: "Fuera de servicio",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: XCircle,
  },
};

export const inventoryStateMap: Record<
  InventoryItemState,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  OK: {
    label: "En condiciones",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: CheckCircle2,
  },
  REVIEW: {
    label: "Revisar",
    className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    icon: AlertTriangle,
  },
  OUT: {
    label: "Fuera",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: XCircle,
  },
};

export const inspectionResultMap: Record<
  InspectionResult,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  OK: {
    label: "OK",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: CheckCircle2,
  },
  MISSING: {
    label: "Faltante",
    className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    icon: Clock3,
  },
  DAMAGED: {
    label: "Dañado",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: XCircle,
  },
  UNCHECKED: {
    label: "No revisado",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    icon: Clock3,
  },
};

