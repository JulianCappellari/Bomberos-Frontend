"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { dismiss, subscribe, type ToastItem } from "@/lib/toast";

const styles = {
  success: { icon: CheckCircle2, ring: "border-emerald-500/40", iconColor: "text-emerald-400", bar: "bg-emerald-500" },
  error: { icon: XCircle, ring: "border-red-500/50", iconColor: "text-red-400", bar: "bg-red-500" },
  info: { icon: Info, ring: "border-sky-500/40", iconColor: "text-sky-400", bar: "bg-sky-500" },
};

// Contenedor de avisos: abajo en el celular (sobre la barra de navegacion), arriba a la derecha en escritorio.
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => subscribe(setItems), []);
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[200] flex flex-col items-center gap-2 lg:inset-x-auto lg:bottom-auto lg:right-6 lg:top-6 lg:items-end">
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const s = styles[t.kind], Icon = s.icon;
          return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }} transition={{ type: "spring", stiffness: 420, damping: 32 }}
              role={t.kind === "error" ? "alert" : "status"}
              className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border bg-[var(--card)] p-3 pr-9 shadow-2xl shadow-black/30 ${s.ring}`}>
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.iconColor}`} aria-hidden />
              <div className="min-w-0"><p className="text-sm font-semibold text-[var(--txt)]">{t.message}</p>{t.detail && <p className="mt-0.5 text-xs text-[var(--mut)]">{t.detail}</p>}</div>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="absolute right-2 top-2 rounded-md p-1 text-[var(--mut)] hover:text-[var(--txt)]"><X className="h-4 w-4" /></button>
              <motion.span aria-hidden className={`absolute bottom-0 left-0 h-0.5 ${s.bar}`} initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: t.kind === "error" ? 6 : 3.5, ease: "linear" }} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
