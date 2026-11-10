import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(new URL("../src/data/gre2024-index.json", import.meta.url), "utf8"));
test("Indice GRE conserva identificadores, variantes y paginas de la fuente", () => {
  assert.equal(data.entries.length, 2661); assert.equal(data.sha256.length, 64);
  assert(data.entries.every((e) => /^\d{4}$/.test(e.id) && /^1\d{2}P?$/.test(e.guide) && e.pdfPage >= 33 && e.pdfPage <= 93 && !e.name.includes("Nombre del Material")));
  assert(data.entries.some((e) => e.id === "1203" && e.guide === "128"));
  assert.deepEqual([...new Set(data.entries.filter((e) => e.id === "1057").map((e) => e.guide))].sort(), ["115", "128"]);
});
