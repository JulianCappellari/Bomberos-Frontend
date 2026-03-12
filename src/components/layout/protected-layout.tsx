"use client";

import { useAuth } from "@/features/auth/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/alerts", label: "Alertas", icon: "🔔" },
  { href: "/attendance", label: "Horas", icon: "⏱" },
  { href: "/users", label: "Usuarios", icon: "👥" },
  { href: "/assets", label: "Equipos", icon: "🚒" },
];

export function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--txt)] flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-title">
          🚒 <span>SAMPACHO</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-icon">🔔</button>
          <button className="btn-icon" onClick={logout}>
            🚪
          </button>
        </div>
      </header>

      {children}

      <nav className="bottom-nav bottom-nav-visible">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-btn ${active ? "nav-btn-active" : ""}`}
            >
              <div className="nav-icon">{item.icon}</div>
              <div className="nav-label">{item.label}</div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}