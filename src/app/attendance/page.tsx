"use client";

import { useRef, useState } from "react";
import jsQR from "jsqr";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleX,
  Clock,
  ShieldCheck,
  UserCheck,
  UserX,
  Camera,
  CameraOff,
  QrCode,
  Scan,
} from "lucide-react";
import { getDeviceFingerprint } from "@/helper/getDeviceFingerprint";
import { formatWorkedTimeHM } from "@/helper/formatWorkedTime";
import { useMyAttendanceSummary } from "@/hooks/use-attendence";
import { useScanAttendanceQr } from "@/hooks/use-scan-attendance-qr";
import { getCurrentPositionAsync } from "@/lib/geolocation";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AnimatedPage } from "@/components/ui/animated-layout";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";

type AttendanceModalState = {
  open: boolean;
  type: "success" | "error";
  title: string;
  description: string;
  action?: "CHECK_IN" | "CHECK_OUT";
  stationName?: string;
  distanceMeters?: number;
  workedMinutes?: number;
  shouldPromptAvailability?: boolean;
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
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const scanMutation = useScanAttendanceQr();
  const attendanceSummary = useMyAttendanceSummary();

  function closeModal() {
    setModal(initialModalState);
    setAvailabilityError("");
  }

  function openErrorModal(errorMessage: string) {
    setModal({
      open: true,
      type: "error",
      title: "Error en Registro",
      description: errorMessage,
    });
  }

  function openSuccessModal(data: {
    action: "CHECK_IN" | "CHECK_OUT";
    stationName: string;
    distanceMeters: number;
    workedMinutes?: number;
    shouldPromptAvailability?: boolean;
  }) {
    setModal({
      open: true,
      type: "success",
      title:
        data.action === "CHECK_IN"
          ? "Entrada Registrada"
          : "Salida Registrada",
      description:
        data.action === "CHECK_IN"
          ? `Tu ingreso en ${data.stationName} se registró correctamente.`
          : `Tu salida en ${data.stationName} se registró con éxito.`,
      action: data.action,
      stationName: data.stationName,
      distanceMeters: data.distanceMeters,
      workedMinutes: data.workedMinutes,
      shouldPromptAvailability: data.shouldPromptAvailability,
    });
  }

  async function activateAvailability() {
    setAvailabilityBusy(true);
    setAvailabilityError("");
    try {
      await api.post("/members/availability/available-now");
      setModal((current) => ({
        ...current,
        description: `${current.description} Marcaste disponibilidad para recibir próximas alertas.`,
        shouldPromptAvailability: false,
      }));
    } catch (error: unknown) {
      setAvailabilityError(getErrorMessage(error, "No se pudo actualizar tu disponibilidad."));
    } finally {
      setAvailabilityBusy(false);
    }
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
      setLoadingMessage("Obteniendo coordenadas GPS...");
      const position = await getCurrentPositionAsync();
      const deviceFingerprint = getDeviceFingerprint();

      setLoadingMessage("Validando asistencia con el servidor...");

      const result = await scanMutation.mutateAsync({
        qrToken,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        deviceFingerprint,
      });

      await attendanceSummary.refetch();

      if (result.action === "CHECK_IN") {
        setMessage(`Entrada registrada en ${result.station.name}. Distancia: ${result.distanceMeters} m.`);
        openSuccessModal({
          action: "CHECK_IN",
          stationName: result.station.name,
          distanceMeters: result.distanceMeters,
          shouldPromptAvailability: result.shouldPromptAvailability,
        });
      } else {
        setMessage(`Salida registrada. Tiempo de guardia: ${formatWorkedTimeHM(result.workedMinutes)}`);
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
      setMessage("No se pudo acceder a la cámara. Verificá los permisos del navegador.");
      openErrorModal("No se pudo acceder a la cámara. Asegurate de habilitar los permisos.");
    }
  }

  const isInside = attendanceSummary.data?.isCurrentlyInside ?? false;

  return (
    <ProtectedLayout>
      <AnimatedPage className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Fichaje de Asistencia"
          subtitle="Escaneo de código QR geolocalizado en el cuartel"
          icon={<QrCode className="h-6 w-6" />}
          badge={
            <Badge variant={isInside ? "green" : "gray"} pulse={isInside}>
              {isInside ? "En Cuartel" : "Sin Guardia Activa"}
            </Badge>
          }
        />

        {/* Current Attendance Status Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121316] p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-inner ${
                  isInside
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-white/[0.04] border-white/[0.08] text-white/40"
                }`}
              >
                {isInside ? (
                  <UserCheck className="h-7 w-7" />
                ) : (
                  <UserX className="h-7 w-7" />
                )}
              </div>

              <div>
                <div className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-wider text-white/50">
                  Estado de tu Registro
                </div>
                <h3 className="font-[family-name:var(--font-bebas)] text-2xl uppercase tracking-wider text-white">
                  {isInside ? "Guardia Activa en Cuartel" : "Fuera del Cuartel"}
                </h3>
                <p className="text-xs text-white/50 mt-0.5 font-[family-name:var(--font-barlow)]">
                  {isInside
                    ? "Tenés un ingreso activo. Al escanear registrarás tu salida."
                    : "No hay asistencia abierta. Escaneá para registrar ingreso."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:self-auto">
              <Clock className="h-5 w-5 text-red-400 shrink-0" />
              <div>
                <div className="font-[family-name:var(--font-barlow-condensed)] text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Horas este mes
                </div>
                <div className="font-[family-name:var(--font-bebas)] text-2xl text-white">
                  {attendanceSummary.isLoading
                    ? "..."
                    : attendanceSummary.data?.currentMonthFormatted ?? "0h 0m"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Scanner Viewport */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121316] p-5 sm:p-6 shadow-xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/60 border border-white/[0.08]">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Tactical Scan Overlay when streaming */}
            {streaming && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                {/* Scanner Frame */}
                <div className="relative h-48 w-48 sm:h-64 sm:w-64 border-2 border-red-500/50 rounded-2xl">
                  {/* Glowing corners */}
                  <div className="absolute -top-1 -left-1 h-6 w-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 h-6 w-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 h-6 w-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 border-b-4 border-r-4 border-red-500 rounded-br-lg" />

                  {/* Horizontal animated laser scanner line */}
                  <motion.div
                    animate={{ y: [0, 180, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-0.5 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                  />
                </div>
              </div>
            )}

            {/* Placeholder state when camera is off */}
            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/30">
                  <Scan className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase tracking-wider text-white">
                    Cámara en espera
                  </p>
                  <p className="text-xs text-white/40 max-w-xs">
                    Presioná &ldquo;Abrir Cámara&rdquo; para escanear el QR físico ubicado en el cuartel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Scanner Controls */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={startCamera}
              disabled={streaming || scanMutation.isPending}
              icon={<Camera className="h-5 w-5" />}
              className="w-full"
            >
              Abrir Cámara
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={stopCamera}
              disabled={!streaming}
              icon={<CameraOff className="h-5 w-5" />}
              className="w-full"
            >
              Detener
            </Button>
          </div>

          {/* Loading or status feedback */}
          {loadingMessage && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
              <span className="h-2 w-2 animate-ping rounded-full bg-red-400" />
              <span>{loadingMessage}</span>
            </div>
          )}

          {message && !loadingMessage && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70 text-center">
              {message}
            </div>
          )}
        </section>

        {/* Instructions / Protocol */}
        <section className="rounded-3xl border border-white/[0.08] bg-[#121316] p-5 sm:p-6 shadow-xl">
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-bebas)] text-xl uppercase tracking-wider text-white">
            <ShieldCheck className="h-5 w-5 text-red-400" />
            Protocolo de Fichaje y Geovalidación
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-4 font-[family-name:var(--font-barlow)]">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
              <span className="font-[family-name:var(--font-bebas)] text-xl text-red-500">
                01
              </span>
              <div className="text-xs font-bold text-white">Ubicación GPS</div>
              <p className="text-[11px] text-white/50">
                El navegador solicitará permisos de localización para certificar presencia física en el cuartel.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
              <span className="font-[family-name:var(--font-bebas)] text-xl text-red-500">
                02
              </span>
              <div className="text-xs font-bold text-white">QR Dinámico</div>
              <p className="text-[11px] text-white/50">
                El código del cuartel rota periódicamente para evitar copias o fotografías remotas.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
              <span className="font-[family-name:var(--font-bebas)] text-xl text-red-500">
                03
              </span>
              <div className="text-xs font-bold text-white">Cómputo Automático</div>
              <p className="text-[11px] text-white/50">
                Al escanear la salida, el sistema calcula de inmediato las horas trabajadas del turno.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
              <span className="font-[family-name:var(--font-bebas)] text-xl text-red-500">
                04
              </span>
              <div className="text-xs font-bold text-white">Historial Central</div>
              <p className="text-[11px] text-white/50">
                Todas las asistencias alimentan la bitácora de guardia de jefatura automáticamente.
              </p>
            </div>
          </div>
        </section>

        {/* Modal feedback */}
        <Modal
          open={modal.open}
          onClose={closeModal}
          title={modal.title}
          description={modal.description}
          size="sm"
        >
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner ${
                modal.type === "success"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/15 border-red-500/30 text-red-400"
              }`}
            >
              {modal.type === "success" ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <CircleX className="h-8 w-8" />
              )}
            </div>

            {modal.type === "success" && modal.stationName && (
              <div className="w-full space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left text-xs font-[family-name:var(--font-barlow)]">
                <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-white/50">Cuartel</span>
                  <span className="font-semibold text-white">{modal.stationName}</span>
                </div>

                {typeof modal.distanceMeters === "number" && (
                  <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-white/50">Distancia registrada</span>
                    <span className="font-semibold text-white">{modal.distanceMeters} metros</span>
                  </div>
                )}

                {modal.action === "CHECK_OUT" && typeof modal.workedMinutes === "number" && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-white/50">Duración de guardia</span>
                    <span className="font-semibold text-emerald-400">
                      {formatWorkedTimeHM(modal.workedMinutes)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {modal.shouldPromptAvailability ? (
              <div className="w-full space-y-3">
                <p className="text-sm text-white/70">
                  Tu disponibilidad figura como no disponible o todavía no la confirmaste.
                  ¿Querés activarla para recibir nuevas alertas?
                </p>
                {availabilityError && <p role="alert" className="text-sm text-red-300">{availabilityError}</p>}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="primary" size="md" onClick={() => void activateAvailability()} disabled={availabilityBusy} loading={availabilityBusy} className="w-full">
                    Sí, estoy disponible
                  </Button>
                  <Button variant="secondary" size="md" onClick={closeModal} disabled={availabilityBusy} className="w-full">
                    No, mantener mi estado
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={closeModal}
                className="w-full"
              >
                Entendido
              </Button>
            )}
          </div>
        </Modal>
      </AnimatedPage>
    </ProtectedLayout>
  );
}
