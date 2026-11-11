"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ClipboardCheck, ScanLine, Users } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import { getAssetsRequest } from "@/services/assets.service";
import { vehicleKinds } from "@/types/asset";
import { useControlEligibility } from "@/hooks/use-control-eligibility";
import { NextControlBanner } from "@/components/operations/next-control-banner";

// Paso a paso del control semanal: semana del grupo -> ingreso QR -> elegir movil -> planilla.
export default function VehicleControlPage() {
  const { user } = useAuth(); const [id, setId] = useState("");
  const [kind, setKind] = useState("");
  const query = useQuery({ queryKey: ["control-vehicles", user?.id], queryFn: getAssetsRequest, enabled: Boolean(user) });
  const eligibility = useControlEligibility();
  const canInspect = eligibility.data?.allowed;
  const vehicles = query.data?.filter((asset) => asset.assetType === "VEHICLE" && asset.vehicle && (!kind || (asset.vehicle.kind || "UNCLASSIFIED") === kind)) ?? [];
  return <ProtectedLayout><section className="screen-body">
    <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><ClipboardCheck className="h-6 w-6 text-red-400" aria-hidden /> Control de móviles</h1>
    <p className="mt-1 text-sm text-[var(--mut)]">Cada grupo controla los móviles en su semana (lunes a domingo). Todos los integrantes firman su participación dentro de las 24 horas.</p>

    {eligibility.isLoading && <p role="status" className="mt-5">Consultando tu semana de control…</p>}
    {eligibility.isError && <p role="alert" className="mt-5 text-red-300">No se pudo verificar tu grupo de control. <button className="underline" onClick={() => eligibility.refetch()}>Reintentar</button></p>}

    {eligibility.data && !canInspect && (
      <div className="mt-5 space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-[var(--card)] p-4">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden />
          <div>
            <p className="font-semibold text-white">{eligibility.data.group ? "Esta semana no le toca a tu grupo" : "Todavía no integrás un grupo de control"}</p>
            <p className="mt-1 text-sm text-[var(--mut)]">{eligibility.data.group ? "Cuando llegue tu semana vas a poder abrir la planilla desde acá. Si te piden ayuda, otro grupo puede sumarte como ayudante." : "Pedile a administración que te asigne a un grupo. Mientras tanto podés sumarte como ayudante en el control de otro grupo."}</p>
          </div>
        </div>
        <NextControlBanner />
        <Link href="/equipment" className="app-button app-button-outline w-auto">Ver estado de los móviles</Link>
      </div>
    )}

    {canInspect && <div className="mt-5 max-w-2xl space-y-4">
      <ol className="space-y-2 text-sm text-white/80">
        <li className="flex items-center gap-2"><Users className="h-4 w-4 text-emerald-400" aria-hidden />Esta semana le toca a tu grupo{eligibility.data?.group ? `: ${eligibility.data.group.name}` : ""}.</li>
        <li className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-sky-300" aria-hidden />Necesitás tener tu ingreso al cuartel registrado con el QR. <Link href="/attendance" className="text-red-300 underline">Registrar</Link></li>
      </ol>
      {query.isError && <p role="alert" className="text-red-300">No se pudieron cargar los móviles.</p>}{query.isLoading && <ListSkeleton label="Cargando móviles" />}
      <label className="block"><span className="app-label">Tipo de móvil</span><select className="app-input" value={kind} onChange={(e) => { setKind(e.target.value); setId(""); }}><option value="">Todos los tipos</option>{Object.entries(vehicleKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="block"><span className="app-label">Móvil a controlar</span><select className="app-input" value={id} onChange={(e) => setId(e.target.value)}><option value="">Seleccionar unidad</option>{vehicles.map((asset) => <option key={asset.id} value={asset.id}>{asset.vehicle?.unitNumber} · {asset.name} · {asset.vehicle?.plate || "Sin patente"}</option>)}</select></label>
      {id ? <Link className="app-button app-button-red w-auto" href={`/equipment/${id}/inspection/new`}>Abrir planilla de control</Link> : <p className="text-sm text-[var(--mut)]">Elegí un móvil para abrir su planilla.</p>}
    </div>}
  </section></ProtectedLayout>;
}
