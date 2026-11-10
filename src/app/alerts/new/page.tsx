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
} from "lucide-react";
import { useCreateAlert } from "@/hooks/use-alerts";
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
  | "inundacion";

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
];

const priorities: PriorityOption[] = [
  { id: "alta", label: "Alta", dotClassName: "bg-red-500" },
  { id: "media", label: "Media", dotClassName: "bg-amber-400" },
  { id: "baja", label: "Baja", dotClassName: "bg-emerald-400" },
];

const emergencyTypeMap: Record<
  EmergencyType,
  "FIRE" | "RESCUE" | "ACCIDENT" | "CHEMICAL" | "MEDICAL" | "FLOOD"
> = {
  incendio: "FIRE",
  rescate: "RESCUE",
  accidente: "ACCIDENT",
  quimico: "CHEMICAL",
  medico: "MEDICAL",
  inundacion: "FLOOD",
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
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(false);
  const alertForm = useRef<HTMLFormElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdingRef = useRef(false);
  const submitArmed = useRef(false);

  const createAlertMutation = useCreateAlert();

  const selectedEmergencyLabel = useMemo(
    () =>
      emergencyTypes.find((item) => item.id === selectedEmergency)?.label ??
      "Emergencia",
    [selectedEmergency]
  );

  const isFormValid = address.trim().length > 0 && Boolean(title.trim() || notes.trim());

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
      setStatusMessage("Completá la ubicación y una descripción antes de despachar.");
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
      });

      setStatusType("success");
      setStatusMessage(`Alerta de ${selectedEmergencyLabel.toLowerCase()} emitida correctamente.`);
      setTitle("");
      setAddress("");
      setNotes("");
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
          title="Despachar Nueva Alerta"
          subtitle="Emisión inmediata de llamada de emergencia a la dotación de bomberos"
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

        <form ref={alertForm} onSubmit={handleSubmit} className="space-y-6">
          {/* Emergency type selector */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#121316] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <label className="font-[family-name:var(--font-bebas)] text-xl uppercase tracking-wider text-white">
                1. Tipo de Siniestro
              </label>
              <span className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-wider text-red-400">
                Seleccionado: {selectedEmergencyLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {emergencyTypes.map((item) => {
                const Icon = item.icon;
                const isActive = selectedEmergency === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedEmergency(item.id)}
                    className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-4 text-center transition-all ${
                      isActive
                        ? "border-red-500 bg-red-500/15 text-white shadow-lg shadow-red-900/30 ring-1 ring-red-400"
                        : "border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform ${
                        isActive
                          ? "bg-red-500 text-white"
                          : "bg-white/[0.04] text-white/70"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-wider">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority selector */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#121316] p-5 sm:p-6 shadow-xl space-y-4">
            <label className="font-[family-name:var(--font-bebas)] text-xl uppercase tracking-wider text-white block border-b border-white/[0.06] pb-3">
              2. Nivel de Prioridad
            </label>

            <div className="grid grid-cols-3 gap-3">
              {priorities.map((item) => {
                const isActive = selectedPriority === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedPriority(item.id)}
                    className={`flex items-center justify-center gap-2.5 rounded-xl border py-3 text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-barlow-condensed)] transition-all ${
                      isActive
                        ? "border-white/30 bg-white/10 text-white ring-1 ring-white/20"
                        : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location and details */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#121316] p-5 sm:p-6 shadow-xl space-y-4">
            <label className="font-[family-name:var(--font-bebas)] text-xl uppercase tracking-wider text-white block border-b border-white/[0.06] pb-3">
              3. Datos del Despacho
            </label>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="location"
                  className="block font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5"
                >
                  Ubicación / Dirección exacta <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                  <input
                    id="location"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Ruta 8 Km 612 / Calle San Martín 450"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="block font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5"
                >
                  Título descriptivo (opcional)
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Por defecto: ${selectedEmergencyLabel}`}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15"
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5"
                >
                  Observaciones / Novedades iniciales
                </label>
                <div className="relative">
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalles de víctimas, vehículos involucrados, dotaciones requeridas..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <p className="mb-2 text-sm text-white/60">
              La ubicación y una descripción (título u observaciones) son obligatorias.
            </p>
            <p id="hold-to-confirm-instructions" className="mb-2 text-sm text-white/60">
              Mantené presionado durante 1,5 segundos. Soltá antes para cancelar.
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
                  ? "Transmitiendo Alerta a la Dotación..."
                  : holding
                    ? "Mantené presionado..."
                    : "Mantener presionado para despachar alerta"}
              </span>
            </Button>
          </div>
        </form>
      </AnimatedPage>
    </ProtectedLayout>
  );
}
