import { test } from "node:test";
import assert from "node:assert/strict";
import { formatOperationalDate } from "../src/lib/operational-dates.ts";
test("Las fechas de calendario no retroceden un dia al mostrarse en Argentina", () => {
  assert.equal(formatOperationalDate("2026-11-05T00:00:00.000Z", true), "5/11/2026");
  assert.equal(formatOperationalDate("2026-11-05", true), "5/11/2026");
});
test("Las horas reales usan el huso del cuartel y se controlan datos invalidos", () => {
  assert.match(formatOperationalDate("2026-11-05T02:00:00.000Z"), /4\/11\/2026/);
  assert.equal(formatOperationalDate(null), "Sin fecha");
  assert.equal(formatOperationalDate("no-fecha"), "Fecha invalida");
});
