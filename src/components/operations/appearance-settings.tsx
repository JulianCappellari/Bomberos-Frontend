"use client";
import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type Accent = "red" | "teal" | "blue";
type Appearance = { theme: Theme; accent: Accent };
const KEY = "bomberos:appearance";
const accents: Array<{ id: Accent; label: string; swatch: string }> = [
  { id: "red", label: "Rojo", swatch: "#dc2626" },
  { id: "teal", label: "Verde azulado", swatch: "#0f766e" },
  { id: "blue", label: "Azul", swatch: "#2563eb" },
];
const legacyAccent: Record<string, Accent> = { "#b91c1c": "red", "#0f766e": "teal", "#2563eb": "blue" };

function read(): Appearance {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    const theme: Theme = ["light", "dark", "system"].includes(value?.theme) ? value.theme : "dark";
    const accent: Accent = ["red", "teal", "blue"].includes(value?.accent) ? value.accent : legacyAccent[value?.accent] ?? "red";
    return { theme, accent };
  } catch { return { theme: "dark", accent: "red" }; }
}
function resolved(theme: Theme) {
  return theme === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : theme;
}
function apply(value: Appearance) {
  const root = document.documentElement;
  const theme = resolved(value.theme);
  root.dataset.theme = theme;
  root.dataset.accent = value.accent;
  root.style.removeProperty("--red");
  root.style.removeProperty("--redd");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#ffffff" : "#0d0f14");
}

// Script que corre antes de pintar: evita el destello oscuro al abrir la app en tema claro.
export const appearanceBootScript = `(function(){try{var v=JSON.parse(localStorage.getItem("${KEY}")||"null")||{};var t=v.theme;if(t==="system")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";if(t!=="light")t="dark";var a=({"#b91c1c":"red","#0f766e":"teal","#2563eb":"blue"})[v.accent]||v.accent;if(["red","teal","blue"].indexOf(a)<0)a="red";var r=document.documentElement;r.dataset.theme=t;r.dataset.accent=a;}catch(e){}})();`;

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    apply(read());
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const follow = () => { const value = read(); if (value.theme === "system") apply(value); };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);
  return children;
}

export function AppearanceSettings() {
  const [value, setValue] = useState<Appearance>({ theme: "dark", accent: "red" });
  useEffect(() => { const frame = requestAnimationFrame(() => setValue(read())); return () => cancelAnimationFrame(frame); }, []);
  function save(next: Appearance) {
    setValue(next); apply(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }
  const themes: Array<[Theme, string, string]> = [["dark", "Oscuro", "Recomendado de noche y en el cuartel"], ["light", "Claro", "Mejor a pleno sol"], ["system", "Automático", "Sigue la configuración del celular"]];
  return (
    <section className="my-5 space-y-5 border-y border-[var(--bord)] py-4" aria-labelledby="appearance-title">
      <h2 id="appearance-title" className="font-bold">Apariencia</h2>
      <fieldset>
        <legend className="mb-2 text-sm text-[var(--mut)]">Tema</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {themes.map(([id, label, hint]) => (
            <button key={id} type="button" aria-pressed={value.theme === id} onClick={() => save({ ...value, theme: id })}
              className={`rounded-xl border p-3 text-left transition-colors ${value.theme === id ? "border-[var(--accent)] bg-[var(--card2)] ring-1 ring-[var(--accent)]" : "border-[var(--bord)] hover:bg-[var(--card2)]"}`}>
              <span className="block font-semibold">{label}</span>
              <span className="block text-xs text-[var(--mut)]">{hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm text-[var(--mut)]">Color de los botones principales</legend>
        <div className="flex flex-wrap gap-3">
          {accents.map((accent) => (
            <button key={accent.id} type="button" aria-pressed={value.accent === accent.id} onClick={() => save({ ...value, accent: accent.id })}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${value.accent === accent.id ? "border-[var(--txt)]" : "border-[var(--bord)]"}`}>
              <span aria-hidden className="h-5 w-5 rounded-full" style={{ backgroundColor: accent.swatch }} />
              {accent.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--mut)]">Las alertas y los estados de peligro siguen siendo rojos para no perder su significado.</p>
      </fieldset>
    </section>
  );
}
