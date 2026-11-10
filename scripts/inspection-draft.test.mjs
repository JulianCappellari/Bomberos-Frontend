import assert from "node:assert/strict";
import { test } from "node:test";
import { inventorySignature, readInspectionDraft } from "../src/lib/inspection-draft.ts";

const draft = () => ({
  version: 1, savedAt: Date.now(), inventorySignature: "inventory",
  inspectionDate: "2026-11-04", inspectionTime: "12:00", incidentType: "",
  observations: "", responsibleUserIds: ["user"], leaderUserId: "user",
  results: { hose: "OK" }, itemObservations: {}, observedQuantities: { hose: 2 },
});
test("Recupera el progreso de un control valido", () => {
  assert.equal(readInspectionDraft(JSON.stringify(draft()))?.observedQuantities.hose, 2);
});
test("Recupera comentarios por seccion y admite borradores anteriores", () => {
  assert.deepEqual(readInspectionDraft(JSON.stringify(draft()))?.sectionComments, {});
  assert.equal(readInspectionDraft(JSON.stringify({ ...draft(), sectionComments: { cabina: "Revisar soporte" } }))?.sectionComments.cabina, "Revisar soporte");
  assert.equal(readInspectionDraft(JSON.stringify({ ...draft(), sectionComments: { cabina: "x".repeat(2001) } })), null);
});
test("Ignora borradores corruptos o con cantidades invalidas", () => {
  assert.equal(readInspectionDraft("{error"), null);
  assert.equal(readInspectionDraft(JSON.stringify({ ...draft(), observedQuantities: { hose: -1 } })), null);
});
test("Los borradores vencen a las 24 horas", () => {
  assert.equal(readInspectionDraft(JSON.stringify({ ...draft(), savedAt: Date.now() - 86_400_001 })), null);
});
test("No recupera borradores con fecha futura o version desconocida", () => {
  assert.equal(readInspectionDraft(JSON.stringify({ ...draft(), savedAt: Date.now() + 100000 })), null);
  assert.equal(readInspectionDraft(JSON.stringify({ ...draft(), version: 2 })), null);
});
test("Cambiar la cantidad esperada invalida el inventario del borrador", () => {
  assert.notEqual(inventorySignature([{ id: "hose", expectedQuantity: 1 }]), inventorySignature([{ id: "hose", expectedQuantity: 2 }]));
});
test("Reordenar los materiales conserva la compatibilidad", () => {
  const items = [{ id: "hose", expectedQuantity: 2 }, { id: "pump", expectedQuantity: 1 }];
  assert.equal(inventorySignature(items), inventorySignature([...items].reverse()));
});
