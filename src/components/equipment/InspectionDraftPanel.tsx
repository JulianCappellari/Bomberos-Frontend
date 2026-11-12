"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { readInspectionDraft, InspectionDraft } from "@/lib/inspection-draft";

const changedEvent = "inspection-draft-changed";
function subscribe(listener: () => void) {
  window.addEventListener(changedEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(changedEvent, listener);
    window.removeEventListener("storage", listener);
  };
}
export function clearInspectionDraft(key: string) {
  try { sessionStorage.removeItem(key); window.dispatchEvent(new Event(changedEvent)); } catch {}
}

export default function InspectionDraftPanel({
  storageKey, snapshot, hasChanges, onRestore,
}: {
  storageKey: string;
  snapshot: Omit<InspectionDraft, "savedAt" | "version">;
  hasChanges: boolean;
  onRestore: (draft: InspectionDraft) => void;
}) {
  const [resolved, setResolved] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const raw = useSyncExternalStore(subscribe, () => {
    try { return sessionStorage.getItem(storageKey); } catch { return null; }
  }, () => null);
  const saved = useMemo(() => readInspectionDraft(raw), [raw]);
  const hasPrevious = Boolean(saved);
  const waitingForChoice = !resolved && hasPrevious;
  const compatible = saved?.inventorySignature === snapshot.inventorySignature;

  useEffect(() => {
    if (!hasChanges || waitingForChoice) return;
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ ...snapshot, version: 1, savedAt: Date.now() }));
        setResolved(true);
        window.dispatchEvent(new Event(changedEvent));
        setStorageError(false);
      } catch { setStorageError(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [snapshot, hasChanges, storageKey, waitingForChoice]);

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  if (waitingForChoice && saved) {
    return <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
      <div>
        <p className="font-bold">Hay un control sin finalizar</p>
        <p className="mt-1 text-xs opacity-80">{new Intl.DateTimeFormat("es-AR", { hourCycle: "h23", dateStyle: "short", timeStyle: "short" }).format(saved.savedAt)}</p>
        {!compatible && <p className="mt-1">El inventario cambio. Inicie un control nuevo para revisar todos los materiales.</p>}
      </div>
      <div className="flex gap-2">
        {compatible && <button type="button" className="app-button app-button-outline w-auto" onClick={() => { onRestore(saved); setResolved(true); }}>Recuperar</button>}
        <button type="button" className="app-button app-button-outline w-auto" onClick={() => { clearInspectionDraft(storageKey); setResolved(true); }}>Descartar borrador</button>
      </div>
    </div>;
  }
  if (storageError) return <p role="status" className="text-sm text-amber-300">El navegador no permite guardar el borrador. Mantenga esta pagina abierta hasta finalizar el control.</p>;
  if (resolved && hasChanges) return <p role="status" className="text-xs text-[var(--mut)]">Borrador guardado en esta pestana. El control aun no fue registrado.</p>;
  return null;
}
