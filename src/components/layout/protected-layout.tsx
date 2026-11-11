"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LogOut, Menu, Search, ChevronRight, Siren } from "lucide-react";
import { StationCrest } from "@/components/layout/station-crest";
import { useAuth } from "@/features/auth/auth-context";
import { PresencePrompt } from "@/components/operations/presence-prompt";
import { TaskSyncPanel } from "@/components/operations/task-sync-panel";
import { AppUpdateBanner } from "@/components/operations/app-lifecycle";
import { OfflineBanner, PendingAlertBanner } from "@/components/operations/status-banners";
import { StepUpDialog } from "@/components/operations/step-up-dialog";
import { NotificationBell } from "@/components/operations/notification-bell";
import { GuardMode } from "@/components/operations/guard-mode";
import { BackButton, HomeButton } from "@/components/layout/navigation-buttons";
import { isNavigationActive } from "@/lib/navigation-match";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { canOpenPage } from "@/lib/permissions";
import { isCivilRank } from "@/lib/permissions";
import { bottomNavHrefs, homeHref, isTechnicalAdmin, navGroups, navItems, visibleNavItems, type NavItem } from "@/lib/navigation";

function matchesQuery(item: NavItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.label.toLowerCase().includes(q) ||
    item.shortLabel.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q)
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavigationActive(pathname, item.href);
  const Icon = item.Icon;

  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-red-500/15 text-white"
          : "text-white/60 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r-full bg-red-500"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <Icon
        className={`h-4 w-4 shrink-0 ${
          active ? "text-red-400" : "text-white/40 group-hover:text-white/80"
        }`}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const home = homeHref(user);
  const isDashboard = pathname === home;

  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [now, setNow] = useState(() => new Date());

  const primaryNav = bottomNavHrefs(user).map((href) => navItems.find((item) => item.href === href)).filter((item): item is NavItem => Boolean(item));
  const inMore = !primaryNav.some((item) => isNavigationActive(pathname, item.href));
  const current =
    navItems.find((item) => isNavigationActive(pathname, item.href)) ?? navItems[0];
  const currentCategory =
    navGroups.find((group) => group.id === current.group)?.label ?? "Cuartel";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (user?.mustChangePassword && pathname !== "/security") {
      router.replace("/security");
    } else if (isTechnicalAdmin(user) && !user?.mustChangePassword && pathname === "/dashboard") {
      // B01/B02: solo el administrador tecnico entra al panel de gestion; oficiales ven su inicio personal.
      router.replace("/admin");
    } else if (isCivilRank(user?.profile?.rank) && !user?.mustChangePassword && pathname === "/dashboard") {
      // La Comision Directiva (civil) entra directo a su apartado: no tiene inicio de bombero.
      router.replace("/commission");
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMoreOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const frame = requestAnimationFrame(() => {
      if (window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches) document.getElementById("module-search")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [moreOpen]);

  const filteredNavItems = useMemo(
    () => visibleNavItems(user).filter((item) => matchesQuery(item, searchQuery)),
    [searchQuery, user],
  );

  const sidebarItems = useMemo(
    () => visibleNavItems(user).filter((item) => matchesQuery(item, sidebarQuery)),
    [sidebarQuery, user],
  );

  function closeModules() {
    setMoreOpen(false);
    setSearchQuery("");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] text-white">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-600/20" />
          <div className="relative"><StationCrest height={48} /></div>
        </div>
        <p className="font-[family-name:var(--font-barlow-condensed)] text-sm uppercase tracking-widest text-white/50">
          Cargando cuartel...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (user?.mustChangePassword && pathname !== "/security") return null;

  const initials =
    user?.profile?.fullName
      ?.split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || "BV";

  const clock = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  const today = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(now);

  return (
    <MotionConfig reducedMotion="user">
    <div className="app-shell flex min-h-screen text-white">
      <ProgressBar />
      <Toaster />
      <aside
        className="fixed top-0 left-0 z-30 hidden h-dvh w-[var(--sidebar)] flex-col border-r border-white/[0.08] bg-[#0c0e13]/95 backdrop-blur-xl lg:flex"
        aria-label="Navegación principal"
      >
        <div className="flex h-16 items-center border-b border-white/[0.08] px-4">
          <Link href={home} className="group flex min-w-0 items-center gap-3">
            <StationCrest height={40} />
            <div className="min-w-0">
              <div className="truncate font-[family-name:var(--font-bebas)] text-xl tracking-wider text-white">
                BOMBEROS <span className="text-red-500">SAMPACHO</span>
              </div>
              <div className="font-[family-name:var(--font-barlow-condensed)] text-[11px] font-bold tracking-wider text-white/40 uppercase">
                Sistema operativo
              </div>
            </div>
          </Link>
        </div>

        <div className="px-3 pt-3">
          <label className="relative block">
            <span className="sr-only">Buscar sección</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={sidebarQuery}
              onChange={(event) => setSidebarQuery(event.target.value)}
              placeholder="Buscar sección"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pr-3 pl-9 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-500/40 focus:ring-2 focus:ring-red-500/15"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navGroups.map((category) => {
            const items = sidebarItems.filter((item) => item.group === category.id);
            if (!items.length) return null;
            return (
              <div key={category.id}>
                <div className="mb-1.5 px-3 font-[family-name:var(--font-barlow-condensed)] text-[11px] font-bold tracking-wider text-white/45 uppercase">
                  {category.label}
                </div>
                <nav className="space-y-0.5">
                  {items.map((item) => (
                    <SidebarLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </nav>
              </div>
            );
          })}
          {!sidebarItems.length && (
            <p className="px-3 text-sm text-white/50">Ninguna sección coincide con esa búsqueda.</p>
          )}
        </div>

        <div className="border-t border-white/[0.08] p-3">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-600/20 text-xs font-bold text-red-300">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-white">
                  {user?.profile?.fullName || user?.username}
                </div>
                <div className="truncate font-[family-name:var(--font-barlow-condensed)] text-[11px] tracking-wider text-white/40 uppercase">
                  {user?.profile?.rank || user?.role || "Bombero"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="rounded-lg p-2 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[var(--sidebar)]">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0c0e13]/80 px-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {!isDashboard && <BackButton />}
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <StationCrest height={32} />
              <div className="truncate font-[family-name:var(--font-bebas)] text-xl tracking-wider text-white">
                <span className="sm:hidden">SAMPACHO</span>
                <span className="hidden sm:inline">
                  BOMBEROS <span className="text-red-500">SAMPACHO</span>
                </span>
              </div>
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="font-[family-name:var(--font-barlow-condensed)] text-[11px] font-bold tracking-[0.16em] text-white/40 uppercase">
                {currentCategory}
              </p>
              <h1 className="truncate font-[family-name:var(--font-bebas)] text-[1.65rem] leading-none tracking-wider text-white">
                {current.label}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white md:flex"
            >
              <Search className="h-4 w-4" />
              <span className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold tracking-wider uppercase">
                Buscar
              </span>
              <kbd className="rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-white/45">
                Ctrl K
              </kbd>
            </button>

            <div className="hidden text-right xl:block">
              <div className="font-[family-name:var(--font-bebas)] text-xl leading-none tracking-wider text-white">
                {clock}
              </div>
              <div className="font-[family-name:var(--font-barlow-condensed)] text-[11px] tracking-wider text-white/40 uppercase">
                {today}
              </div>
            </div>

            {!isDashboard && (
              <span className="lg:hidden">
                <HomeButton />
              </span>
            )}

            <NotificationBell />

            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 lg:hidden"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <GuardMode />

        <main className="mx-auto w-full max-w-[var(--content)] flex-1 px-3 py-5 pb-[calc(6.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-6 lg:px-8 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepUpDialog />
              <OfflineBanner />
              <PendingAlertBanner />
              <PresencePrompt />
              <TaskSyncPanel />
              <AppUpdateBanner />
              {canOpenPage(pathname, user?.role, user?.specialPermissions, user?.profile?.rank) ? children : <section className="p-5"><h1 className="text-xl font-bold">Acceso restringido</h1><p className="mt-2 text-sm">Su perfil no tiene permiso para consultar este apartado.</p><Link href={home} className="mt-3 inline-block underline">Volver al inicio</Link></section>}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {!pathname.startsWith("/alerts") && <Link href="/alerts/new" aria-label="Crear alerta de emergencia" title="Alerta de emergencia" className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-50 flex min-h-14 items-center gap-2 rounded-full border-2 border-white/80 bg-red-700 px-4 font-bold text-white shadow-xl transition hover:bg-red-600 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-300 lg:bottom-6 lg:right-6"><Siren className="h-6 w-6" /><span className="hidden sm:inline">ALERTA</span></Link>}

      <nav
        aria-label="Barra de navegación móvil"
        className="fixed inset-x-3 z-40 lg:hidden"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex h-[4.25rem] items-center justify-around rounded-2xl border border-white/10 bg-[#12151c]/92 px-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {primaryNav.map((item) => {
            const active = isNavigationActive(pathname, item.href);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                  active ? "text-red-400" : "text-white/60"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    className="absolute inset-x-1 inset-y-1 rounded-xl bg-red-500/12"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative max-w-full truncate px-1 font-[family-name:var(--font-barlow-condensed)] text-[10px] font-bold tracking-wider uppercase">
                  {item.shortLabel || item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 ${
              inMore ? "text-red-400" : "text-white/60"
            }`}
          >
            {inMore && (
              <motion.span
                layoutId="mobile-nav-pill"
                className="absolute inset-x-1 inset-y-1 rounded-xl bg-red-500/12"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <Menu className="relative h-5 w-5" />
            <span className="relative font-[family-name:var(--font-barlow-condensed)] text-[10px] font-bold tracking-wider uppercase">
              Menú
            </span>
          </button>
        </div>
      </nav>

      <Modal
        open={moreOpen}
        onClose={closeModules}
        title="Menú"
        description="Todas las secciones disponibles para tu cargo"
        size="lg"
      >
        <div className="space-y-5">
          <div className="relative">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/40" />
            <label htmlFor="module-search" className="sr-only">Buscar sección</label>
            <input
              id="module-search"
              type="text"
              placeholder="Buscar, por ejemplo: combustible, guardia, licencia"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-white/30 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 focus:outline-none"
            />
          </div>

          {filteredNavItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/45">
              No hay secciones con ese nombre.
            </p>
          ) : (
            navGroups.map((category) => {
              const items = filteredNavItems.filter((item) => item.group === category.id);
              if (!items.length) return null;
              return (
                <div key={category.id} className="space-y-2">
                  <h3 className="font-[family-name:var(--font-barlow-condensed)] text-[11px] font-bold tracking-[0.16em] text-white/50 uppercase">
                    {category.label}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {items.map((item) => {
                      const active = isNavigationActive(pathname, item.href);
                      const Icon = item.Icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeModules}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                            active
                              ? "border-red-500/50 bg-red-500/15 text-white"
                              : "border-white/[0.08] bg-white/[0.02] text-white/80 hover:border-white/20 hover:bg-white/[0.05]"
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              active
                                ? "bg-red-500 text-white"
                                : "border border-red-500/20 bg-red-500/10 text-red-300"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm leading-snug font-semibold">{item.label}</span>
                            <span className="block text-xs leading-snug text-white/55">{item.description}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      <Modal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="¿Cerrar sesión?"
        description="Vas a desconectarte del sistema de guardia activa."
        size="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-white/70">
            Confirmá que registraste las novedades de la guardia antes de salir.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setLogoutModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setLogoutModalOpen(false);
                logout();
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </MotionConfig>
  );
}
