import test from "node:test";
import assert from "node:assert/strict";
import { auditAction, auditEntity, auditMetadata, auditDate } from "../src/lib/audit-presentation.ts";
import { groupMessageReceipts } from "../src/lib/message-receipts.ts";
import { expenseState } from "../src/lib/finance-presentation.ts";
test("La auditoria traduce campos y valores anidados sin recortar evidencia", () => {
  const note = "Observacion extensa ".repeat(40);
  const rows = auditMetadata({ changes: [{ field: "isActive", before: true, after: false }, { field: "role", before: "FIREFIGHTER", after: "GUARD" }], amountCents: 12345, note, before: { status: "PENDING" }, passwordHash: "no-exponer" });
  assert(rows.some(r => r.label.includes("Cuenta activa") && r.value === "No"));
  assert(rows.some(r => r.value === "Bombero o aspirante"));
  assert(rows.some(r => r.value === "Guardia"));
  assert(rows.some(r => r.value === "Pendiente"));
  assert(rows.some(r => r.value.includes("123,45")));
  assert(rows.some(r => r.value === note));
  assert(!JSON.stringify(rows).includes("no-exponer"));
  assert.equal(auditDate("2026-11-10"), "10/11/2026");
  assert.equal(auditEntity("ExpenseClaim"), "Gasto y reintegro");
  assert.equal(auditAction("EXPENSE_PAYMENT_RECORDED"), "Pago parcial o total de reintegro registrado");
});
test("Cada lector aparece una vez por version, sin contar firmas antiguas como actuales", () => {
  const user = { id: "u1", username: "demo", profile: null };
  const rows = [{ id: "1", userId: "u1", user, contentHash: "old", bodySnapshot: "Texto anterior", acknowledgedAt: "2026-11-09T10:00:00Z" }, { id: "2", userId: "u1", user, contentHash: "new", bodySnapshot: "Texto actual", acknowledgedAt: "2026-11-10T10:00:00Z" }];
  const grouped = groupMessageReceipts([...rows, { ...rows[1], id: "3", acknowledgedAt: "2026-11-10T11:00:00Z" }], "new");
  assert.equal(grouped.current.length, 1); assert.equal(grouped.current[0].id, "3");
  assert.equal(grouped.previous.length, 1); assert.equal(grouped.previous[0].readers.length, 1);
  assert.equal(groupMessageReceipts(rows, "unread-version").current.length, 0);
});
test("Los estados financieros distinguen deuda parcial de pago completo", () => {
  assert.equal(expenseState({ status: "PENDING", paidCents: 0, debtCents: 0 }), "Por revisar");
  assert.equal(expenseState({ status: "APPROVED", paidCents: 5000, debtCents: 5000 }), "Pago parcial");
  assert.equal(expenseState({ status: "APPROVED", paidCents: 10000, debtCents: 0 }), "Pagado");
});
