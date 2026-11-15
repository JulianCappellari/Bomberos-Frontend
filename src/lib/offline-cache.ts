"use client";
import { dehydrate, hydrate, QueryClient } from "@tanstack/react-query";

// La lectura sin conexión conserva únicamente las consultas públicas permitidas.
// El caché pertenece a la sesión local y se borra al cerrarla.
const LEGACY_KEY = "bomberos:query-cache:v1";
const KEY = "bomberos:query-cache:v2";
const USER_KEY = "bomberos_user";
const MAX_BYTES = 1_500_000;
const MAX_AGE = 3 * 86_400_000;
const PUBLIC_QUERY_KEYS = new Set(["public-post", "public-posts", "fire-risk"]);

function currentUserId() {
  try { return (JSON.parse(localStorage.getItem(USER_KEY) || "null") as { id?: string } | null)?.id ?? null; } catch { return null; }
}

export function restoreOfflineCache(client: QueryClient) {
  try {
    localStorage.removeItem(LEGACY_KEY);
    const raw = localStorage.getItem(KEY); if (!raw) return;
    const saved = JSON.parse(raw) as { userId: string; savedAt: number; state: unknown };
    if (!saved.userId || saved.userId !== currentUserId() || Date.now() - saved.savedAt > MAX_AGE) { localStorage.removeItem(KEY); return; }
    hydrate(client, saved.state);
  } catch { try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } }
}

export function persistOfflineCache(client: QueryClient) {
  let timer: number | null = null;
  const save = () => {
    timer = null;
    const userId = currentUserId(); if (!userId) return;
    try {
      const state = dehydrate(client, {
        shouldDehydrateMutation: () => false,
        shouldDehydrateQuery: (query) => query.state.status === "success" && PUBLIC_QUERY_KEYS.has(String(query.queryKey[0])),
      });
      const raw = JSON.stringify({ userId, savedAt: Date.now(), state });
      if (raw.length <= MAX_BYTES) localStorage.setItem(KEY, raw);
    } catch { /* almacenamiento lleno o bloqueado: la app sigue funcionando en linea */ }
  };
  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" || event.action.type !== "success") return;
    if (timer === null) timer = window.setTimeout(save, 3000);
  });
  return () => { unsubscribe(); if (timer !== null) window.clearTimeout(timer); };
}

export function clearOfflineCache() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch { /* sin almacenamiento */ }
}

export function offlineCacheSavedAt() {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as { savedAt: number }).savedAt : null; } catch { return null; }
}
