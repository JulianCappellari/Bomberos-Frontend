import test from "node:test";
import assert from "node:assert/strict";
import { canOpenPage, showNavigationItem } from "../src/lib/permissions.ts";
import { shiftAllowsSwap } from "../src/lib/shift-swap-window.ts";
import { auditAction, auditMetadata } from "../src/lib/audit-presentation.ts";
test("La delegacion solo abre su modulo y suboficial tiene gestion limitada", () => {
  assert(canOpenPage("/admin", "OPERATOR")); assert(!canOpenPage("/ranking", "OPERATOR")); assert(!canOpenPage("/command", "OPERATOR"));
  assert(!canOpenPage("/admin", "FIREFIGHTER", ["PPE", "TECHNICAL"]));
  assert(canOpenPage("/personal-equipment", "FIREFIGHTER", ["PPE"]));
  assert(canOpenPage("/air-equipment", "FIREFIGHTER", ["TECHNICAL"]));
  assert(!canOpenPage("/air-equipment", "FIREFIGHTER", ["PPE"]));
  assert(showNavigationItem("/air-equipment", "FIREFIGHTER", "Bombero", ["TECHNICAL"]));
});
test("El intercambio usa hora argentina y bloquea menos de 24 horas", () => {
  const start = Date.parse("2026-11-12T08:00:00-03:00");
  assert(shiftAllowsSwap("2026-11-12T00:00:00Z", "08:00", start - 86400000));
  assert(!shiftAllowsSwap("2026-11-12", "08:00", start - 86400000 + 1));
  assert(!shiftAllowsSwap("invalida", "08:00", start));
});
test("Las nuevas decisiones se explican en español sin codigos crudos", () => {
  for (const key of ["SHIFT_SWAP_APPROVED", "SPECIAL_PERMISSION_GRANTED", "INSPECTION_PARTICIPANT_REMOVED", "WORK_TRANSFER_REJECTED"]) assert.notEqual(auditAction(key), "Accion del sistema");
  assert(auditMetadata({ permission: "PPE", scope: "LOW" }).some(row => row.value === "Encargado de vestimenta y materiales"));
  assert(auditMetadata({ permission: "PPE", scope: "LOW" }).some(row => row.value === "Personal con puntaje bajo"));
});
