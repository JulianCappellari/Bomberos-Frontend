"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Users } from "lucide-react";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { useAuth } from "@/features/auth/auth-context";
import { DocumentReads } from "@/services/station.service";

/** Lecturas propias (documento + version). Se comparte entre todas las tarjetas por la clave de consulta. */
export function useMyDocumentReads() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["document-reads", user?.id], enabled: Boolean(user), queryFn: async () => (await api.get<Array<{ documentId: string; revision: number }>>("/station/documents/reads/mine")).data });
}

// 30: cada integrante confirma que leyo la version vigente; jefatura ve quien falta.
export function DocumentReading({ documentId, revision, manager }: { documentId: string; revision: number; manager: boolean }) {
  const client = useQueryClient(), { user } = useAuth();
  const reads = useMyDocumentReads();
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [show, setShow] = useState(false);
  const report = useQuery({ queryKey: ["document-read-report", documentId, revision], enabled: manager && show, queryFn: async () => (await api.get<DocumentReads>(`/station/documents/${documentId}/reads`)).data });
  const read = reads.data?.some((r) => r.documentId === documentId && r.revision === revision);
  const technicalAdmin = user?.profile?.rank?.toLowerCase() === "administrador";
  async function confirm() {
    setBusy(true); setError("");
    try { await api.post(`/station/documents/${documentId}/read`); await client.invalidateQueries({ queryKey: ["document-reads"] }); }
    catch (err) { setError(getErrorMessage(err, "No se pudo registrar la lectura")); } finally { setBusy(false); }
  }
  return <>
    {!technicalAdmin && (read
      ? <span className="inline-flex items-center gap-1 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden /> Leído</span>
      : <button type="button" disabled={busy || reads.isLoading} className="app-button app-button-outline w-auto" onClick={confirm}><CheckCircle2 className="h-4 w-4" /> Marcar como leído</button>)}
    {manager && <button type="button" className="app-button app-button-outline w-auto" onClick={() => setShow(!show)}><Users className="h-4 w-4" /> {show ? "Ocultar lecturas" : "Quién lo leyó"}</button>}
    {error && <p role="alert" className="basis-full text-sm text-red-300">{error}</p>}
    {show && <div className="basis-full rounded-lg border border-[var(--bord)] p-3 text-sm">
      {report.isLoading && <p className="text-[var(--mut)]">Consultando…</p>}
      {report.isError && <p role="alert" className="text-red-300">No se pudieron consultar las lecturas.</p>}
      {report.data && <>
        <p className="font-semibold">{report.data.read.length} de {report.data.read.length + report.data.pending.length} leyeron la revisión {report.data.document.revision}</p>
        {report.data.pending.length > 0 && <p className="mt-2 text-amber-300">Falta: {report.data.pending.map((p) => p.name).join(", ")}</p>}
        {report.data.read.length > 0 && <p className="mt-2 text-[var(--mut)]">Leyeron: {report.data.read.map((p) => p.name).join(", ")}</p>}
      </>}
    </div>}
  </>;
}
