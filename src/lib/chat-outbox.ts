"use client";
import { isAxiosError } from "axios";
import { createChatMessageRequest } from "@/services/chat.service";

// 41: mensajes escritos sin señal. Quedan en el dispositivo y se envian solos al volver la conexion.
export type QueuedMessage = { id: string; body: string; audience: string; savedAt: number };
const key = (userId: string) => `bomberos:chat-outbox:v1:${userId}`;
const EVENT = "chat-outbox";

export function readChatOutbox(userId: string): QueuedMessage[] {
  try { const rows = JSON.parse(localStorage.getItem(key(userId)) || "[]"); return Array.isArray(rows) ? rows.filter((r) => typeof r?.body === "string" && typeof r?.id === "string").slice(0, 30) : []; } catch { return []; }
}
function write(userId: string, rows: QueuedMessage[]) { localStorage.setItem(key(userId), JSON.stringify(rows)); window.dispatchEvent(new Event(EVENT)); }
export function queueChatMessage(userId: string, body: string, audience: string) {
  const rows = readChatOutbox(userId);
  if (rows.length >= 30) throw new Error("Hay demasiados mensajes sin enviar. Esperá a tener señal.");
  write(userId, [...rows, { id: crypto.randomUUID(), body, audience, savedAt: Date.now() }]);
}
export function discardChatMessage(userId: string, id: string) { write(userId, readChatOutbox(userId).filter((r) => r.id !== id)); }
export function clearChatOutbox(userId: string) { try { localStorage.removeItem(key(userId)); } catch { /* sin almacenamiento */ } }
export const chatOutboxEvent = EVENT;

/** Error de red sin respuesta del servidor: el pedido no llego, se puede reintentar despues. */
export const isNetworkError = (err: unknown) => isAxiosError(err) && !err.response;

let flushing = false;
export async function flushChatOutbox(userId: string) {
  if (flushing || !navigator.onLine) return 0;
  flushing = true; let sent = 0;
  try {
    for (const row of readChatOutbox(userId)) {
      try { await createChatMessageRequest({ body: row.body, audience: row.audience }); discardChatMessage(userId, row.id); sent++; }
      catch (err) { if (isNetworkError(err)) break; discardChatMessage(userId, row.id); /* rechazado por el servidor: no se reintenta */ }
    }
  } finally { flushing = false; }
  return sent;
}
