"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { getErrorMessage } from "@/lib/get-error-message";
import { deleteAssetRequest } from "@/services/assets.service";
import { useAuth } from "@/features/auth/auth-context";
import type { Asset } from "@/types/asset";

// Accion irreversible separada del formulario: exige escribir el nombre del movil para confirmar.
export function DeleteVehicle({ asset }: { asset: Asset }) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [typed, setTyped] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  if (user?.role !== "ADMIN" && user?.role !== "OPERATOR") return null;
  async function remove() {
    setBusy(true); setError("");
    try {
      await deleteAssetRequest(asset.id);
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      router.push("/equipment");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo dar de baja la unidad"));
      setBusy(false);
    }
  }
  return (
    <section aria-label="Dar de baja la unidad" className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
      <h2 className="font-bold text-red-200">Dar de baja la unidad</h2>
      <p className="mt-1 text-sm text-white/70">La unidad deja de figurar en la flota. Su historial de controles y salidas se conserva. Para confirmar, escribí el nombre del móvil.</p>
      <label className="mt-3 block"><span className="sr-only">Nombre del móvil</span><input className="app-input" value={typed} onChange={(event) => setTyped(event.target.value)} placeholder={asset.name} /></label>
      <button type="button" disabled={busy || typed.trim() !== asset.name.trim()} onClick={() => void remove()} className="app-button mt-3 w-auto border-red-500/50 text-red-200">
        <Trash2 className="h-4 w-4" aria-hidden /> {busy ? "Dando de baja…" : "Dar de baja"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    </section>
  );
}
