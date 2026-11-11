"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Droplets,
  Flame,
  ShieldPlus,
  Siren,
  Stethoscope,
  TestTube2,
  Send,
  MapPin,
  Phone,
  CircleHelp,
} from "lucide-react";
import { useCreateAlert } from "@/hooks/use-alerts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import AlertStatus from "@/components/ui/alert-status";
import { getErrorMessage } from "@/lib/get-error-message";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { AnimatedPage } from "@/components/ui/animated-layout";

type EmergencyType =
  | "incendio"
  | "rescate"
  | "accidente"
  | "quimico"
  | "medico"
  | "inundacion"
  | "otro";

type Priority = "alta" | "media" | "baja";

type EmergencyOption = {
  id: EmergencyType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type PriorityOption = {
  id: Priority;
  label: string;
  dotClassName: string;
};

const emergencyTypes: EmergencyOption[] = [
  { id: "incendio", label: "Incendio", icon: Flame },
  { id: "rescate", label: "Rescate", icon: ShieldPlus },
  { id: "accidente", label: "Accidente", icon: Siren },
  { id: "quimico", label: "Químico", icon: TestTube2 },
  { id: "medico", label: "Médico", icon: Stethoscope },
  { id: "inundacion", label: "Inundación", icon: Droplets },
  { id: "otro", label: "Otro", icon: CircleHelp },
];

const priorities: PriorityOption[] = [
  { id: "alta", label: "Alta", dotClassName: "bg-red-500" },
  { id: "media", label: "Media", dotClassName: "bg-amber-400" },
  { id: "baja", label: "Baja", dotClassName: "bg-emerald-400" },
];

const emergencyTypeMap: Record<
  EmergencyType,
  "FIRE" | "RESCUE" | "ACCIDENT" | "CHEMICAL" | "MEDICAL" | "FLOOD" | "OTHER"
> = {
  incendio: "FIRE",
  rescate: "RESCUE",
  accidente: "ACCIDENT",
  quimico: "CHEMICAL",
  medico: "MEDICAL",
  inundacion: "FLOOD",
  otro: "OTHER",
};

const priorityMap: Record<Priority, "HIGH" | "MEDIUM" | "LOW"> = {
  alta: "HIGH",
  media: "MEDIUM",
  baja: "LOW",
};

const HOLD_TO_CONFIRM_MS = 1500;

export default function NewAlertPage() {
  const [selectedEmergency, setSelectedEmergency] =
    useState<EmergencyType>("incendio");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("alta");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(false);
  const alertForm = useRef<HTMLFormElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdingRef = useRef(false);
  const submitArmed = useRef(false);

  const createAlertMutation = useCreateAlert();
  // 5: direcciones usadas en alertas y avisos anteriores, ordenadas por frecuencia, para autocompletar.
  const frequent = useQuery({ queryKey: ["station-locations"], queryFn: async () => (await api.get<Array<{ location: string; uses: number }>>("/station/locations")).data, staleTime: 300000 });

  const selectedEmergencyLabel = useMemo(
    () =>
      emergencyTypes.find((item) => item.id === selectedEmergency)?.label ??
      "Emergencia",
    [selectedEmergency]
  );

  const isFormValid = address.trim().length >= 4 && Boolean(title.trim() || notes.trim());

  const cancelHold = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (holdingRef.current) {
      holdingRef.current = false;
      setHolding(false);
      setHoldProgress(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("pointerup", cancelHold);
    window.addEventListener("pointercancel", cancelHold);
    window.addEventListener("keyup", cancelHold);
    window.addEventListener("blur", cancelHold);
    return () => {
      window.removeEventListener("pointerup", cancelHold);
      window.removeEventListener("pointercancel", cancelHold);
      window.removeEventListener("keyup", cancelHold);
      window.removeEventListener("blur", cancelHold);
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = null;
      holdingRef.current = false;
    };
  }, [cancelHold]);

  function startHold() {
    if (!isFormValid || createAlertMutation.isPending || holdingRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    setHoldProgress(false);
    requestAnimationFrame(() => {
      if (holdingRef.current) setHoldProgress(true);
    });
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      holdingRef.current = false;
      setHolding(false);
      setHoldProgress(false);
      submitArmed.current = true;
      alertForm.current?.requestSubmit();
      submitArmed.current = false;
    }, HOLD_TO_CONFIRM_MS);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submitArmed.current) {
      setStatusType("error");
      setStatusMessage("Mantené presionado el botón de despacho para confirmar la alerta.");
      return;
    }
    submitArmed.current = false;

    if (!address.trim() || (!title.trim() && !notes.trim())) {
      setStatusType("error");
      setStatusMessage("Completá la ubicación y qué está pasando antes de despachar.");
      return;
    }

    setStatusMessage("");
    setStatusType("");

    const fullDescription = [
      title.trim(),
      notes.trim(),
    ].filter(Boolean).join(" · ");

    try {
      await createAlertMutation.mutateAsync({
        description: fullDescription,
        location: address.trim(),
        type: emergencyTypeMap[selectedEmergency],
        priority: priorityMap[selectedPriority],
        ...(phone.trim() ? { contactPhone: phone.trim() } : {}),
      });

      setStatusType("success");
      setStatusMessage(`Alerta de ${selectedEmergencyLabel.toLowerCase()} emitida correctamente.`);
      setTitle("");
      setAddress("");
      setNotes("");
      setPhone("");
    } catch (error: unknown) {
      setStatusType("error");
      setStatusMessage(
        getErrorMessage(
          error,
          "No se pudo crear la alerta. Verificá tu conexión e intentá nuevamente."
        )
      );
    }
  }

  return (
    <ProtectedLayout>
      <AnimatedPage className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Despachar alerta"
          subtitle="Convoca a la dotación al instante. Completá los 3 pasos y confirmá."
          icon={<AlertTriangle className="h-6 w-6" />}
        />

        {statusMessage && statusType && (
          <AlertStatus
            feedbackType={statusType}
            feedbackMessage={statusMessage}
            onClose={() => {
              setStatusMessage("");
              setStatusType("");
            }}
          />
        )}

        <form ref={alertForm} onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Donde: es el dato que la dotacion necesita primero para salir. */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#121316] p-4 sm:p-6 space-y-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">1</span> ¿Dónde?</h2>
            <div>
              <label htmlFor="location" className="mb-1.5 block text-sm font-semibold text-white/80">Dirección o referencia <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" aria-hidden />
                <input id="location" type="text" required autoFocus autoComplete="off" list="frequent-locations" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej. San Martín 450 / Ruta 8 km 612" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 outline-none transition-all focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 pl-10" />
              </div>
            </div>
            <datalist id="frequent-locations">{frequent.data?.map((row) => <option key={row.location} value={row.location}>{row.uses > 1 ? `${row.uses} avisos anteriores` : "1 aviso anterior"}</option>)}</datalist>
            {!address && frequent.data && frequent.data.length > 0 && <div className="-mt-1 flex flex-wrap gap-2" aria-label="Direcciones frecuentes">{frequent.data.slice(0, 4).map((row) => <button key={row.location} type="button" onClick={() => setAddress(row.location)} className="max-w-full truncate rounded-full border border-[var(--bord)] px-3 py-1 text-xs text-[var(--mut)] hover:text-[var(--txt)]">{row.location}</button>)}</div>}
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-white/80">Teléfono de quien avisa <span className="font-normal text-white/50">(opcional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" aria-hidden />
                <input id="phone" type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Para poder volver a llamar" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 outline-none transition-all focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15 pl-10" />
              </div>
            </div>
          </section>

          {/* 2. Que: tipo y prioridad compactos, sin ocupar toda la pantalla del celular. */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#121316] p-4 sm:p-6 space-y-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">2</span> ¿Qué pasa?</h2>
            <div role="radiogroup" aria-label="Tipo de siniestro" className="grid grid-cols-3 gap-2 sm:grid-cols-7">
              {emergencyTypes.map((item) => {
                const Icon = item.icon;
                const isActive = selectedEmergency === item.id;
                return (
                  <button key={item.id} type="button" role="radio" aria-checked={isActive} onClick={() => setSelectedEmergency(item.id)}
                    className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-xs font-semibold transition-colors ${isActive ? "border-red-500 bg-red-500/15 text-white ring-1 ring-red-400" : "border-white/[0.08] bg-white/[0.02] text-white/65 hover:border-white/20 hover:text-white"}`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-red-400" : ""}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div>
              <p className="mb-1.5 block text-sm font-semibold text-white/80" id="priority-label">Prioridad</p>
              <div role="radiogroup" aria-labelledby="priority-label" className="grid grid-cols-3 gap-2">
                {priorities.map((item) => {
                  const isActive = selectedPriority === item.id;
                  return (
                    <button key={item.id} type="button" role="radio" aria-checked={isActive} onClick={() => setSelectedPriority(item.id)}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${isActive ? "border-white/40 bg-white/10 text-white ring-1 ring-white/20" : "border-white/[0.08] bg-white/[0.02] text-white/55 hover:text-white"}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} aria-hidden />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3. Detalle: un solo campo obligatorio; el titulo es un atajo opcional. */}
          <section className="rounded-2xl border border-white/[0.08] bg-[#121316] p-4 sm:p-6 space-y-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold">3</span> Detalles</h2>
            <div>
              <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-white/80">¿Qué está pasando? <span className="text-red-400">*</span></label>
              <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Víctimas, vehículos, riesgos, accesos, qué se necesita…" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 outline-none transition-all focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15" />
            </div>
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-white/80">Título corto <span className="font-normal text-white/50">(opcional)</span></label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Ej. ${selectedEmergencyLabel} en vivienda`} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 outline-none transition-all focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15" />
            </div>
          </section>

          {/* Submit button */}
          <div className="pt-2">
            <div className="mb-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-sm" aria-live="polite">
              <p className="text-white/55">Se va a convocar a la dotación por:</p>
              <p className="mt-1 font-semibold text-white">{selectedEmergencyLabel} · prioridad {selectedPriority}{address.trim() ? ` · ${address.trim()}` : ""}</p>
              {!isFormValid && <p className="mt-1 text-amber-300">Falta {address.trim().length < 4 ? "la dirección (mínimo 4 caracteres)" : "describir qué está pasando"}.</p>}
            </div>
            <p id="hold-to-confirm-instructions" className="mb-2 text-sm text-white/60">
              Para evitar envíos accidentales, mantené presionado el botón 1,5 segundos.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!isFormValid || createAlertMutation.isPending}
              loading={createAlertMutation.isPending}
              icon={createAlertMutation.isPending ? undefined : <Send className="h-5 w-5" />}
              className={`relative w-full touch-none overflow-hidden ${holding ? "ring-2 ring-red-300" : ""}`}
              aria-pressed={holding}
              aria-describedby="hold-to-confirm-instructions"
              onPointerDown={(event) => {
                if (event.button !== 0 || !event.isPrimary) return;
                event.preventDefault();
                startHold();
              }}
              onPointerLeave={cancelHold}
              onKeyDown={(event) => {
                if (event.key !== " " && event.key !== "Enter") return;
                event.preventDefault();
                startHold();
              }}
              onKeyUp={cancelHold}
            >
              {holding && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-white/20 transition-[width] ease-linear"
                  style={{
                    width: holdProgress ? "100%" : "0%",
                    transitionDuration: `${HOLD_TO_CONFIRM_MS}ms`,
                  }}
                />
              )}
              <span className="relative">
                {createAlertMutation.isPending
                  ? "Enviando alerta a la dotación…"
                  : holding
                    ? "Seguí presionando…"
                    : "Mantener presionado para despachar"}
              </span>
            </Button>
          </div>
        </form>
      </AnimatedPage>
    </ProtectedLayout>
  );
}
