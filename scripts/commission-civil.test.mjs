import test from "node:test";
import assert from "node:assert/strict";
import { canOpenPage, isCivilRank, showNavigationItem } from "../src/lib/permissions.ts";

// La Comision Directiva es civil: consulta finanzas e informacion general, no opera como bombero.
test("la Comisión Directiva ve su apartado y no las pantallas de bombero", () => {
  assert.equal(isCivilRank("Comisión directiva"), true);
  for (const path of ["/attendance", "/alerts", "/tasks", "/calendar", "/incidents", "/vehicle-control", "/dashboard", "/supplies", "/station"]) {
    assert.equal(canOpenPage(path, "FIREFIGHTER", [], "Comision directiva"), false, path);
    assert.equal(showNavigationItem(path, "FIREFIGHTER", "Comision directiva", []), false, path);
  }
  for (const path of ["/commission", "/chat", "/agenda", "/documents", "/expenses", "/me"]) assert.equal(canOpenPage(path, "FIREFIGHTER", [], "Comision directiva"), true, path);
  assert.equal(showNavigationItem("/commission", "FIREFIGHTER", "Comision directiva", []), true);
});
test("un bombero sigue viendo sus pantallas y no la de la Comisión", () => {
  assert.equal(canOpenPage("/attendance", "FIREFIGHTER", [], "Bombero"), true);
  assert.equal(showNavigationItem("/commission", "FIREFIGHTER", "Bombero", []), false);
});
