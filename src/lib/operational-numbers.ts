export function decimalUnits(value: string, precision: number): number | null {
  const text = value.trim();
  if (!new RegExp(`^\\d{1,8}([.,]\\d{1,${precision}})?$`).test(text)) return null;
  const [whole, fraction = ""] = text.replace(",", ".").split(".");
  const result = Number(whole) * 10 ** precision + Number(fraction.padEnd(precision, "0"));
  return Number.isSafeInteger(result) ? result : null;
}
