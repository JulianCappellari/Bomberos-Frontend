export function isCommand(role?: string) { return role === "ADMIN" || role === "OPERATOR"; }
export function isDutyManager(role?: string) { return isCommand(role) || role === "GUARD"; }
const logistics = ["/air-equipment", "/fuel", "/water-trips", "/maintenance", "/compliance", "/guard-qr", "/dev/qr", "/board"];
// Deposito: lo maneja el encargado (permiso PPE) o administracion; piden materiales jefatura y la guardia.
export function canUseSupplies(role?: string, permissions: string[] = []) { return isDutyManager(role) || permissions.includes("PPE"); }
const normalizedRank = (rank?: string | null) => (rank ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, "");
// Comision Directiva: sus integrantes, la cuenta de administracion y quien tenga el permiso financiero.
export function canSeeCommission(rank?: string | null, permissions: string[] = []) { return ["comisiondirectiva", "administrador"].includes(normalizedRank(rank)) || permissions.includes("FINANCE"); }
// La Comision Directiva es civil: consulta informacion general y finanzas, no opera como bombero
// (no ficha, no responde alertas, no integra guardias, dotaciones ni tareas).
export const isCivilRank = (rank?: string | null) => normalizedRank(rank) === "comisiondirectiva";
const CIVIL_PAGES = ["/commission", "/chat", "/agenda", "/documents", "/contacts", "/expenses", "/me", "/notifications", "/security", "/app"];
export function canOpenPage(path: string, role?: string, permissions: string[] = [], rank?: string | null) {
  if (isCivilRank(rank)) return CIVIL_PAGES.some((p) => path === p || path.startsWith(p + "/"));
  if (path === "/supplies" || path.startsWith("/supplies/")) return canUseSupplies(role, permissions);
  if (path === "/commission") return role !== "GUARD" && (canSeeCommission(rank, permissions) || role === "ADMIN");
  if ((path === "/air-equipment" || path.startsWith("/air-equipment/")) && permissions.includes("TECHNICAL")) return true;
  if ((path === "/personal-equipment" || path.startsWith("/personal-equipment/")) && permissions.includes("PPE")) return true;
  if(path==="/ranking"||path.startsWith("/ranking/"))return role==="ADMIN";
  if (logistics.some((p) => path === p || path.startsWith(p + "/"))) return isDutyManager(role);
  if (path === "/personal-equipment") return isCommand(role);
  if (path === "/command") return role === "ADMIN";
  if (path === "/security-center") return role === "ADMIN";
  if (path === "/admin") return isCommand(role);
  if (path === "/control-groups") return role === "ADMIN";
  if (path === "/guard-log") return isDutyManager(role);
  return true;
}
export function showNavigationItem(path: string, role?: string, rank?: string | null, permissions: string[] = []) {
  if (["/hazmat", "/app", "/availability", "/control-groups", "/security", "/notifications"].includes(path)) return false;
  if (["/driver-licenses", "/participations", "/incidents/logistics", "/public-posts"].includes(path)) return isCommand(role);
  if (path === "/guard-log") return role === "GUARD";
  if (path === "/guard-qr") return role === "GUARD" || role === "ADMIN";
  if (path === "/attendance" && rank?.toLocaleLowerCase() === "administrador") return false;
  if (path === "/commission") return role !== "GUARD" && canSeeCommission(rank, permissions);
  return canOpenPage(path, role, permissions, rank);
}

