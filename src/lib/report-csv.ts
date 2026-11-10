export function csvCell(value: string | number) {
  const text = String(value);
  const protectedText = /^[=+\-@\t\r\n]/.test(text.trimStart()) ? "'" + text : text;
  return '"' + protectedText.replaceAll('"', '""') + '"';
}
export function reportCsv(rows: Array<{ name: string; rank: string; sessions: number; workedMinutes: number }>) {
  return "\uFEFF" + [
    ["Nombre", "Cargo", "Registros", "Minutos", "Horas"].map(csvCell).join(";"),
    ...rows.map((row) => [row.name, row.rank, row.sessions, row.workedMinutes, (row.workedMinutes / 60).toFixed(2)].map(csvCell).join(";")),
  ].join("\r\n");
}
