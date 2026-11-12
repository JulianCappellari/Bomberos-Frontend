"use client";
import {OperationalAvailability} from "@/components/operations/operational-availability";

import { Clock3, ShieldCheck, UserCheck, Users } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { usePresentPersonnel } from "@/hooks/use-attendence";
import { PresentPersonnelItem } from "@/services/attendance.service";
import { AttendanceCorrections, CloseAttendance } from "@/components/operations/close-attendance";

function displayName(item: PresentPersonnelItem) {
  return item.user.profile?.fullName || item.user.username;
}

function formatSince(value: string) {
  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

function formatCheckIn(value: string) {
  return new Intl.DateTimeFormat("es-AR", { hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function trustLabel(value: PresentPersonnelItem["checkInTrust"]) {
  if (value === "HIGH") return "Validación alta";
  if (value === "MEDIUM") return "Validación media";
  return "Validación pendiente";
}

export default function StationPage() {
  const { data: present = [], isLoading, isError } = usePresentPersonnel();

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-white">Cuartel ahora</h1>
          <p className="mt-1 text-sm text-[var(--mut)]">Quién está en el cuartel, quién está disponible y las correcciones de fichaje pendientes.</p>
        </header>
        <OperationalAvailability />
        <section className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title mb-1 mt-0">Personal en el cuartel</h2>
              <p className="text-sm text-[var(--mut)]">En vivo, según los ingresos con QR abiertos.{present.length > 0 && ` ${present.filter((p) => p.onGuard).length} de guardia y ${present.filter((p) => !p.onGuard).length} sin guardia.`}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-[10px] bg-red-500/10 px-3 py-2 text-red-300">
              <UserCheck className="h-5 w-5" aria-hidden />
              <span className="text-2xl font-bold">{present.length}</span>
            </div>
          </div>
        </section>

        <AttendanceCorrections />

        {isLoading && (
          <div className="card text-sm text-[var(--mut)]">
            Cargando personal presente...
          </div>
        )}

        {isError && (
          <div className="card border-red-500/30 bg-red-500/10 text-sm text-red-300">
            No se pudo cargar el listado del cuartel.
          </div>
        )}

        {!isLoading && !isError && present.length === 0 && (
          <div className="card text-sm text-[var(--mut)]">
            No hay asistencias abiertas en este momento.
          </div>
        )}

        <section className="space-y-3">
          {present.map((item) => (
            <PresentCard key={item.id} item={item} />
          ))}
        </section>
      </main>
    </ProtectedLayout>
  );
}

function PresentCard({ item }: { item: PresentPersonnelItem }) {
  return (
    <article className="card"><CloseAttendance id={item.id} />
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300">
          <Users className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-white">
                {displayName(item)}
              </h2>
              <p className="text-sm text-[var(--mut)]">
                {item.user.profile?.rank || item.user.role} -{" "}
                {item.user.profile?.badge || item.user.username}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {item.onGuard ? (
                <span className="badge badge-yellow">
                  De guardia{item.guardUntil ? ` hasta ${new Date(item.guardUntil).toLocaleTimeString("es-AR", { hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit" })}` : ""}
                </span>
              ) : (
                <span className="badge">Sin guardia</span>
              )}
              <span className="badge badge-green">
                {formatSince(item.checkInAt)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <InfoTile
              icon={<Clock3 className="h-4 w-4" />}
              label="Ingreso"
              value={formatCheckIn(item.checkInAt)}
            />
            <InfoTile
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Control"
              value={trustLabel(item.checkInTrust)}
            />
            <InfoTile
              icon={<UserCheck className="h-4 w-4" />}
              label="Cuartel"
              value={item.station.name}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-[var(--mut)]">
        <span className="text-red-400">{icon}</span>
        {label}
      </div>
      <div className="truncate text-sm font-bold text-white">{value}</div>
    </div>
  );
}
