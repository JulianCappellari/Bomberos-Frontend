// Textos de estados en castellano: la interfaz nunca debe mostrar codigos internos (HIGH, OUT_OF_SERVICE...).
export const priorityLabels: Record<string, string> = { HIGH: "Prioridad alta", MEDIUM: "Prioridad media", LOW: "Prioridad baja" };
export const priorityShort: Record<string, string> = { HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" };
export const alertTypeLabels: Record<string, string> = { FIRE: "Incendio", RESCUE: "Rescate", ACCIDENT: "Accidente", CHEMICAL: "Riesgo químico", MEDICAL: "Emergencia médica", FLOOD: "Inundación / clima", OTHER: "Otra emergencia" };
export const alertStatusLabels: Record<string, string> = { ACTIVE: "Activa", RESOLVED: "Resuelta", CANCELLED: "Cancelada" };
export const assetStatusLabels: Record<string, string> = { OPERATIONAL: "Operativo", MAINTENANCE: "En mantenimiento", OUT_OF_SERVICE: "Fuera de servicio" };

export const recordStatusLabels: Record<string, string> = { OPEN: "Abierta", CLOSED: "Cerrada", ASSIGNED: "Asignada", SUBMITTED: "En revisión", VERIFIED: "Verificada", RETURNED: "Devuelta", CANCELLED: "Cancelada", PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada" };

export function label(map: Record<string, string>, value?: string | null, fallback = "Sin dato") {
  if (!value) return fallback;
  return map[value] ?? value;
}

export function firstName(fullName?: string | null, username?: string | null) {
  const clean = (fullName || "").replace(/^\[DEMO\]\s*/i, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  // Omite grados al inicio ("Bombero", "Sargento 1º", "Oficial Principal") para saludar por el nombre.
  const ranks = new Set(["bombero", "bombera", "sargento", "cabo", "oficial", "suboficial", "principal", "inspector", "comisario", "comandante", "mayor", "aspirante", "1º", "2º", "ayudante", "subayudante"]);
  const name = words.find((word) => !ranks.has(word.toLocaleLowerCase()));
  return name || username || "";
}
