import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
function worker() {
  const handlers = {}, shown = [], opened = [];
  const self = { location: { origin: "https://cuartel.example" }, registration: { showNotification: async (title, options) => shown.push({ title, options }) }, clients: { matchAll: async () => [], openWindow: async target => opened.push(target) }, addEventListener: (type, fn) => { handlers[type] = fn; } };
  vm.runInNewContext('const BUILD_VERSION="test";\n' + readFileSync(new URL("./service-worker.template.js", import.meta.url), "utf8"), { self, URL, Date });
  async function push(payload) { let work; handlers.push({ data: { json: () => payload }, waitUntil: task => { work = task; } }); await work; }
  return { handlers, shown, opened, push };
}
test("push worker shows the server text, trimmed, and never opens external links", async () => {
  const w = worker();
  await w.push({ version: 1, id: "notice-1", alert: true, priority: "HIGH", expiresAt: Date.now() + 60000, title: "Incendio · prioridad alta", body: "Belgrano 1250 · Respondé si vas.\u0007", href: "https://evil.example" });
  assert.equal(w.shown.length, 1); assert.equal(w.shown[0].options.tag, "bomberos-notice-1");
  assert.equal(w.shown[0].title, "Incendio · prioridad alta"); assert.equal(w.shown[0].options.body, "Belgrano 1250 · Respondé si vas.");
  assert.equal(w.shown[0].options.data.href, "/alerts"); assert.equal(w.shown[0].options.requireInteraction, true);
  await w.push({ version: 1, id: "notice-2", alert: false, expiresAt: Date.now() + 60000, title: "x".repeat(300), body: "Detalle", href: "//evil.example/x" });
  assert.equal(w.shown[1].title.length, 80); assert.equal(w.shown[1].options.data.href, "/notifications");
  await w.push({ version: 1, id: "notice-3", alert: false, expiresAt: Date.now() + 60000, title: "Tu pedido fue entregado", href: "/supplies?tab=requests" });
  assert.equal(w.shown[2].options.data.href, "/supplies?tab=requests");
});
// iPhone da de baja la suscripcion si un push no muestra aviso: los mensajes raros muestran uno generico, nunca una emergencia.
test("push worker shows only a neutral notice for malformed and unknown-version messages", async () => {
  const w = worker(); for (const data of [null, { version: 2 }]) await w.push(data);
  assert.equal(w.shown.length, 2);
  for (const shown of w.shown) { assert.equal(shown.title, "Bomberos: tiene un aviso"); assert.equal(shown.options.data.href, "/notifications"); assert.notEqual(shown.options.requireInteraction, true); }
});
test("expired messages still display a neutral notice, never a current emergency", async () => {
  const w = worker(); await w.push({ version: 1, id: "x", expiresAt: 1, alert: true, priority: "HIGH" });
  assert.equal(w.shown[0].title, "Bomberos: aviso anterior"); assert.equal(w.shown[0].options.requireInteraction, false);
  assert.equal(w.shown[0].options.data.href, "/notifications");
});
test("notification click opens only a known same-origin route and never acknowledges reading", async () => {
  const w = worker(); let work, closed = false;
  w.handlers.notificationclick({ notification: { data: { href: "https://evil.example" }, close: () => { closed = true; } }, waitUntil: task => { work = task; } }); await work;
  assert(closed); assert.equal(w.opened[0], "https://cuartel.example/notifications");
});
