"use client";
// Avisos flotantes breves ("toasts") para confirmar acciones sin mover la pantalla.
// Uso: toast.success("Guardado"); toast.error("No se pudo guardar"); toast.info("…").
export type ToastKind = "success" | "error" | "info";
export type ToastItem = { id: number; kind: ToastKind; message: string; detail?: string };
type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l(items));

function push(kind: ToastKind, message: string, detail?: string) {
  const id = nextId++;
  // Sin duplicados: el mismo mensaje seguido reemplaza al anterior.
  items = [...items.filter((t) => t.message !== message), { id, kind, message, detail }].slice(-3);
  emit();
  // Respuesta tactil breve en celulares (si el usuario no la tiene desactivada en el sistema).
  try { navigator.vibrate?.(kind === "error" ? [30, 40, 30] : 12); } catch { /* sin vibracion */ }
  window.setTimeout(() => dismiss(id), kind === "error" ? 6000 : 3500);
  return id;
}

export function dismiss(id: number) { items = items.filter((t) => t.id !== id); emit(); }
export function subscribe(listener: Listener) { listeners.add(listener); listener(items); return () => { listeners.delete(listener); }; }

export const toast = {
  success: (message: string, detail?: string) => push("success", message, detail),
  error: (message: string, detail?: string) => push("error", message, detail),
  info: (message: string, detail?: string) => push("info", message, detail),
};
