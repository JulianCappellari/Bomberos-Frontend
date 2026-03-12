"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, Loader2 } from "lucide-react";

type QrAttendanceScannerProps = {
  onDetected: (token: string) => Promise<void> | void;
  isProcessing?: boolean;
};

export default function QrAttendanceScanner({
  onDetected,
  isProcessing = false,
}: QrAttendanceScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [hasDetected, setHasDetected] = useState(false);

  async function startCamera() {
    console.log("[QR] startCamera() -> iniciando cámara");

    try {
      setScannerError("");
      setHasDetected(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      console.log("[QR] Cámara concedida correctamente", stream);

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        console.log("[QR] videoRef.current es null");
        return;
      }

      video.srcObject = stream;
      await video.play();

      console.log("[QR] Video reproduciéndose");

      setIsCameraActive(true);
      scanFrame();
    } catch (error) {
      console.error("[QR] Error al iniciar cámara:", error);
      setScannerError("No se pudo acceder a la cámara.");
      setIsCameraActive(false);
    }
  }

  function stopCamera() {
    console.log("[QR] stopCamera() -> deteniendo cámara");

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

    setIsCameraActive(false);
  }

  async function handleDetectedToken(token: string) {
    console.log("[QR] handleDetectedToken() -> token detectado:", token);
    console.log("[QR] hasDetected:", hasDetected, "| isProcessing:", isProcessing);

    if (hasDetected || isProcessing) {
      console.log("[QR] Se ignora el token porque ya se detectó uno o está procesando");
      return;
    }

    setHasDetected(true);
    stopCamera();

    try {
      console.log("[QR] Ejecutando onDetected(token)");
      await onDetected(token);
      console.log("[QR] onDetected(token) finalizó correctamente");
    } catch (error) {
      console.error("[QR] Error dentro de onDetected(token):", error);
    }
  }

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.log("[QR] scanFrame() -> falta video o canvas");
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code?.data) {
          console.log("[QR] QR leído correctamente:", code.data);
          void handleDetectedToken(code.data);
          return;
        }
      }
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  }

  useEffect(() => {
    console.log("[QR] QrAttendanceScanner montado");

    return () => {
      console.log("[QR] QrAttendanceScanner desmontado");
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111214] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />

          <canvas ref={canvasRef} className="hidden" />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[68%] w-[68%] rounded-2xl border-2 border-[#ff4d4f] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
              <div className="absolute left-[5%] right-[5%] top-[8%] h-[2px] animate-pulse bg-gradient-to-r from-transparent via-[#ff4d4f] to-transparent" />
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-white/45">
            Escaneá el QR del cuartel
          </p>
          <p className="mt-2 text-sm text-white/60">
            Apuntá la cámara al código QR dinámico para registrar entrada o salida.
          </p>
        </div>
      </div>

      {scannerError && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {scannerError}
        </div>
      )}

      <div className="flex gap-3">
        {!isCameraActive ? (
          <button
            type="button"
            onClick={startCamera}
            disabled={isProcessing}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff4d4f] text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_30px_rgba(255,77,79,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Activar cámara
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#16171a] text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#1b1c20]"
          >
            <CameraOff className="h-4 w-4" />
            Detener cámara
          </button>
        )}
      </div>
    </div>
  );
}