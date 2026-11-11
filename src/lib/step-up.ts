"use client";
// Confirmacion de contrasena para acciones criticas. El servidor responde 428 y la app pide la contrasena
// en una ventana; con la confirmacion (valida 5 minutos para esta sesion) se reintenta la accion sola.
type Handler = () => Promise<string | null>;
let handler: Handler | null = null;
let cached: { token: string; until: number } | null = null;
let pending: Promise<string | null> | null = null;

export function registerStepUpHandler(next: Handler | null) { handler = next; }
export function cachedStepUp() { return cached && cached.until > Date.now() ? cached.token : null; }
export function rememberStepUp(token: string, minutes: number) { cached = { token, until: Date.now() + (minutes * 60 - 20) * 1000 }; }
export function clearStepUp() { cached = null; }

/** Pide la contrasena una sola vez aunque varias acciones la necesiten a la vez. */
export async function requestStepUp() {
  const current = cachedStepUp(); if (current) return current;
  if (!handler) return null;
  pending ??= handler().finally(() => { pending = null; });
  return pending;
}
