"use client";
import jsQR from "jsqr";

// Camara y lectura de QR pensadas para celulares Android y iPhone (Safari y app instalada).

export const isIOS = () => typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const inAppBrowser = () => typeof navigator !== "undefined" && /FBAN|FBAV|Instagram|Line\/|Twitter|TikTok/i.test(navigator.userAgent);

/** Motivo por el que este navegador no puede usar la camara, o null si puede. */
export function cameraSupportProblem() {
  if (typeof window === "undefined") return null;
  if (!window.isSecureContext) return "La cámara solo funciona con conexión segura (https). Abrí la app desde su dirección oficial.";
  if (!navigator.mediaDevices?.getUserMedia) {
    if (inAppBrowser()) return "Este navegador interno no permite usar la cámara. Abrí la app en Chrome (Android) o Safari (iPhone), o usá «Sacar foto del QR».";
    return "Este navegador no permite usar la cámara. Actualizalo, abrí la app en Chrome o Safari, o usá «Sacar foto del QR».";
  }
  return null;
}

export function cameraErrorMessage(error: unknown) {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return isIOS()
    ? "No diste permiso para la cámara. En el iPhone: Ajustes › Safari › Cámara › Permitir (o Ajustes › Bomberos si la instalaste) y volvé a intentar."
    : "No diste permiso para la cámara. Tocá el candado junto a la dirección › Permisos › Cámara › Permitir, y volvé a intentar.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No se encontró una cámara en este dispositivo. Usá «Sacar foto del QR».";
  if (name === "NotReadableError" || name === "AbortError") return "Otra aplicación está usando la cámara. Cerrala y volvé a intentar.";
  return "No se pudo abrir la cámara. Probá de nuevo o usá «Sacar foto del QR».";
}

export function geolocationErrorMessage(error: unknown) {
  const code = (error as { code?: number })?.code;
  if (code === 1) return isIOS()
    ? "Este cuartel pide tu ubicación y no diste permiso. En el iPhone: Ajustes › Privacidad › Localización › Safari (o Bomberos) › «Al usar la app», y activá «Ubicación exacta»."
    : "Este cuartel pide tu ubicación y no diste permiso. Tocá el candado junto a la dirección › Permisos › Ubicación › Permitir.";
  if (code === 2) return "No se pudo obtener tu ubicación. Activá el GPS del celular y volvé a intentar.";
  if (code === 3) return "La ubicación tardó demasiado. Salí a un lugar abierto o activá el GPS y volvé a intentar.";
  return error instanceof Error ? error.message : "No se pudo obtener tu ubicación.";
}

/** Abre la camara trasera. Si el celular no acepta la resolucion pedida, reintenta con lo basico. */
export async function openRearCamera() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } });
  } catch (error) {
    if ((error as { name?: string })?.name !== "OverconstrainedError") throw error;
    return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  }
}

type Detector = { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> };
let nativeDetector: Detector | null | undefined;
async function getNativeDetector() {
  if (nativeDetector !== undefined) return nativeDetector;
  nativeDetector = null;
  try {
    const Ctor = (window as unknown as { BarcodeDetector?: { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
    if (Ctor && (!Ctor.getSupportedFormats || (await Ctor.getSupportedFormats()).includes("qr_code"))) nativeDetector = new Ctor({ formats: ["qr_code"] });
  } catch { nativeDetector = null; }
  return nativeDetector;
}

// Se lee una imagen reducida: en celulares modestos leer 1280x720 en cada cuadro traba la camara.
const MAX_SIDE = 720;
function readWithJsQr(source: CanvasImageSource, width: number, height: number, canvas: HTMLCanvasElement) {
  if (!width || !height) return null;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })?.data || null;
}

/** Lee un QR del cuadro actual del video (lector nativo en Android/Chrome; jsQR en iPhone y el resto). */
export async function decodeVideoFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  if (video.readyState < video.HAVE_CURRENT_DATA || !video.videoWidth) return null;
  const detector = await getNativeDetector();
  if (detector) {
    try { const found = await detector.detect(video); if (found[0]?.rawValue) return found[0].rawValue; return null; } catch { /* sigue con jsQR */ }
  }
  return readWithJsQr(video, video.videoWidth, video.videoHeight, canvas);
}

/** Plan B sin camara en vivo: lee el QR de una foto sacada con la camara del celular. */
export async function decodeImageFile(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("No se pudo leer la foto")); image.src = url; });
    const detector = await getNativeDetector();
    if (detector) { try { const found = await detector.detect(image); if (found[0]?.rawValue) return found[0].rawValue; } catch { /* sigue con jsQR */ } }
    const canvas = document.createElement("canvas");
    return readWithJsQr(image, image.naturalWidth, image.naturalHeight, canvas) || readWithJsQrFull(image, canvas);
  } finally { URL.revokeObjectURL(url); }
}
function readWithJsQrFull(image: HTMLImageElement, canvas: HTMLCanvasElement) {
  // Fotos grandes con el QR chico: segundo intento a mas resolucion.
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" })?.data || null;
}
