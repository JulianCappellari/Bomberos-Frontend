"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { PersonalActivity } from "./personal-activity";
export function PersonalStatistics({ userId }: { userId: string }) {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["personal-statistics", user?.id, userId], queryFn: async () => (await api.get<Record<string, number> & { categories?: Record<string, number> }>(`/members/statistics/${userId}`)).data, enabled: Boolean(userId && user) });
  const labels: Record<string, string> = { workedMinutes: "Minutos registrados (cerrados)", closedAttendances: "Permanencias cerradas", verifiedTasks: "Trabajos verificados", assignedShifts: "Guardias asignadas", assignedIncidents: "Intervenciones asignadas", inspections: "Controles realizados" };
  Object.assign(labels, { attendedShifts: "Guardias con asistencia registrada", attendedIncidents: "Intervenciones con asistencia registrada", serviceMinutes: "Minutos de servicio (sin duplicados)" });
  Object.assign(labels, { attendedDepartures: "Salidas de movil acreditadas", totalAccreditedMinutes: "Total acreditado: cuartel y servicios sin duplicados" });
  const categoryLabels: Record<string, string> = { stationMinutes: "En cuartel (presencial)", deployedMinutes: "En emergencia desplegada", baseDuringEmergencyMinutes: "En base durante emergencias", totalMinutes: "Total acreditado sin solapamientos" };
  const hours = (minutes: number) => `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  return <section className="my-5 border-y border-[var(--bord)] py-4"><h2 className="mb-3 font-bold">Estadisticas personales</h2>{query.isLoading && <ListSkeleton label="Cargando" />}{query.isError && <p role="alert">No se pudieron consultar las estadisticas.</p>}<div className="grid grid-cols-2 gap-4 md:grid-cols-3">{query.data && Object.entries(labels).map(([key, label]) => <div key={key}><div className="text-xl font-bold">{query.data![key]}</div><div className="text-xs text-[var(--mut)]">{label}</div></div>)}</div>{query.data?.categories && <div className="mt-4 border-t border-[var(--bord)] pt-3"><h3 className="mb-2 text-sm font-semibold">Horas por categoría</h3><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Object.entries(categoryLabels).map(([key, label]) => <div key={key}><div className="text-xl font-bold">{hours(query.data!.categories![key] || 0)}</div><div className="text-xs text-[var(--mut)]">{label}</div></div>)}</div><p className="mt-2 text-xs text-[var(--mut)]">Las permanencias cerradas automáticamente por falta de revalidación se descartan completas: no suman horas ni puntos.</p></div>}<p className="mt-3 text-xs text-[var(--mut)]">Una asignacion no acredita por si sola asistencia efectiva a una guardia o emergencia.</p><PersonalActivity userId={userId} /></section>;
}
