"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
export function ExpenseReceipt({ id }: { id: string }) {
  const [open, setOpen] = useState(false), [url, setUrl] = useState(""), [error, setError] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true, objectUrl = "";
    void api.get<Blob>(`/finance/expenses/${id}/receipt`, { responseType: "blob" }).then(response => { if (!active) return; objectUrl = URL.createObjectURL(response.data); setUrl(objectUrl); }).catch(() => { if (active) setError(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, open]);
  return <section className="my-3"><button className="text-sm underline" onClick={() => { setError(false); setUrl(""); setOpen(!open); }}>{open ? "Ocultar comprobante adjunto" : "Ver comprobante adjunto"}</button>{open && <div className="my-3">{error ? <p role="alert">No se pudo consultar el comprobante.</p> : url ? <a href={url} target="_blank" rel="noopener noreferrer"><Image unoptimized src={url} width={1000} height={1000} className="h-auto max-h-96 w-full object-contain" alt="Comprobante del gasto" /></a> : <p className="text-sm">Cargando comprobante privado...</p>}</div>}</section>;
}
