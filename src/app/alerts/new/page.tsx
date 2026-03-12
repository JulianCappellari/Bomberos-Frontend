"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Droplets,
  Flame,
  ShieldPlus,
  Siren,
  Stethoscope,
  TestTube2,
} from "lucide-react";
import Link from "next/link";
import { useCreateAlert } from "@/hooks/use-alerts";
import AlertStatus from "@/components/ui/alert-status";

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

export default function EmergencyAlertPage() {
  const [selectedEmergency, setSelectedEmergency] =
    useState<EmergencyType>("incendio");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("alta");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">(
    "success",
  );
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const createAlertMutation = useCreateAlert();

  const isSubmitDisabled = useMemo(() => {
    return location.trim().length < 4 || createAlertMutation.isPending;
  }, [location, createAlertMutation.isPending]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  setFeedbackOpen(false);

  if (location.trim().length < 4) {
    setFeedbackType("error");
    setFeedbackMessage("Ingresá una ubicación válida.");
    setFeedbackOpen(true);
    return;
  }

  try {
    await createAlertMutation.mutateAsync({
      title:
        emergencyTypes.find((item) => item.id === selectedEmergency)?.label ||
        "Emergencia",
      type: emergencyTypeMap[selectedEmergency],
      description: description.trim() || undefined,
      location: location.trim(),
      contactPhone: phone.trim() || undefined,
      priority: priorityMap[selectedPriority],
    });

    setDescription("");
    setLocation("");
    setPhone("");
    setSelectedEmergency("incendio");
    setSelectedPriority("alta");

    setFeedbackType("success");
    setFeedbackMessage("La alerta fue enviada correctamente.");
    setFeedbackOpen(true);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };

    setFeedbackType("error");
    setFeedbackMessage(
      err?.response?.data?.message || "No se pudo enviar la alerta.",
    );
    setFeedbackOpen(true);
  }
}
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto min-h-screen w-full max-w-[1600px]">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative overflow-hidden border-white/5 bg-[radial-gradient(circle_at_top,rgba(255,77,79,0.14),transparent_28%),linear-gradient(180deg,#101114_0%,#09090b_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.08]" />

            <div className="relative flex h-full flex-col">
              <header className="border-b border-white/5 bg-[#0d0e11]/90 backdrop-blur">
                <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
                  <Link
                    href="/dashboard"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                    aria-label="Volver"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Link>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#ff5a52] sm:h-6 sm:w-6" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45 sm:text-xs">
                        Sistema de emergencias
                      </p>
                      <h1 className="text-sm font-black uppercase tracking-[0.16em] text-[#ff5a52] sm:text-base">
                        Nueva alerta
                      </h1>
                    </div>
                  </div>

                  <div className="w-11" />
                </div>
              </header>

              <div className="relative flex flex-1 items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ff4d4f]/20 bg-[#ff4d4f]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff928a] sm:text-xs">
                    <span className="h-2 w-2 rounded-full bg-[#ff4d4f]" />
                    Respuesta rápida
                  </div>

                  <h2 className="mt-5 text-3xl font-black uppercase leading-none tracking-[0.08em] text-white sm:text-4xl lg:text-5xl">
                    Reportá una emergencia
                    <span className="mt-2 block text-2xl text-white/45">
                      de forma clara y rápida
                    </span>
                  </h2>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-screen items-center justify-center px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-10">
            <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#111214] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.5)] sm:p-6 lg:p-7">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <FormSectionTitle title="Tipo de emergencia" />
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {emergencyTypes.map((item) => {
                      const Icon = item.icon;
                      const isActive = selectedEmergency === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedEmergency(item.id)}
                          className={[
                            "group min-h-[108px] rounded-2xl border px-3 py-4 text-left transition duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/30",
                            isActive
                              ? "border-[#ff4d4f] bg-[linear-gradient(180deg,rgba(255,77,79,0.18),rgba(255,77,79,0.08))] shadow-[0_0_0_1px_rgba(255,77,79,0.15)]"
                              : "border-white/10 bg-[#141518] hover:border-white/20 hover:bg-[#17181c]",
                          ].join(" ")}
                          aria-pressed={isActive}
                        >
                          <div className="flex h-full flex-col justify-between gap-4">
                            <div
                              className={[
                                "flex h-11 w-11 items-center justify-center rounded-xl border transition",
                                isActive
                                  ? "border-[#ff6a6c]/30 bg-[#ff4d4f]/15 text-[#ff7c7d]"
                                  : "border-white/10 bg-white/5 text-white/80",
                              ].join(" ")}
                            >
                              <Icon className="h-5 w-5" />
                            </div>

                            <div>
                              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-white sm:text-xs">
                                {item.label}
                              </div>
                              <div className="mt-1 text-[11px] text-white/35">
                                {isActive
                                  ? "Seleccionado"
                                  : "Tocar para elegir"}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <FormSectionTitle title="Prioridad" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {priorities.map((item) => {
                      const isActive = selectedPriority === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedPriority(item.id)}
                          className={[
                            "flex h-14 items-center justify-center gap-2 rounded-2xl border bg-[#141518] px-4 text-sm font-extrabold uppercase tracking-[0.08em] transition",
                            "focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/30",
                            isActive
                              ? "border-[#ff4d4f] bg-[linear-gradient(180deg,rgba(255,77,79,0.18),rgba(255,77,79,0.08))] text-[#ff9a9a]"
                              : "border-white/10 text-white hover:border-white/20 hover:bg-[#17181c]",
                          ].join(" ")}
                          aria-pressed={isActive}
                        >
                          <span
                            className={[
                              "h-3 w-3 rounded-full",
                              item.dotClassName,
                            ].join(" ")}
                          />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  <Field
                    label="Descripción de la emergencia (opcional)"
                    textarea
                    placeholder="Describe la situación..."
                    value={description}
                    onChange={setDescription}
                  />

                  <Field
                    label="📍 Ubicación / Dirección "
                    placeholder="Ej: Av. San Martín 1234"
                    value={location}
                    onChange={setLocation}
                  />

                  <Field
                    label="Teléfono de contacto (opcional)"
                    placeholder="+54 11 xxxx-xxxx"
                    value={phone}
                    onChange={setPhone}
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/45">
                    Resumen actual
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-white/75 sm:grid-cols-3">
                    <SummaryBadge
                      label="Emergencia"
                      value={selectedEmergency}
                    />
                    <SummaryBadge label="Prioridad" value={selectedPriority} />
                    <SummaryBadge
                      label="Direccion"
                      value={location || "Sin direccion"}
                    />
                  </div>
                </div>

                {feedbackOpen && (
                  <AlertStatus
                    feedbackType={feedbackType}
                    feedbackMessage={feedbackMessage}
                    onClose={() => setFeedbackOpen(false)}
                  />
                )}

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff4d4f] text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_30px_rgba(255,77,79,0.35)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {createAlertMutation.isPending
                    ? "Enviando..."
                    : "Enviar alerta"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FormSectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-white/45 sm:text-xs">
      {title}
    </h2>
  );
}

function Field({
  label,
  placeholder,
  textarea = false,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  textarea?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-white/55">
        {label}
      </span>

      {textarea ? (
        <textarea
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-white/10 bg-[#141518] px-4 py-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#ff4d4f]/70 focus:ring-2 focus:ring-[#ff4d4f]/15"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-2xl border border-white/10 bg-[#141518] px-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#ff4d4f]/70 focus:ring-2 focus:ring-[#ff4d4f]/15"
        />
      )}
    </label>
  );
}

function SummaryBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#141518] px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize text-white">
        {value}
      </p>
    </div>
  );
}
