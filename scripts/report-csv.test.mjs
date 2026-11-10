import assert from "node:assert/strict";
import { test } from "node:test";
import { csvCell, reportCsv } from "../src/lib/report-csv.ts";
test("CSV neutraliza formulas de planilla en nombres importados", () => {
  assert.equal(csvCell("=1+1"), `"'=1+1"`);
  assert.equal(csvCell(" @SUM(A1)"), `"' @SUM(A1)"`);
});
test("CSV conserva comillas y separadores dentro de campos", () => {
  assert.equal(csvCell('Nombre "Apellido";otro'), '"Nombre ""Apellido"";otro"');
  const csv = reportCsv([{ name: "Persona", rank: "Bombero", sessions: 2, workedMinutes: 90 }]);
  assert(csv.startsWith("\uFEFF"));
  assert(csv.includes('"1.50"'));
});
