const BUILD_VERSION = "b677cb4c6fcb2037";
/* Version is injected by prepare-release.mjs. Never cache API or private HTML. */
const CACHE = `bomberos-public-${BUILD_VERSION}`;
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/offline.html", "/app-icon-192.png", "/app-icon-512.png"]))); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("bomberos-public-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("message", (event) => { if (event.data === "ACTIVATE_UPDATE") self.skipWaiting(); });
self.addEventListener("push", (event) => {
  let data;
  try { data = event.data?.json(); } catch { data = null; }
  // iPhone da de baja la suscripcion si un push no muestra aviso: ante datos raros se muestra uno generico.
  if (!data || data.version !== 1 || typeof data.id !== "string" || typeof data.expiresAt !== "number") {
    event.waitUntil(self.registration.showNotification("Bomberos: tiene un aviso", { body: "Abra la aplicacion para consultarlo.", icon: "/app-icon-192.png", badge: "/notification-badge.png", data: { href: "/notifications" } }));
    return;
  }
  const expired = data.expiresAt <= Date.now(), alert = data.alert === true, urgent = !expired && alert && data.priority === "HIGH";
  // El servidor arma el texto segun el tipo de aviso; aca solo se limpia y se recorta.
  const text = (value, max) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
  const route = typeof data.href === "string" && data.href.startsWith("/") && !data.href.startsWith("//") ? data.href.slice(0, 200) : null;
  const title = expired ? "Bomberos: aviso anterior" : text(data.title, 80) || (urgent ? "Alerta operativa prioritaria" : alert ? "Nueva alerta operativa" : "Bomberos: tiene un aviso");
  const body = expired ? "Consulte el historial actualizado en la aplicacion." : text(data.body, 180) || "Abra la aplicacion para consultar los detalles.";
  event.waitUntil(self.registration.showNotification(title, {
    body, icon: "/app-icon-192.png", badge: "/notification-badge.png", vibrate: urgent ? [300, 120, 300, 120, 600] : [200],
    tag: `bomberos-${data.id}`, renotify: false, requireInteraction: urgent,
    data: { href: expired ? "/notifications" : alert ? "/alerts" : route || "/notifications" },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Solo rutas propias de la app (nunca enlaces externos).
  const raw = event.notification.data?.href;
  const href = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/notifications";
  const target = new URL(href, self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin && "focus" in client) {
        try { await client.navigate(target); return await client.focus(); } catch { /* Try another window or open a new one. */ }
      }
    }
    return self.clients.openWindow(target);
  }));
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (event.request.mode === "navigate") { event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html"))); return; }
  if (url.pathname.startsWith("/_next/static/") || ["/app-icon-192.png", "/app-icon-512.png"].includes(url.pathname)) event.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(event.request); if (hit) return hit;
    const response = await fetch(event.request); if (response.ok) { await cache.put(event.request, response.clone()); const keys = await cache.keys(); if (keys.length > 250) await cache.delete(keys[0]); } return response;
  }));
});
