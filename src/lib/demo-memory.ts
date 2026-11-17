"use client";
// Demo: las respuestas simuladas no se guardan en el servidor. Para que un aviso ya respondido (alerta,
// confirmacion de permanencia) no vuelva a aparecer en cada pantalla o recarga, se recuerda en la pestaña.
export function demoMemory(name: string) {
  const key = `bomberos:demo:${name}`;
  const read = (): string[] => {
    try { const rows = JSON.parse(sessionStorage.getItem(key) || "[]"); return Array.isArray(rows) ? rows.filter((row) => typeof row === "string").slice(-200) : []; } catch { return []; }
  };
  return {
    has: (id: string) => read().includes(id),
    add: (id: string) => { try { sessionStorage.setItem(key, JSON.stringify([...read().filter((row) => row !== id), id])); } catch { /* Sin almacenamiento: vuelve a preguntar. */ } },
  };
}
