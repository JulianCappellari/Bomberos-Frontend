import { z } from "zod";
const https = z.string().url().max(500).refine((v) => { const u = new URL(v); return u.protocol === "https:" && !u.username && !u.password; });
const body = z.object({ revision: z.number().int().positive(), notes: z.string().trim().min(5).max(4000), completedAt: z.string().datetime({ offset: true }).optional(), evidenceUrls: z.array(https).max(3).optional(), photos: z.array(z.string().min(1).max(250000).regex(/^[A-Za-z0-9+/]+={0,2}$/)).max(3).optional(), action: z.enum(["TRANSFER", "DECLINE"]).optional(), targetUserId: z.string().min(1).max(100).optional() }).strict();
export const queuedTaskSchema = z.object({ id: z.string().uuid(), taskId: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/), title: z.string().max(160), route: z.enum(["submit", "member"]), body, savedAt: z.number().finite(), conflict: z.boolean().default(false) }).strict().refine((v) => v.route === "submit" ? Boolean(v.body.completedAt) && !v.body.action && !v.body.targetUserId : Boolean(v.body.action) && !v.body.completedAt && !v.body.evidenceUrls && !v.body.photos && (v.body.action === "TRANSFER" ? Boolean(v.body.targetUserId) : !v.body.targetUserId));
export type QueuedTask = z.infer<typeof queuedTaskSchema>;
export function parseTaskOutbox(raw: string | null): QueuedTask[] {
  try { if (!raw || raw.length > 1000000) return []; const result = z.array(queuedTaskSchema).max(50).safeParse(JSON.parse(raw)); return result.success ? result.data : []; } catch { return []; }
}
const key = (userId: string) => `bomberos:task-outbox:v1:${userId}`;
export function readTaskOutbox(userId: string) { try { return parseTaskOutbox(localStorage.getItem(key(userId))); } catch { return []; } }
export function writeTaskOutbox(userId: string, items: QueuedTask[]) { const raw = JSON.stringify(items); if (raw.length > 1000000) throw new Error("La bandeja local esta llena; sincronice o descarte pendientes antes de agregar mas fotos"); localStorage.setItem(key(userId), raw); window.dispatchEvent(new Event("task-outbox")); }
export function queueTask(userId: string, item: QueuedTask) {
  const validated = queuedTaskSchema.parse(item), rows = readTaskOutbox(userId);
  if (rows.some((r) => r.taskId === item.taskId)) throw new Error("Ya hay una accion pendiente para esta tarea. Revisela antes de continuar.");
  if (rows.length >= 50) throw new Error("La bandeja sin conexion esta llena");
  writeTaskOutbox(userId, [...rows, validated]);
}
export function clearTaskOutbox(userId: string) { try { localStorage.removeItem(key(userId)); } catch { /* Storage restrictions must not prevent logout. */ } }
