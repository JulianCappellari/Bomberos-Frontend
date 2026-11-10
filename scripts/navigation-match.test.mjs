import test from "node:test";
import assert from "node:assert/strict";
import { isNavigationActive } from "../src/lib/navigation-match.ts";
test("Pedidos de vestimenta no activa el modulo de vehiculos por prefijo", () => {
  assert.equal(isNavigationActive("/equipment-requests", "/equipment"), false);
  assert.equal(isNavigationActive("/equipment-requests", "/personal-equipment"), true);
});
test("Subpaginas activan su modulo pero no rutas de nombre parecido", () => {
  assert.equal(isNavigationActive("/equipment/vehicle/history", "/equipment"), true);
  assert.equal(isNavigationActive("/alerts/new", "/alerts"), true);
  assert.equal(isNavigationActive("/alerts-other", "/alerts"), false);
  assert.equal(isNavigationActive("/dashboard-other", "/dashboard"), false);
});
