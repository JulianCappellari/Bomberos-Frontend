"use client";
import { useEffect, useState } from "react";
type Appearance = { theme: "dark" | "light"; accent: string };
const accents = ["#b91c1c", "#0f766e", "#2563eb"];
function apply(value: Appearance) { document.documentElement.dataset.theme = value.theme; document.documentElement.style.setProperty("--red", value.accent); document.documentElement.style.setProperty("--redd", value.accent); }
export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { apply({ theme: "dark", accent: accents[0] }); try { const value = JSON.parse(localStorage.getItem("bomberos:appearance") || "null"); if (value && ["light", "dark"].includes(value.theme) && accents.includes(value.accent)) apply(value); } catch {} }, []);
  return children;
}
export function AppearanceSettings() {
  const [theme, setTheme] = useState("dark"), [accent, setAccent] = useState(accents[0]);
  useEffect(() => { const frame = requestAnimationFrame(() => { setTheme(document.documentElement.dataset.theme || "dark"); setAccent(document.documentElement.style.getPropertyValue("--red") || accents[0]); }); return () => cancelAnimationFrame(frame); }, []);
  function save(nextTheme: string, nextAccent: string) { const value: Appearance = { theme: nextTheme === "light" ? "light" : "dark", accent: nextAccent }; setTheme(value.theme); setAccent(nextAccent); apply(value); try { localStorage.setItem("bomberos:appearance", JSON.stringify(value)); } catch {} }
  return <section className="my-5 border-y border-[var(--bord)] py-4"><h2 className="mb-3 font-bold">Apariencia</h2><div className="flex flex-wrap items-center gap-4"><label>Tema<select aria-label="Tema visual" className="app-input mt-1" value={theme} onChange={(e) => save(e.target.value, accent)}><option value="dark">Oscuro</option><option value="light">Claro</option></select></label><fieldset><legend className="mb-2 text-sm">Color principal</legend><div className="flex gap-3">{accents.map((color, i) => <button key={color} type="button" aria-label={["Rojo", "Verde", "Azul"][i]} aria-pressed={accent === color} title={["Rojo", "Verde", "Azul"][i]} className={`h-10 w-10 rounded border-2 ${accent === color ? "border-[var(--txt)]" : "border-transparent"}`} style={{ backgroundColor: color }} onClick={() => save(theme, color)} />)}</div></fieldset></div></section>;
}
