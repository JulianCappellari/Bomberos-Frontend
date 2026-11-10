export function expenseState(row: { status: string; debtCents: number; paidCents: number }) {
  if (row.status === "PENDING") return "Por revisar";
  if (row.status === "REJECTED") return "Rechazado";
  if (row.status === "APPROVED" && row.debtCents === 0) return "Pagado";
  return row.paidCents > 0 ? "Pago parcial" : "Pendiente de pago";
}
export function financeDate(value: string) { return value.slice(0, 10).split("-").reverse().join("/"); }
