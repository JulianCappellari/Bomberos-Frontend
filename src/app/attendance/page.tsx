"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleX,
  ShieldCheck,
  UserCheck,
  UserX,
  Camera,
  CameraOff,
  ImageUp,
  QrCode,
  Scan,
} from "lucide-react";
import { getDeviceFingerprint } from "@/helper/getDeviceFingerprint";
import { formatWorkedTimeHM } from "@/helper/formatWorkedTime";
import { useMyAttendanceSummary } from "@/hooks/use-attendence";
import { useScanAttendanceQr } from "@/hooks/use-scan-attendance-qr";
import { getCurrentPositionAsync } from "@/lib/geolocation";
import { cameraErrorMessage, cameraSupportProblem, decodeImageFile, decodeVideoFrame, geolocationErrorMessage, openRearCamera } from "@/lib/qr-camera";
import { LocationRequiredError } from "@/services/attendance.service";
import { RemoteCheckout } from "@/components/attendance/remote-checkout";
import { ProtectedLayout } from "@/components/layout/protected-layout";
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
  const photoInputRef = useRef<HTMLInputElement | null>(null);

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
      window.clearTimeout(animationRef.current);
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
      const deviceFingerprint = getDeviceFingerprint();
      setLoadingMessage("Validando asistencia con el servidor...");
      let result;
      try {
        result = await scanMutation.mutateAsync({ qrToken, deviceFingerprint });
      } catch (error) {
        if (!(error instanceof LocationRequiredError)) throw error;
        // El cuartel pide ubicacion: recien ahora se pide permiso de GPS (la base sin ubicacion nunca lo pide).
        setLoadingMessage("Obteniendo tu ubicación...");
        let position: GeolocationPosition;
        try { position = await getCurrentPositionAsync(); } catch (geoError) { throw new Error(geolocationErrorMessage(geoError)); }
        setLoadingMessage("Validando asistencia con el servidor...");
        result = await scanMutation.mutateAsync({ qrToken, deviceFingerprint, latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
      }

      await attendanceSummary.refetch();

      if (result.action === "CHECK_IN") {
        setMessage(`Entrada registrada en ${result.station.name}.`);
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

  // Lectura a ~8 cuadros por segundo: suficiente para el QR y liviano para celulares modestos.
  function scanFrame() {
    if (!streamingRef.current) return;
    const video = videoRef.current, canvas = canvasRef.current;
    const next = () => { if (streamingRef.current) animationRef.current = window.setTimeout(scanFrame, 120); };
    if (!video || !canvas || processingRef.current || scanMutation.isPending) { next(); return; }
    void decodeVideoFrame(video, canvas).then((token) => {
      if (!streamingRef.current) return;
      if (token && !processingRef.current) { void processQrToken(token); return; }
      next();
    }).catch(next);
  }

  async function startCamera() {
    setMessage("");
    setLoadingMessage("");
    processingRef.current = false;
    const problem = cameraSupportProblem();
    if (problem) { setMessage(problem); openErrorModal(problem); return; }
    try {
      const stream = await openRearCamera();
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stopCamera(); return; }
      // iPhone: el video tiene que ser inline y silencioso para poder reproducirse dentro de la pagina.
      video.setAttribute("playsinline", "true");
      video.muted = true;
      video.srcObject = stream;
      await video.play();
      streamingRef.current = true;
      setStreaming(true);
      scanFrame();
    } catch (error) {
      stopCamera();
      const text = cameraErrorMessage(error);
      setMessage(text);
      openErrorModal(text);
    }
  }

  async function readPhoto(file: File | undefined) {
    if (!file) return;
    stopCamera();
    setMessage("");
    setLoadingMessage("Leyendo la foto...");
    try {
      const token = await decodeImageFile(file);
      if (!token) { setLoadingMessage(""); openErrorModal("No se encontró un QR en la foto. Sacala de frente, cerca y sin reflejos. Recordá que el QR cambia cada 30 segundos."); return; }
      await processQrToken(token);
    } catch {
      setLoadingMessage("");
      openErrorModal("No se pudo leer la foto. Probá de nuevo.");
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  // Si la app pasa a segundo plano (otra app, bloqueo de pantalla) se apaga la camara: iPhone la corta igual
  // y al volver quedaria la imagen en negro. Tambien se libera al salir de la pantalla.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") stopCamera(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", stopCamera);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", stopCamera); stopCamera(); };
    // stopCamera solo usa refs y setters estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInside = attendanceSummary.data?.isCurrentlyInside ?? false;

  return (
    <ProtectedLayout>
      <AnimatedPage className="space-y-6">
        {/* Estado y accion principal arriba: es la pantalla mas usada del sistema. */}
        <header>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><QrCode className="h-6 w-6 text-red-400" aria-hidden /> Mi asistencia</h1>
          <div className={`mt-3 flex items-center gap-3 rounded-2xl border p-4 ${isInside ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/[0.08] bg-[var(--card)]"}`}>
            {isInside ? <UserCheck className="h-7 w-7 shrink-0 text-emerald-400" aria-hidden /> : <UserX className="h-7 w-7 shrink-0 text-white/50" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white">{isInside ? "Estás en el cuartel" : "Estás fuera del cuartel"}</p>
              <p className="text-sm text-white/65">{isInside ? "Escaneá el QR del cuartel al irte para registrar la salida." : "Escaneá el QR del cuartel para registrar tu ingreso."}</p>
            </div>
            <div className="shrink-0 text-right"><p className="text-xs text-white/55">Este mes</p><p className="font-bold text-white">{attendanceSummary.isLoading ? "…" : attendanceSummary.data?.currentMonthFormatted ?? "0h 0m"}</p></div>
          </div>
        </header>

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
                    Cámara apagada
                  </p>
                  <p className="text-xs text-white/40 max-w-xs">
                    Tocá el botón de abajo y apuntá al QR que muestra la guardia en el cuartel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Un solo boton que alterna: menos decisiones en el momento de fichar */}
          <div className="mt-5">
            {streaming ? (
              <Button variant="secondary" size="lg" onClick={stopCamera} icon={<CameraOff className="h-5 w-5" />} className="w-full">Cancelar escaneo</Button>
            ) : (
              <>
                <Button variant="primary" size="lg" onClick={startCamera} disabled={scanMutation.isPending} icon={<Camera className="h-5 w-5" />} className="w-full">{isInside ? "Escanear QR de salida" : "Escanear QR de ingreso"}</Button>
                {/* Plan B si la camara en vivo no funciona (permisos, navegador interno, celular viejo). */}
                <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void readPhoto(e.target.files?.[0])} />
                <button type="button" disabled={scanMutation.isPending} onClick={() => photoInputRef.current?.click()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline disabled:opacity-50"><ImageUp className="h-4 w-4" aria-hidden /> Sacar foto del QR</button>
                {/* Con la permanencia abierta: cerrar sin QR, acreditando solo hasta la ultima presencia verificada. */}
                {isInside && <RemoteCheckout onClosed={() => void attendanceSummary.refetch()} />}
              </>
            )}
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

        <details className="rounded-2xl border border-white/[0.08] bg-[var(--card)] p-4 text-sm text-white/75">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-white"><ShieldCheck className="h-4 w-4 text-red-400" aria-hidden /> ¿Cómo funciona?</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>El celular pide tu ubicación para confirmar que estás en el cuartel (dentro de los 100 metros).</li>
            <li>El código QR cambia cada 30 segundos, así no sirve una foto vieja.</li>
            <li>Mientras estés adentro, cada 30 minutos te va a pedir que confirmes que seguís en el cuartel. Si no respondés, la permanencia se cierra y no suma horas.</li>
            <li>Si salís a una emergencia, la confirmación se pausa y el tiempo se acredita igual.</li>
          </ol>
        </details>

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

                {typeof modal.distanceMeters === "number" && modal.distanceMeters > 0 && (
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
