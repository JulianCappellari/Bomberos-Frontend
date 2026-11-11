export function isCommand(role?: string) { return role === "ADMIN" || role === "OPERATOR"; }
export function isDutyManager(role?: string) { return isCommand(role) || role === "GUARD"; }
const logistics = ["/air-equipment", "/fuel", "/water-trips", "/maintenance", "/compliance", "/guard-qr", "/dev/qr", "/board"];
export function canOpenPage(path: string, role?: string, permissions: string[] = []) {
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
  if (["/driver-licenses", "/participations"].includes(path)) return isCommand(role);
  if (path === "/guard-log") return role === "GUARD";
  if (path === "/guard-qr") return role === "GUARD" || role === "ADMIN";
  if (path === "/attendance" && rank?.toLocaleLowerCase() === "administrador") return false;
  return canOpenPage(path, role, permissions);
}

