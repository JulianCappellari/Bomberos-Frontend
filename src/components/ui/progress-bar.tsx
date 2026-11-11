"use client";
import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

// Barra fina arriba de la pantalla mientras se guarda algo o se carga una pantalla por primera vez.
// No aparece en las actualizaciones automaticas en segundo plano (serian un parpadeo constante) y
// espera 200 ms antes de mostrarse para no destellar en respuestas rapidas.
export function ProgressBar() {
  const saving = useIsMutating();
  const firstLoads = useIsFetching({ predicate: (q) => q.state.data === undefined && q.state.fetchStatus === "fetching" });
  const busy = saving + firstLoads > 0;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!busy) { const t = window.setTimeout(() => setVisible(false), 150); return () => window.clearTimeout(t); }
    const t = window.setTimeout(() => setVisible(true), 200);
    return () => window.clearTimeout(t);
  }, [busy]);
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-x-0 top-0 z-[300] h-0.5 overflow-hidden transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="progress-indeterminate h-full w-1/3 bg-[var(--accent)]" />
    </div>
  );
}
