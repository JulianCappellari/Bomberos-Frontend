// Licencia Nacional de Conducir (Ley 24.449, Disposición ANSV 20/2019). Igual que en el servidor.
export const LICENSE_CLASSES: Array<{ code: string; label: string }> = [
  { code: "A.1.1", label: "Ciclomotores hasta 50 cc" }, { code: "A.1.2", label: "Motos hasta 150 cc" },
  { code: "A.1.3", label: "Motos hasta 300 cc" }, { code: "A.1.4", label: "Motos de más de 300 cc" },
  { code: "A.2.1", label: "Triciclos y cuatriciclos hasta 300 cc" }, { code: "A.2.2", label: "Triciclos y cuatriciclos de más de 300 cc" },
  { code: "A.3", label: "Triciclos y cuatriciclos con cabina" },
  { code: "B.1", label: "Autos, camionetas y utilitarios hasta 3.500 kg" }, { code: "B.2", label: "B.1 con acoplado hasta 750 kg o casa rodante" },
  { code: "C.1", label: "Camiones sin acoplado de 3.500 a 12.000 kg" }, { code: "C.2", label: "Camiones de 12.000 a 24.000 kg" },
  { code: "C.3", label: "Camiones de más de 24.000 kg" },
  { code: "D.1", label: "Transporte de pasajeros hasta 8 plazas" }, { code: "D.2", label: "Transporte de pasajeros de 9 a 20 plazas" },
  { code: "D.3", label: "Transporte de pasajeros de más de 20 plazas" }, { code: "D.4", label: "Vehículos de urgencia y emergencia" },
  { code: "E.1", label: "Camiones articulados o con acoplado" }, { code: "E.2", label: "Maquinaria especial no agrícola" },
  { code: "F", label: "Vehículos adaptados" }, { code: "G.1", label: "Tractores agrícolas" }, { code: "G.2", label: "Maquinaria especial agrícola" },
];
export const classLabel = (code: string) => LICENSE_CLASSES.find((c) => c.code === code)?.label ?? "";
/** "B1" -> "B.1" (formato oficial), como en el servidor. */
export function normalizeLicenseClass(value: string) {
  const v = value.trim().toUpperCase().replace(/\s+/g, "");
  const m = v.match(/^([A-G])\.?(\d)?(?:\.?(\d))?$/);
  return m ? [m[1], m[2], m[3]].filter(Boolean).join(".") : v;
}
export const VEHICLE_LICENSE_CATEGORIES: Record<string, { label: string; required: string[] }> = {
  UNSET: { label: "Sin configurar (habilitación manual de jefatura)", required: [] },
  LIGHT: { label: "Liviano hasta 3.500 kg (camioneta, utilitario)", required: ["B.1", "D.4"] },
  MEDIUM: { label: "Camión de 3.500 a 12.000 kg (autobomba liviana o mediana)", required: ["C.1", "D.4"] },
  HEAVY: { label: "Camión de 12.000 a 24.000 kg (autobomba pesada, cisterna)", required: ["C.2", "D.4"] },
  EXTRA_HEAVY: { label: "Camión de más de 24.000 kg", required: ["C.3", "D.4"] },
  ARTICULATED: { label: "Con acoplado o semirremolque", required: ["E.1", "D.4"] },
};
