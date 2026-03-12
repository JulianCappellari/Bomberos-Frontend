"use client";

import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedLayout>
      <div className="screen-body screen-body-no-nav">
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, var(--card), #1a0a0a)",
            borderColor: "rgba(230,60,60,.3)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] uppercase tracking-[0.5px] text-[var(--mut)] font-semibold">
                Bienvenido
              </div>
              <div className="text-[22px] tracking-[1px] font-bold uppercase">
                {user?.profile?.fullName || user?.username}
              </div>
              <div className="text-[13px] text-[var(--mut)] mt-1">
                {user?.profile?.rank || "Sin rango"} ·{" "}
                {user?.profile?.badge || "Sin legajo"}
              </div>
            </div>

            <div className="avatar avatar-lg">👨‍🚒</div>
          </div>

          <div className="h-px bg-[var(--bord)] my-3" />

          <div className="flex items-center justify-between">
            <span className="badge badge-green">🟢 ACTIVO</span>
            <span className="text-[12px] text-[var(--mut)]">
              Cuartel Sampacho
            </span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-num">0h</div>
            <div className="stat-label">Horas este mes</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">0</div>
            <div className="stat-label">Alertas activas</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">0</div>
            <div className="stat-label">Incidentes</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">0</div>
            <div className="stat-label">En cuartel</div>
          </div>
        </div>

        <div className="section-title">Acciones rápidas</div>

        <div className="quick-grid">
          <Link href="/alerts/new" className="quick-btn quick-btn-red">
            <div className="quick-icon">🚨</div>
            <div className="quick-label">Alertas</div>
          </Link>

          <Link href="/attendance" className="quick-btn">
            <div className="quick-icon">📷</div>
            <div className="quick-label">Asistencia</div>
          </Link>

          <Link href="/incidents" className="quick-btn">
            <div className="quick-icon">📋</div>
            <div className="quick-label">Incidentes</div>
          </Link>

          <Link href="/shifts" className="quick-btn">
            <div className="quick-icon">📅</div>
            <div className="quick-label">Guardias</div>
          </Link>

          <Link href="/assets" className="quick-btn">
            <div className="quick-icon">🚒</div>
            <div className="quick-label">Equipamiento</div>
          </Link>

          <Link href="/inspections" className="quick-btn">
            <div className="quick-icon">📋</div>
            <div className="quick-label">Inspecciones</div>
          </Link>
        </div>

        <div className="section-title">Últimas alertas</div>
        <div className="card text-[var(--mut)] text-sm">
          Todavía no conectamos el resumen real del dashboard.
        </div>
      </div>
    </ProtectedLayout>
  );
}