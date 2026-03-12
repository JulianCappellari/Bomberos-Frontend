"use client";

import { useRef, useState } from "react";
import jsQR from "jsqr";
import { CheckCircle2, CircleX, MapPin, Timer, X, Clock, UserCheck, UserX } from "lucide-react";
import { getCurrentPositionAsync } from "@/lib/geolocation";
import { useScanAttendanceQr } from "@/hooks/use-scan-attendance-qr";
import { useMyAttendanceSummary } from "@/hooks/use-attendence";
import { getDeviceFingerprint } from "@/helper/getDeviceFingerprint";
import { formatWorkedTimeHM } from "@/helper/formatWorkedTime";

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

  function openSuccessModal(data: {
    action: "CHECK_IN" | "CHECK_OUT";
    stationName: string;
    distanceMeters: number;
    workedMinutes?: number;
  }) {
    if (data.action === "CHECK_IN") {
      setModal({
        open: true,
        type: "success",
        title: "Entrada registrada",
        description: `Tu ingreso en ${data.stationName} se registró correctamente.`,
        action: data.action,
        stationName: data.stationName,
        distanceMeters: data.distanceMeters,
      });
      return;
    }

    setModal({
      open: true,
      type: "success",
      title: "Salida registrada",
      description: `Tu salida en ${data.stationName} se registró correctamente.`,
      action: data.action,
      stationName: data.stationName,
      distanceMeters: data.distanceMeters,
      workedMinutes: data.workedMinutes,
    });
  }

  function openErrorModal(errorMessage: string) {
    setModal({
      open: true,
      type: "error",
      title: "No se pudo registrar la asistencia",
      description: errorMessage,
    });
  }

  function closeModal() {
    setModal(initialModalState);
  }

  async function startCamera() {
    console.log("[ATTENDANCE] startCamera() -> iniciando");

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

      console.log("[ATTENDANCE] Cámara abierta correctamente", stream);

      streamRef.current = stream;

      if (!videoRef.current) {
        console.log("[ATTENDANCE] videoRef.current es null");
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      console.log("[ATTENDANCE] Video reproduciéndose");
      console.log(
        "[ATTENDANCE] readyState inicial:",
        videoRef.current.readyState,
      );

      streamingRef.current = true;
      setStreaming(true);

      animationRef.current = requestAnimationFrame(scanFrame);
      console.log("[ATTENDANCE] scanFrame agendado");
    } catch (error) {
      console.warn("[ATTENDANCE] Error al abrir cámara:", error);
      setMessage("No se pudo acceder a la cámara.");
      openErrorModal("No se pudo acceder a la cámara.");
    }
  }

  async function scanFrame() {
    if (!streamingRef.current) {
      console.log(
        "[ATTENDANCE] scanFrame() cancelado porque streamingRef=false",
      );
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    if (processingRef.current) {
      console.log(
        "[ATTENDANCE] scanFrame() bloqueado porque processingRef=true",
      );
      return;
    }

    if (scanMutation.isPending) {
      console.log(
        "[ATTENDANCE] scanFrame() pausado porque mutation está pending",
      );
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
      console.log("[ATTENDANCE] No se pudo obtener contexto 2D");
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    console.log("[ATTENDANCE] Escaneando frame", {
      width: canvas.width,
      height: canvas.height,
    });

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (!code?.data) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    console.log("[ATTENDANCE] QR detectado:", code.data);

    processingRef.current = true;

    try {
      setLoadingMessage("Obteniendo ubicación...");
      console.log("[ATTENDANCE] Solicitando geolocalización...");

      const position = await getCurrentPositionAsync();

      console.log("[ATTENDANCE] Ubicación obtenida:", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });

      setLoadingMessage("Validando asistencia...");

      const deviceFingerprint = getDeviceFingerprint();
      console.log("[ATTENDANCE] deviceFingerprint:", deviceFingerprint);

      const payload = {
        qrToken: code.data,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        deviceFingerprint,
      };

      console.log("[ATTENDANCE] Enviando payload al backend:", payload);

      const result = await scanMutation.mutateAsync(payload);

      console.log("[ATTENDANCE] Respuesta backend:", result);

      // Refrescar el estado de asistencia después de un registro exitoso
      await attendanceSummary.refetch();

      if (result.action === "CHECK_IN") {
        const successMessage = `Entrada registrada en ${result.station.name}. Distancia: ${result.distanceMeters}m.`;
        setMessage(successMessage);

        openSuccessModal({
          action: "CHECK_IN",
          stationName: result.station.name,
          distanceMeters: result.distanceMeters,
        });
      } else {
        const successMessage = `Salida registrada. Tiempo trabajado: ${formatWorkedTimeHM(result.workedMinutes!)}`;
        setMessage(successMessage);

        openSuccessModal({
          action: "CHECK_OUT",
          stationName: result.station.name,
          distanceMeters: result.distanceMeters,
          workedMinutes: result.workedMinutes,
        });
      }
    } catch (error: unknown) {
      console.warn(
        "[ATTENDANCE] Error controlado en flujo QR:",
        error,
      );

      const errorMessage =
        (error as Error)?.message || "No se pudo registrar la asistencia.";

      setMessage(errorMessage);
      openErrorModal(errorMessage);
    } finally {
      setLoadingMessage("");
      stopCamera();
      processingRef.current = false;
    }
  }

  function stopCamera() {
    console.log("[ATTENDANCE] stopCamera() -> deteniendo");

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

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-black uppercase tracking-wide text-red-500">
          Asistencia QR
        </h1>
        

        {attendanceSummary.isLoading ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-white/60">Cargando estado de asistencia...</div>
            </div>
          </div>
        ) : attendanceSummary.data ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  attendanceSummary.data.isCurrentlyInside 
                    ? "bg-emerald-500/15 text-emerald-400" 
                    : "bg-zinc-800/50 text-zinc-400"
                }`}>
                  {attendanceSummary.data.isCurrentlyInside ? (
                    <UserCheck className="h-6 w-6" />
                  ) : (
                    <UserX className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {attendanceSummary.data.isCurrentlyInside ? "Asistencia Abierta" : "Asistencia Cerrada"}
                  </h3>
                  <p className="text-sm text-white/60">
                    {attendanceSummary.data.isCurrentlyInside 
                      ? "Tienes una entrada registrada sin salida"
                      : "No tienes asistencia abierta actualmente"
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {!attendanceSummary.data.isCurrentlyInside && attendanceSummary.data.currentMonthFormatted && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="h-4 w-4 text-red-400" />
                  <span>
                    Tiempo trabajado este mes: <strong>{attendanceSummary.data.currentMonthFormatted}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-900 p-4">
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

          {/* <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
            <div>streaming state: {String(streaming)}</div>
            <div>mutation pending: {String(scanMutation.isPending)}</div>
            <div>processingRef: {String(processingRef.current)}</div>
          </div> */}

          {loadingMessage && (
            <p className="mt-4 text-sm text-white/70">{loadingMessage}</p>
          )}

          {message && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
              {message}
            </div>
          )}
        </div>
        <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/80 p-5">
          <h2 className="text-lg font-black text-white">
            ¿Para qué sirve este apartado?
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/70">
            Este apartado permite registrar tu{" "}
            <strong className="text-white">entrada</strong> y{" "}
            <strong className="text-white">salida</strong> del cuartel
            escaneando el <strong className="text-white">QR dinámico</strong>{" "}
            desde tu celular. El sistema valida tu{" "}
            <strong className="text-white">ubicación</strong> para confirmar que
            estés dentro del rango permitido.
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-red-400">
              Instrucciones
            </p>

            <ol className="mt-3 space-y-2 text-sm text-white/75">
              <li>
                <span className="font-bold text-white">1.</span> Presioná{" "}
                <strong className="text-white">“Abrir cámara”</strong>.
              </li>
              <li>
                <span className="font-bold text-white">2.</span> Apuntá al{" "}
                <strong className="text-white">QR del cuartel</strong>.
              </li>
              <li>
                <span className="font-bold text-white">3.</span> Permití el
                acceso a la <strong className="text-white">ubicación</strong> si
                el navegador lo solicita.
              </li>
              <li>
                <span className="font-bold text-white">4.</span> Esperá la
                confirmación del registro.
              </li>
            </ol>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-300">
              Importante
            </p>

            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>
                • Si no estás cerca del cuartel, el registro será rechazado.
              </li>
              <li>
                • Si la ubicación tiene poca precisión, el sistema puede no
                permitir el registro.
              </li>
              <li>
                • Si ya registraste entrada, el próximo escaneo registrará la
                salida.
              </li>
            </ul>
          </div>
        </div>
      </div>

      

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
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
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <MapPin className="h-4 w-4 text-red-400" />
                    <span>
                      Cuartel: <strong>{modal.stationName}</strong>
                    </span>
                  </div>

                  {typeof modal.distanceMeters === "number" && (
                    <div className="flex items-center gap-3 text-sm text-white/80">
                      <MapPin className="h-4 w-4 text-red-400" />
                      <span>
                        Distancia detectada:{" "}
                        <strong>{modal.distanceMeters} m</strong>
                      </span>
                    </div>
                  )}

                  {modal.action === "CHECK_OUT" &&
                    typeof modal.workedMinutes === "number" && (
                      <div className="flex items-center gap-3 text-sm text-white/80">
                        <Timer className="h-4 w-4 text-red-400" />
                        <span>
                          Tiempo trabajado:{" "}
                          <strong>
                            {formatWorkedTimeHM(modal.workedMinutes)}
                          </strong>
                        </span>
                      </div>
                    )}
                </div>
              )}

              <button
                type="button"
                onClick={closeModal}
                className="mt-6 h-12 w-full rounded-2xl bg-red-500 font-black uppercase text-white transition hover:brightness-110"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
      
    </main>
  );
}
