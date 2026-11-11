import {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ContactRound,
  Droplets,
  FileSignature,
  Fuel,
  Gauge,
  Home,
  IdCard,
  MessageCircle,
  QrCode,
  Receipt,
  ScanLine,
  ShieldCheck,
  Shirt,
  Siren,
  Trophy,
  Truck,
  UserCheck,
  UserCog,
  Users,
  Wind,
  Wrench,
  type LucideIcon,
  MonitorPlay,
} from "lucide-react";
import { showNavigationItem } from "./permissions";

// La navegacion se ordena por lo que la persona quiere hacer, no por areas internas del sistema.
export type NavGroupId = "service" | "emergency" | "duty" | "fleet" | "station" | "command";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  Icon: LucideIcon;
  group: NavGroupId;
};

export const navGroups: { id: NavGroupId; label: string }[] = [
  { id: "service", label: "Mi servicio" },
  { id: "emergency", label: "Emergencias" },
  { id: "duty", label: "Función de guardia" },
  { id: "fleet", label: "Móviles y equipos" },
  { id: "station", label: "Cuartel" },
  { id: "command", label: "Jefatura y administración" },
];

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", shortLabel: "Inicio", description: "Lo que necesitás hacer hoy", Icon: Home, group: "service" },
  { href: "/attendance", label: "Mi asistencia (QR)", shortLabel: "Asistencia", description: "Registrar ingreso y salida del cuartel", Icon: ScanLine, group: "service" },
  { href: "/tasks", label: "Tareas", shortLabel: "Tareas", description: "Trabajos asignados, tomar y avisar realizados", Icon: ClipboardList, group: "service" },
  { href: "/calendar", label: "Guardias", shortLabel: "Guardias", description: "Calendario de turnos e intercambios", Icon: CalendarDays, group: "service" },
  { href: "/vehicle-control", label: "Control de móviles", shortLabel: "Control", description: "Control semanal de tu grupo", Icon: ClipboardCheck, group: "service" },
  { href: "/me", label: "Mi perfil", shortLabel: "Perfil", description: "Datos, disponibilidad, licencias y prendas", Icon: IdCard, group: "service" },

  { href: "/alerts", label: "Alertas", shortLabel: "Alertas", description: "Convocatorias activas y respuesta Voy / No voy", Icon: Bell, group: "emergency" },
  { href: "/incidents", label: "Intervenciones", shortLabel: "Interv.", description: "Planillas de emergencia, dotaciones y cierre", Icon: Siren, group: "emergency" },
  { href: "/departures", label: "Salidas de móviles", shortLabel: "Salidas", description: "Traslados, logística y capacitación", Icon: Truck, group: "emergency" },
  { href: "/station", label: "Personal en el cuartel", shortLabel: "Presentes", description: "Quién está presente ahora", Icon: UserCheck, group: "emergency" },
  { href: "/board", label: "Tablero de comando", shortLabel: "Tablero", description: "Pantalla en vivo para el cuartel: alertas, móviles y personal", Icon: MonitorPlay, group: "emergency" },
  { href: "/readiness", label: "Estado operativo", shortLabel: "Estado", description: "Móviles, dotación y advertencias", Icon: Gauge, group: "emergency" },

  { href: "/guard-qr", label: "QR del cuartel", shortLabel: "QR base", description: "Mostrar el código de ingreso", Icon: QrCode, group: "duty" },
  { href: "/guard-log", label: "Acta de guardia", shortLabel: "Acta", description: "Novedades del turno", Icon: FileSignature, group: "duty" },

  { href: "/equipment", label: "Móviles y equipamiento", shortLabel: "Móviles", description: "Flota, inventario e historial de controles", Icon: Truck, group: "fleet" },
  { href: "/maintenance", label: "Mantenimiento", shortLabel: "Mantenim.", description: "Reparaciones y fallas", Icon: Wrench, group: "fleet" },
  { href: "/fuel", label: "Combustible", shortLabel: "Combust.", description: "Cargas por móvil", Icon: Fuel, group: "fleet" },
  { href: "/water-trips", label: "Viajes de agua", shortLabel: "Agua", description: "Servicios de agua y compensaciones", Icon: Droplets, group: "fleet" },
  { href: "/air-equipment", label: "ERA y compresor", shortLabel: "ERA", description: "Cilindros, cargas y pruebas", Icon: Wind, group: "fleet" },
  { href: "/personal-equipment", label: "EPP institucional", shortLabel: "EPP", description: "Stock y entregas de prendas", Icon: Shirt, group: "fleet" },
  { href: "/compliance", label: "Vencimientos", shortLabel: "Vencim.", description: "Seguros, VTV, certificaciones", Icon: BadgeCheck, group: "fleet" },

  { href: "/agenda", label: "Agenda del cuartel", shortLabel: "Agenda", description: "Capacitaciones, reuniones y eventos con confirmación", Icon: CalendarDays, group: "station" },
  { href: "/chat", label: "Comunicaciones", shortLabel: "Mensajes", description: "Mensajes con confirmación de lectura", Icon: MessageCircle, group: "station" },
  { href: "/documents", label: "Protocolos y documentos", shortLabel: "Docs", description: "Protocolos y actas publicadas", Icon: BookOpen, group: "station" },
  { href: "/contacts", label: "Contactos", shortLabel: "Contactos", description: "Directorio telefónico operativo", Icon: ContactRound, group: "station" },
  { href: "/expenses", label: "Gastos y reintegros", shortLabel: "Gastos", description: "Presentar y seguir gastos", Icon: Receipt, group: "station" },
  { href: "/reports", label: "Reportes", shortLabel: "Reportes", description: "Horas, salidas y estadísticas", Icon: BarChart3, group: "station" },

  { href: "/admin", label: "Administración", shortLabel: "Admin", description: "Cuentas, cargos y permisos", Icon: UserCog, group: "command" },
  { href: "/security-center", label: "Centro de seguridad", shortLabel: "Seguridad", description: "Ingresos fallidos, fraudes posibles y cuentas bloqueadas", Icon: ShieldCheck, group: "command" },
  { href: "/command", label: "Consulta de personal", shortLabel: "Personal", description: "Ficha privada y estadísticas", Icon: Users, group: "command" },
  { href: "/driver-licenses", label: "Licencias de conducir", shortLabel: "Licencias", description: "Habilitaciones de conductores", Icon: BadgeCheck, group: "command" },
  { href: "/participations", label: "Asistencia a servicios", shortLabel: "Servicios", description: "Verificar participaciones", Icon: ShieldCheck, group: "command" },
  { href: "/ranking", label: "Ranking", shortLabel: "Ranking", description: "Puntaje y tareas de recuperación", Icon: Trophy, group: "command" },
];

export type NavUser = { role?: string; profile?: { rank?: string | null } | null; specialPermissions?: string[] } | null | undefined;

export function isTechnicalAdmin(user: NavUser) {
  return user?.profile?.rank?.toLocaleLowerCase() === "administrador";
}

export function visibleNavItems(user: NavUser) {
  return navItems.filter((item) => {
    if (item.href === "/dashboard" && isTechnicalAdmin(user)) return false;
    return showNavigationItem(item.href, user?.role, user?.profile?.rank, user?.specialPermissions);
  });
}

// Barra inferior del celular: las cuatro acciones mas frecuentes de cada rol; el resto en "Menu".
export function bottomNavHrefs(user: NavUser) {
  if (isTechnicalAdmin(user)) return ["/admin", "/chat", "/reports"];
  if (user?.role === "GUARD") return ["/dashboard", "/alerts", "/guard-qr", "/guard-log"];
  return ["/dashboard", "/alerts", "/attendance", "/tasks"];
}

export function homeHref(user: NavUser) {
  return isTechnicalAdmin(user) ? "/admin" : "/dashboard";
}
