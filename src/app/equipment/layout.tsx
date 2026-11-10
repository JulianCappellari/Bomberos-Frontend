"use client";
import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { isManager } from "@/components/operations/operations-ui";
import { ProtectedLayout } from "@/components/layout/protected-layout";

export default function EquipmentLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const editing = pathname.endsWith("/new") || pathname.endsWith("/edit");
  const ownInspection = /^\/equipment\/[^/]+\/inspection\/new$/.test(pathname);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);
  if (isLoading) return <div className="min-h-screen bg-[var(--bg)] p-6 text-[var(--mut)]">Cargando...</div>;
  if (!isAuthenticated) return null;
  if (editing && !isManager(user?.role) && !ownInspection) return <ProtectedLayout><main className="min-h-screen bg-[var(--bg)] p-6 text-[var(--txt)]">
    <h1 className="text-xl font-bold">Acceso restringido</h1>
    <p className="mt-3 text-sm text-[var(--mut)]">Su usuario puede consultar los equipos. Las modificaciones requieren permisos de gestion.</p>
    <Link href="/equipment" className="app-button app-button-outline mt-5 w-auto">Volver a equipos</Link>
  </main></ProtectedLayout>;
  return pathname === "/equipment" ? children : <ProtectedLayout>{children}</ProtectedLayout>;
}
