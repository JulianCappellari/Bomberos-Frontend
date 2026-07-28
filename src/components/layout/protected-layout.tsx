"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Bell,
  CalendarDays,
  Flame,
  Home,
  LogOut,
  MessageCircle,
  Siren,
  Truck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { BackButton, HomeButton } from "@/components/layout/navigation-buttons";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", Icon: Home },
  { href: "/alerts", label: "Alertas", Icon: Bell },
  { href: "/incidents", label: "Incid.", Icon: Siren },
  { href: "/chat", label: "Chat", Icon: MessageCircle },
  { href: "/calendar", label: "Guardias", Icon: CalendarDays },
  { href: "/station", label: "Cuartel", Icon: UserCheck },
  { href: "/equipment", label: "Equipos", Icon: Truck },
];

export function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

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
        <div className="flex min-w-0 items-center gap-2">
          {!isDashboard && <BackButton />}
          <div className="app-header-title truncate">
            <span className="inline-flex items-center gap-2">
              <Flame className="h-5 w-5 shrink-0 text-red-500" />
              SAMPACHO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isDashboard && <HomeButton />}
          <Link className="btn-icon" href="/alerts" aria-label="Alertas">
            <Bell className="h-5 w-5" />
          </Link>
          <button className="btn-icon" onClick={logout} aria-label="Salir">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {children}

      <nav className="bottom-nav bottom-nav-visible">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.Icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-btn ${active ? "nav-btn-active" : ""}`}
            >
              <div className="nav-icon">
                <Icon className="h-5 w-5" />
              </div>
              <div className="nav-label">{item.label}</div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
