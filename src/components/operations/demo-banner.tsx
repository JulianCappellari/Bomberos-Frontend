"use client";
import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

// Franja fija de la cuenta demo: nadie puede confundir una alerta o un dato de prueba con uno real.
export function DemoBanner() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user?.demo) return null;
  async function changeProfile() {
    await logout();
    router.replace("/login#demo");
  }
  return (
    <aside aria-label="Modo demostración" className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3">
      <FlaskConical className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-barlow-condensed)] text-sm font-bold tracking-wider text-amber-200 uppercase">Modo demostración</p>
        <p className="text-xs text-[var(--mut)]">Todos los datos son ficticios. Podés probar cualquier función: se simula y no se guarda ningún cambio.</p>
      </div>
      <button type="button" onClick={() => void changeProfile()} className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/15">
        Cambiar de perfil
      </button>
    </aside>
  );
}
