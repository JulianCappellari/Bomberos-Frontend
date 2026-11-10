"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
type Result = { name: string; expiresOn: string | null; compartment: { name: string; vehicle: { assetId: string; unitNumber: string } } };
export function LabelLookup() {
  const [code, setCode] = useState(""), [result, setResult] = useState<Result | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function search(e: FormEvent) { e.preventDefault(); setBusy(true); setError(""); setResult(null); try { setResult((await api.get<Result>(`/equipment/labels/${encodeURIComponent(code.trim())}`)).data); } catch (err) { setError(getErrorMessage(err, "No se encontro la etiqueta")); } finally { setBusy(false); } }
  return <section className="border-y border-[var(--bord)] py-4"><form className="flex flex-wrap gap-2" onSubmit={search}><label className="min-w-0 flex-1"><span className="mb-1 block text-xs font-bold">Buscar herramienta por etiqueta</span><input className="app-input" required maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9._-]{0,39}" value={code} onChange={(e) => setCode(e.target.value)} /></label><button disabled={busy} className="app-button w-auto self-end"><Search size={16} /> Buscar</button></form>{error && <p role="alert" className="mt-2 text-sm text-red-200">{error}</p>}{result && <Link href={`/equipment/${result.compartment.vehicle.assetId}`} className="mt-3 block break-words text-sm text-sky-200 underline">{result.name} · Movil {result.compartment.vehicle.unitNumber} · {result.compartment.name}{result.expiresOn ? ` · Vence ${result.expiresOn.slice(0, 10)}` : ""}</Link>}</section>;
}
