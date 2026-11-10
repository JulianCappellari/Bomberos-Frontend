"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

async function preparePhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15000000) throw new Error("Use fotos JPEG, PNG o WebP de hasta 15 MB");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 25000000) throw new Error("La foto supera 25 megapixeles");
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No se pudo preparar la foto"); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.65, 0.5, 0.35]) { const encoded = canvas.toDataURL("image/jpeg", quality).split(",")[1]; if (encoded.length <= 250000) return encoded; }
    throw new Error("La foto sigue siendo demasiado grande; seleccione una mas pequena");
  } finally { bitmap.close(); }
}
export function TaskPhotoPicker({ photos, onChange, onBusyChange, maxPhotos = 3, label = "Fotos de evidencia" }: { photos: string[]; onChange: (photos: string[]) => void; onBusyChange?: (busy: boolean) => void; maxPhotos?: number; label?: string }) {
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <fieldset className="space-y-2"><legend className="app-label">{label} ({photos.length}/{maxPhotos})</legend><input aria-label={`Adjuntar ${label.toLowerCase()}`} type="file" accept="image/jpeg,image/png,image/webp" multiple={maxPhotos > 1} disabled={busy || photos.length >= maxPhotos} className="app-input" onChange={async (e) => { const files = [...(e.target.files || [])]; e.target.value = ""; setError(""); if (files.length + photos.length > maxPhotos) { setError(`Puede adjuntar hasta ${maxPhotos} imagen${maxPhotos === 1 ? "" : "es"}`); return; } setBusy(true); onBusyChange?.(true); try { const encoded = []; for (const file of files) encoded.push(await preparePhoto(file)); onChange([...photos, ...encoded]); } catch (err) { setError(err instanceof Error ? err.message : "No se pudieron preparar las fotos"); } finally { setBusy(false); onBusyChange?.(false); } }} />{busy && <p role="status" className="text-sm">Preparando fotos...</p>}{error && <p role="alert" className="text-sm text-red-200">{error}</p>}<div className="grid grid-cols-3 gap-2">{photos.map((p, i) => <div key={i} className="min-w-0"><Image unoptimized src={`data:image/jpeg;base64,${p}`} alt={`Evidencia seleccionada ${i + 1}`} width={200} height={150} className="h-auto w-full rounded object-contain" /><button type="button" className="mt-1 text-xs underline" onClick={() => onChange(photos.filter((_, j) => j !== i))}>Quitar foto {i + 1}</button></div>)}</div></fieldset>;
}
export function TaskPhoto({ taskId, photoId, revision }: { taskId: string; photoId: string; revision: number }) {
  const [url, setUrl] = useState(""), [error, setError] = useState(false);
  useEffect(() => { let active = true, objectUrl = ""; void api.get<Blob>(`/work/tasks/${taskId}/photos/${photoId}`, { responseType: "blob" }).then((r) => { if (!active) return; objectUrl = URL.createObjectURL(r.data); setUrl(objectUrl); }).catch(() => { if (active) setError(true); }); return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [taskId, photoId]);
  return <figure className="min-w-0">{url ? <a href={url} target="_blank" rel="noopener noreferrer"><Image unoptimized src={url} width={400} height={300} alt={`Evidencia del envio ${revision}`} className="h-auto max-h-64 w-full rounded object-contain" /></a> : <p className="text-xs">{error ? "No se pudo cargar la foto" : "Cargando foto..."}</p>}<figcaption className="mt-1 text-xs text-[var(--mut)]">Envio version {revision}</figcaption></figure>;
}
