export function formatOperationalDate(value: string | null | undefined, dateOnly = false) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Fecha invalida";
  return dateOnly ? parsed.toLocaleDateString("es-AR", { timeZone: "UTC" }) : parsed.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}
