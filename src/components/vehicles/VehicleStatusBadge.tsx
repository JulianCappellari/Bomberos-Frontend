
import clsx from "clsx";

const styles = {
  OPERATIONAL: "bg-green-100 text-green-700 border-green-200",
  MAINTENANCE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  OUT_OF_SERVICE: "bg-red-100 text-red-700 border-red-200",
};

export function VehicleStatusBadge({ status }: { status: keyof typeof styles }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[status]
      )}
    >
      {status === "OPERATIONAL" && "Operativo"}
      {status === "MAINTENANCE" && "Mantenimiento"}
      {status === "OUT_OF_SERVICE" && "Fuera de servicio"}
    </span>
  );
}