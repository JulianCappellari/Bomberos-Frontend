import assert from "node:assert/strict";
import test from "node:test";
import { parseTaskOutbox } from "../src/lib/task-outbox.ts";
const item = { id: "1e81b729-e0a3-4d3b-9bb9-2dfb709107cd", taskId: "task1", title: "Tarea", route: "submit", body: { revision: 2, notes: "Trabajo realizado", completedAt: "2026-01-01T10:00:00Z", evidenceUrls: [] }, savedAt: 1, conflict: false };
test("La bandeja sin conexion conserva revision y no admite rutas arbitrarias", () => {
  assert.equal(parseTaskOutbox(JSON.stringify([item]))[0].body.revision, 2);
  assert.deepEqual(parseTaskOutbox(JSON.stringify([{ ...item, route: "/users" }])), []);
  assert.deepEqual(parseTaskOutbox("{"), []);
});
test("La bandeja rechaza acciones incompletas, evidencia insegura y cantidades excesivas", () => {
  assert.deepEqual(parseTaskOutbox(JSON.stringify([{ ...item, body: { revision: 1, notes: "Completo" } }])), []);
  assert.deepEqual(parseTaskOutbox(JSON.stringify([{ ...item, body: { ...item.body, evidenceUrls: ["javascript:alert(1)"] } }])), []);
  assert.deepEqual(parseTaskOutbox(JSON.stringify(Array.from({ length: 51 }, () => item))), []);
});
