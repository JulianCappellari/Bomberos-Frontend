"use client";

import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import { useState } from "react";

const ROLE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  ADMIN:       { icon: "👑", label: "Administrador",  color: "#ef4444" },
  FIREFIGHTER: { icon: "🔥", label: "Bombero",        color: "#f97316" },
  DEFAULT:     { icon: "📋", label: "Operador",       color: "#60a5fa" },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const firstName = user?.profile?.fullName?.split(" ")[0] || user?.username || "Bombero";
  const role = user?.role && ROLE_CONFIG[user.role] ? user.role : "DEFAULT";
  const roleConfig = ROLE_CONFIG[role];
  const initial = (user?.profile?.fullName?.[0] || user?.username?.[0] || "B").toUpperCase();

  const quickActions = [
    { id: "emergency", icon: "🚨", label: "Reportar Emergencia", accent: true },
    { id: "team",      icon: "👥", label: "Ver Equipo",          accent: false },
    { id: "reports",   icon: "📊", label: "Reportes",            accent: false },
    { id: "settings",  icon: "⚙️", label: "Configuración",       accent: false },
  ];

  const systemStatus = [
    { icon: "🔐", label: "Autenticación",     status: "Activa",     ok: true },
    { icon: "📡", label: "Conexión Backend",  status: "Estable",    ok: true },
    { icon: "💾", label: "Base de Datos",     status: "PostgreSQL", ok: true },
  ];

  return (
    <ProtectedLayout>
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

          .dash-root {
            font-family: 'Barlow', sans-serif;
            min-height: 100vh;
            background-color: #0a0a0b;
            color: #f0f0f0;
            position: relative;
          }

          .dash-root::before {
            content: '';
            position: fixed;
            inset: 0;
            background:
              radial-gradient(ellipse 70% 50% at 5% 5%, rgba(180, 20, 20, 0.12) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 95% 95%, rgba(180, 20, 20, 0.07) 0%, transparent 60%);
            pointer-events: none;
            z-index: 0;
          }

          .bg-grid-dash {
            position: fixed;
            inset: 0;
            background-image:
              linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
            background-size: 48px 48px;
            pointer-events: none;
            z-index: 0;
          }

          /* HEADER */
          .dash-header {
            position: sticky;
            top: 0;
            z-index: 50;
            background: rgba(10,10,11,0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }

          .dash-header-inner {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 24px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .header-logo {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .header-emblem {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #c81e1e, #7f1d1d);
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 0 0 1px rgba(200,30,30,0.35);
            flex-shrink: 0;
          }

          .header-name {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #f0f0f0;
          }

          .header-name span { color: #ef4444; }

          .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .header-avatar {
            width: 34px;
            height: 34px;
            border-radius: 8px;
            background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05));
            border: 1px solid rgba(239,68,68,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 15px;
            font-weight: 800;
            color: #ef4444;
          }

          .header-user-info {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }

          .header-username {
            font-size: 13px;
            font-weight: 600;
            color: #e0e0e0;
            line-height: 1;
          }

          .header-role-badge {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-top: 3px;
          }

          /* MAIN CONTENT */
          .dash-main {
            position: relative;
            z-index: 1;
            max-width: 900px;
            margin: 0 auto;
            padding: 32px 24px 80px;
          }

          /* WELCOME BANNER */
          .welcome-banner {
            background: rgba(15,15,18,0.9);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 28px 32px;
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
            animation: fadeSlideUp 0.4s ease both;
          }

          .welcome-banner::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 3px;
            background: linear-gradient(to bottom, #ef4444, #7f1d1d);
          }

          .welcome-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }

          .welcome-greeting {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 28px;
            font-weight: 900;
            color: #f5f5f5;
            letter-spacing: 0.02em;
          }

          .welcome-greeting span { color: #ef4444; }

          .welcome-desc {
            font-size: 13px;
            color: rgba(255,255,255,0.38);
            margin-top: 6px;
          }

          .status-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(34,197,94,0.08);
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: 20px;
            padding: 6px 14px;
            font-size: 12px;
            font-weight: 600;
            color: #4ade80;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #4ade80;
            box-shadow: 0 0 6px #4ade80;
            animation: pulse-dot 2s ease-in-out infinite;
          }

          /* STATS */
          .stats-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
            animation: fadeSlideUp 0.4s 0.08s ease both;
          }

          @media (min-width: 480px) {
            .stats-row { grid-template-columns: repeat(4, 1fr); }
          }

          .stat-tile {
            background: rgba(15,15,18,0.9);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px;
            padding: 18px;
            transition: border-color 0.2s;
          }

          .stat-tile:hover {
            border-color: rgba(239,68,68,0.2);
          }

          .stat-icon {
            font-size: 22px;
            margin-bottom: 8px;
          }

          .stat-value {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 20px;
            font-weight: 800;
            color: #f0f0f0;
            line-height: 1;
            margin-bottom: 4px;
          }

          .stat-key {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.3);
          }

          /* SECTION TITLE */
          .section-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
          }

          .section-title {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.35);
          }

          .section-divider {
            flex: 1;
            height: 1px;
            background: rgba(255,255,255,0.05);
          }

          /* PROFILE CARD */
          .profile-card {
            background: rgba(15,15,18,0.9);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 20px;
            animation: fadeSlideUp 0.4s 0.14s ease both;
          }

          .profile-avatar {
            width: 60px;
            height: 60px;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.04));
            border: 1px solid rgba(239,68,68,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 26px;
            font-weight: 900;
            color: #ef4444;
            flex-shrink: 0;
          }

          .profile-info { flex: 1; }

          .profile-name {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #f5f5f5;
            letter-spacing: 0.02em;
            line-height: 1;
            margin-bottom: 5px;
          }

          .profile-rank {
            font-size: 13px;
            color: rgba(255,255,255,0.4);
            margin-bottom: 10px;
          }

          .profile-badges {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .p-badge {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 5px;
          }

          .p-badge-red    { background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.25);  color: #ef4444; }
          .p-badge-orange { background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.25); color: #f97316; }
          .p-badge-blue   { background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.25); color: #60a5fa; }

          .profile-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
          }

          .meta-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.2);
          }

          .meta-value {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 18px;
            font-weight: 800;
            color: rgba(255,255,255,0.6);
          }

          /* QUICK ACTIONS */
          .quick-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 24px;
            animation: fadeSlideUp 0.4s 0.2s ease both;
          }

          @media (min-width: 480px) {
            .quick-grid { grid-template-columns: repeat(4, 1fr); }
          }

          .quick-btn {
            background: rgba(15,15,18,0.9);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 14px;
            padding: 20px 16px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            color: inherit;
          }

          .quick-btn:hover {
            border-color: rgba(239,68,68,0.25);
            background: rgba(239,68,68,0.04);
            transform: translateY(-2px);
          }

          .quick-btn:active {
            transform: translateY(0);
          }

          .quick-btn.accent {
            border-color: rgba(239,68,68,0.3);
            background: rgba(239,68,68,0.06);
          }

          .quick-btn.accent:hover {
            border-color: rgba(239,68,68,0.5);
            background: rgba(239,68,68,0.1);
          }

          .quick-icon {
            font-size: 26px;
            margin-bottom: 8px;
          }

          .quick-label {
            font-size: 12px;
            font-weight: 600;
            color: rgba(255,255,255,0.6);
            line-height: 1.3;
          }

          .quick-btn.accent .quick-label {
            color: rgba(239,68,68,0.9);
          }

          /* SYSTEM STATUS */
          .system-card {
            background: rgba(15,15,18,0.9);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 24px;
            animation: fadeSlideUp 0.4s 0.26s ease both;
          }

          .system-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }

          .system-title {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.35);
          }

          .op-badge {
            display: flex;
            align-items: center;
            gap: 5px;
            background: rgba(34,197,94,0.08);
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #4ade80;
          }

          .op-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #4ade80;
            animation: pulse-dot 2s ease-in-out infinite;
          }

          .system-divider {
            height: 1px;
            background: rgba(255,255,255,0.05);
            margin-bottom: 16px;
          }

          .system-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
          }

          .system-row + .system-row {
            border-top: 1px solid rgba(255,255,255,0.04);
          }

          .system-row-left {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            color: rgba(255,255,255,0.45);
          }

          .system-row-status {
            font-size: 13px;
            font-weight: 600;
            color: #4ade80;
          }

          /* ANIMATIONS */
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>

        <div className="dash-root">
          <div className="bg-grid-dash" />

          {/* HEADER */}
          <header className="dash-header">
            <div className="dash-header-inner">
              <div className="header-logo">
                <div className="header-emblem">🔥</div>
                <div className="header-name">BOMBEROS<span>APP</span></div>
              </div>
              <div className="header-right">
                <div className="header-user-info">
                  <div className="header-username">{user?.profile?.fullName || user?.username}</div>
                  <div className="header-role-badge" style={{ color: roleConfig.color }}>
                    {roleConfig.icon} {roleConfig.label}
                  </div>
                </div>
                <div className="header-avatar">{initial}</div>
              </div>
            </div>
          </header>

          {/* MAIN */}
          <main className="dash-main">

            {/* Welcome Banner */}
            <div className="welcome-banner">
              <div className="welcome-row">
                <div>
                  <div className="welcome-greeting">
                    Hola, <span>{firstName}</span>
                  </div>
                  <div className="welcome-desc">
                    Sistema operativo · Todo conectado y funcionando correctamente.
                  </div>
                </div>
                <div className="status-pill">
                  <div className="status-dot" />
                  En línea
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-tile">
                <div className="stat-icon">{roleConfig.icon}</div>
                <div className="stat-value">{roleConfig.label}</div>
                <div className="stat-key">Rol</div>
              </div>
              <div className="stat-tile">
                <div className="stat-icon">🪪</div>
                <div className="stat-value">{user?.profile?.badge || "---"}</div>
                <div className="stat-key">Legajo</div>
              </div>
              <div className="stat-tile">
                <div className="stat-icon">🎖️</div>
                <div className="stat-value" style={{ fontSize: '14px' }}>{user?.profile?.rank || "—"}</div>
                <div className="stat-key">Rango</div>
              </div>
              <div className="stat-tile">
                <div className="stat-icon">✅</div>
                <div className="stat-value">Activo</div>
                <div className="stat-key">Estado</div>
              </div>
            </div>

            {/* Profile */}
            <div className="section-header">
              <div className="section-title">Perfil</div>
              <div className="section-divider" />
            </div>

            <div className="profile-card">
              <div className="profile-avatar">{initial}</div>
              <div className="profile-info">
                <div className="profile-name">
                  {user?.profile?.fullName || user?.username || "Bombero"}
                </div>
                <div className="profile-rank">
                  {user?.profile?.rank || "Sin rango asignado"}
                </div>
                <div className="profile-badges">
                  <span className={`p-badge ${
                    user?.role === "ADMIN"       ? "p-badge-red" :
                    user?.role === "FIREFIGHTER" ? "p-badge-orange" :
                    "p-badge-blue"
                  }`}>
                    {roleConfig.icon} {user?.role}
                  </span>
                </div>
              </div>
              {user?.profile?.badge && (
                <div className="profile-meta">
                  <div className="meta-label">Legajo</div>
                  <div className="meta-value">#{user.profile.badge}</div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="section-header">
              <div className="section-title">Acciones Rápidas</div>
              <div className="section-divider" />
            </div>

            <div className="quick-grid">
              {quickActions.map((a) => (
                <button
                  key={a.id}
                  className={`quick-btn${a.accent ? " accent" : ""}`}
                  onClick={() => setActiveQuick(a.id)}
                >
                  <div className="quick-icon">{a.icon}</div>
                  <div className="quick-label">{a.label}</div>
                </button>
              ))}
            </div>

            {/* System Status */}
            <div className="section-header">
              <div className="section-title">Estado del Sistema</div>
              <div className="section-divider" />
            </div>

            <div className="system-card">
              <div className="system-header">
                <div className="system-title">Infraestructura</div>
                <div className="op-badge">
                  <div className="op-dot" />
                  Operativo
                </div>
              </div>
              <div className="system-divider" />
              {systemStatus.map((s) => (
                <div className="system-row" key={s.label}>
                  <div className="system-row-left">
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                  <div className="system-row-status">{s.status}</div>
                </div>
              ))}
            </div>

          </main>
        </div>
      </>
    </ProtectedLayout>
  );
}