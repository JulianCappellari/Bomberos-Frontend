"use client";

import { useRef, useState } from "react";
import jsQR from "jsqr";
import {
  CheckCircle2,
  CircleX,
  Clock,
  MapPin,
  ShieldCheck,
  Timer,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { getDeviceFingerprint } from "@/helper/getDeviceFingerprint";
import { formatWorkedTimeHM } from "@/helper/formatWorkedTime";
import { useMyAttendanceSummary } from "@/hooks/use-attendence";
import { useScanAttendanceQr } from "@/hooks/use-scan-attendance-qr";
import { getCurrentPositionAsync } from "@/lib/geolocation";
import { BackButton, HomeButton } from "@/components/layout/navigation-buttons";

type AttendanceModalState = {
  open: boolean;
  type: "success" | "error";
  title: string;
  description: string;
  action?: "CHECK_IN" | "CHECK_OUT";
  stationName?: string;
  distanceMeters?: number;
  workedMinutes?: number;
};

const initialModalState: AttendanceModalState = {
  open: false,
  type: "success",
  title: "",
  description: "",
};

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamingRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const processingRef = useRef(false);

  const [streaming, setStreaming] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [modal, setModal] = useState<AttendanceModalState>(initialModalState);

  const scanMutation = useScanAttendanceQr();
  const attendanceSummary = useMyAttendanceSummary();

  function closeModal() {
    setModal(initialModalState);
  }

  function openErrorModal(errorMessage: string) {
    setModal({
      open: true,
      type: "error",
      title: "No se pudo registrar la asistencia",
      description: errorMessage,
    });
  }

  function openSuccessModal(data: {
    action: "CHECK_IN" | "CHECK_OUT";
    stationName: string;
    distanceMeters: number;
    workedMinutes?: number;
  }) {
    setModal({
      open: true,
      type: "success",
      title:
        data.action === "CHECK_IN"
          ? "Entrada registrada"
          : "Salida registrada",
      description:
        data.action === "CHECK_IN"
          ? `Tu ingreso en ${data.stationName} se registró correctamente.`
          : `Tu salida en ${data.stationName} se registró correctamente.`,
      action: data.action,
      stationName: data.stationName,
      distanceMeters: data.distanceMeters,
      workedMinutes: data.workedMinutes,
    });
  }

  function stopCamera() {
    streamingRef.current = false;
    setStreaming(false);
    setLoadingMessage("");

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function processQrToken(qrToken: string) {
    processingRef.current = true;

    try {
      setLoadingMessage("Obteniendo ubicación...");
      const position = await getCurrentPositionAsync();
      const deviceFingerprint = getDeviceFingerprint();

      setLoadingMessage("Validando asistencia...");

      const result = await scanMutation.mutateAsync({
        qrToken,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        deviceFingerprint,
      });

      await attendanceSummary.refetch();

      if (result.action === "CHECK_IN") {
        const successMessage = `Entrada registrada en ${result.station.name}. Distancia: ${result.distanceMeters} m.`;
        setMessage(successMessage);
        openSuccessModal({
          action: "CHECK_IN",
          stationName: result.station.name,
          distanceMeters: result.distanceMeters,
        });
      } else {
        const successMessage = `Salida registrada. Tiempo trabajado: ${formatWorkedTimeHM(result.workedMinutes)}`;
        setMessage(successMessage);
        openSuccessModal({
          action: "CHECK_OUT",
          stationName: result.station.name,
          distanceMeters: result.distanceMeters,
          workedMinutes: result.workedMinutes,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la asistencia.";

      setMessage(errorMessage);
      openErrorModal(errorMessage);
    } finally {
      setLoadingMessage("");
      stopCamera();
      processingRef.current = false;
    }
  }

  function scanFrame() {
    if (!streamingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || processingRef.current || scanMutation.isPending) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code?.data) {
      void processQrToken(code.data);
      return;
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  }

  async function startCamera() {
    try {
      setMessage("");
      setLoadingMessage("");
      processingRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        stopCamera();
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      streamingRef.current = true;
      setStreaming(true);
      animationRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setMessage("No se pudo acceder a la cámara.");
      openErrorModal("No se pudo acceder a la cámara.");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-xl">
        <div className="mb-5 flex items-center justify-between">
          <BackButton className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10" />
          <HomeButton className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10" />
        </div>

        <h1 className="text-2xl font-black uppercase tracking-wide text-red-500">
          Asistencia QR
        </h1>

        <AttendanceStateCard
          isLoading={attendanceSummary.isLoading}
          isCurrentlyInside={
            attendanceSummary.data?.isCurrentlyInside ?? false
          }
          currentMonthFormatted={
            attendanceSummary.data?.currentMonthFormatted ?? "0h 0m"
          }
        />

        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900 p-4">
          <video
            ref={videoRef}
            className="w-full rounded-2xl bg-black"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={startCamera}
              disabled={streaming || scanMutation.isPending}
              className="h-12 flex-1 rounded-2xl bg-red-500 font-black uppercase transition hover:brightness-110 disabled:opacity-50"
            >
              Abrir cámara
            </button>

            <button
              type="button"
              onClick={stopCamera}
              disabled={!streaming}
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 font-black uppercase transition hover:bg-white/10 disabled:opacity-50"
            >
              Detener
            </button>
          </div>

          {loadingMessage && (
            <p className="mt-4 text-sm text-white/70">{loadingMessage}</p>
          )}

          {message && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
              {message}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/80 p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-white">
            <ShieldCheck className="h-5 w-5 text-red-400" />
            Cómo funciona
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/70">
            Escaneá el QR dinámico del cuartel para registrar entrada o salida.
            El sistema valida ubicación, precisión y vigencia del QR antes de
            guardar el movimiento.
          </p>

          <ol className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
            <li>
              <span className="font-bold text-white">1.</span> Presioná{" "}
              <strong className="text-white">Abrir cámara</strong>.
            </li>
            <li>
              <span className="font-bold text-white">2.</span> Apuntá al QR del
              cuartel.
            </li>
            <li>
              <span className="font-bold text-white">3.</span> Permití el acceso
              a ubicación si el navegador lo solicita.
            </li>
            <li>
              <span className="font-bold text-white">4.</span> Esperá la
              confirmación del registro.
            </li>
          </ol>
        </section>
      </div>

      {modal.open && <AttendanceModal modal={modal} onClose={closeModal} />}
    </main>
  );
}

function AttendanceStateCard({
  isLoading,
  isCurrentlyInside,
  currentMonthFormatted,
}: {
  isLoading: boolean;
  isCurrentlyInside: boolean;
  currentMonthFormatted: string;
}) {
  if (isLoading) {
    return (
      <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-900 p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-white/60">
            Cargando estado de asistencia...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isCurrentlyInside
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-zinc-800/50 text-zinc-400"
          }`}
        >
          {isCurrentlyInside ? (
            <UserCheck className="h-6 w-6" />
          ) : (
            <UserX className="h-6 w-6" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-black text-white">
            {isCurrentlyInside ? "Asistencia abierta" : "Asistencia cerrada"}
          </h3>
          <p className="text-sm text-white/60">
            {isCurrentlyInside
              ? "Tenés una entrada registrada sin salida"
              : "No tenés asistencia abierta actualmente"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <Clock className="h-4 w-4 text-red-400" />
          <span>
            Tiempo trabajado este mes:{" "}
            <strong>{currentMonthFormatted}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function AttendanceModal({
  modal,
  onClose,
}: {
  modal: AttendanceModalState;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              modal.type === "success"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {modal.type === "success" ? (
              <CheckCircle2 className="h-9 w-9" />
            ) : (
              <CircleX className="h-9 w-9" />
            )}
          </div>

          <h2 className="text-2xl font-black text-white">{modal.title}</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            {modal.description}
          </p>

          {modal.type === "success" && modal.stationName && (
            <div className="mt-6 w-full space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
              <InfoLine
                icon={<MapPin className="h-4 w-4 text-red-400" />}
                label="Cuartel"
                value={modal.stationName}
              />

              {typeof modal.distanceMeters === "number" && (
                <InfoLine
                  icon={<MapPin className="h-4 w-4 text-red-400" />}
                  label="Distancia detectada"
                  value={`${modal.distanceMeters} m`}
                />
              )}

              {modal.action === "CHECK_OUT" &&
                typeof modal.workedMinutes === "number" && (
                  <InfoLine
                    icon={<Timer className="h-4 w-4 text-red-400" />}
                    label="Tiempo trabajado"
                    value={formatWorkedTimeHM(modal.workedMinutes)}
                  />
                )}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-6 h-12 w-full rounded-2xl bg-red-500 font-black uppercase text-white transition hover:brightness-110"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/80">
      {icon}
      <span>
        {label}: <strong>{value}</strong>
      </span>
    </div>
  );
}
