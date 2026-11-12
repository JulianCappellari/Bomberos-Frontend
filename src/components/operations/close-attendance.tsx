"use client";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { isCommand, isDutyManager } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/get-error-message";
import { personName } from "./operations-ui";
import type { UserRosterItem } from "@/types/user";

type Correction = {
  id: string; action: "OPEN" | "CLOSE"; effectiveAt: string; reason: string; createdAt: string;
  attendance: { userId: string; user: UserRosterItem; station: { name: string } };
  requestedBy: UserRosterItem;
};

// E10: el cierre de un fichaje ajeno no se aplica hasta que otra persona de jefatura lo autorice.
export function CloseAttendance({ id }: { id: string }) {
  const { user } = useAuth(); const client = useQueryClient();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  if (!isDutyManager(user?.role)) return null;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget); setBusy(true); setError(""); setNotice("");
    try {
      const response = await api.post<{ pending: boolean; message: string }>(`/attendance/${id}/close`, { reason: data.get("reason") });
      setNotice(response.data.message); setOpen(false);
      await client.invalidateQueries({ queryKey: ["attendance"] }); await client.invalidateQueries({ queryKey: ["attendance-corrections"] });
    } catch (err) { setError(getErrorMessage(err, "No se pudo solicitar el cierre de la permanencia")); } finally { setBusy(false); }
  }
  return <div className="mt-4"><button type="button" className="app-button w-auto" onClick={() => setOpen(!open)}>Cerrar permanencia</button>
    {open && <form onSubmit={submit} className="mt-3 space-y-3"><p className="text-sm text-[var(--mut)]">El cierre de un fichaje ajeno requiere doble autorización: queda pendiente hasta que otra persona de jefatura lo apruebe y se aplica con la hora de este pedido.</p><label className="block">Motivo del cierre<textarea name="reason" className="app-input mt-1" required minLength={10} maxLength={2000} /></label><button disabled={busy} className="app-button app-button-red w-auto">Solicitar cierre</button></form>}
    {notice && <p role="status" className="mt-3 border-l-2 border-emerald-500 pl-3 text-sm">{notice}</p>}
    {error && <p role="alert" className="mt-3 text-red-300">{error}</p>}</div>;
}

export function AttendanceCorrections() {
  const { user } = useAuth(); const client = useQueryClient();
  const duty = isDutyManager(user?.role), command = isCommand(user?.role);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const query = useQuery({ queryKey: ["attendance-corrections", user?.id], enabled: duty, queryFn: async () => (await api.get<Correction[]>("/attendance/corrections")).data });
  if (!duty || !query.data?.length) return null;
  async function decide(id: string, approve: boolean) {
    const note = window.prompt(approve ? "Indique cómo verificó la corrección (mínimo 5 caracteres):" : "Motivo del rechazo (mínimo 5 caracteres):");
    if (!note || note.trim().length < 5) return;
    setBusy(true); setError("");
    try {
      await api.post(`/attendance/corrections/${id}/decide`, { approve, note: note.trim() });
      await client.invalidateQueries({ queryKey: ["attendance-corrections"] }); await client.invalidateQueries({ queryKey: ["attendance"] });
    } catch (err) { setError(getErrorMessage(err, "No se pudo resolver la corrección")); } finally { setBusy(false); }
  }
  return <section className="card space-y-3" aria-label="Correcciones de fichaje pendientes">
    <h2 className="font-bold">Correcciones de fichaje pendientes de segunda autorización</h2>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {query.data.map(row => {
      const own = row.requestedBy.id === user?.id || row.attendance.userId === user?.id;
      return <article key={row.id} className="rounded-lg border border-[var(--bord)] p-3 text-sm">
        <p><strong>{row.action === "CLOSE" ? "Cierre" : "Apertura manual"}</strong> · {personName(row.attendance.user)} · {row.attendance.station.name}</p>
        <p className="text-[var(--mut)]">Hora a aplicar: {new Date(row.effectiveAt).toLocaleString("es-AR", { hourCycle: "h23" })} · Solicitó: {personName(row.requestedBy)}</p>
        <p className="my-2 whitespace-pre-wrap break-words">{row.reason}</p>
        {command && !own ? <div className="flex flex-wrap gap-2"><button disabled={busy} className="app-button app-button-red w-auto" onClick={() => decide(row.id, true)}>Autorizar</button><button disabled={busy} className="app-button w-auto" onClick={() => decide(row.id, false)}>Rechazar</button></div>
          : <p className="text-xs text-[var(--mut)]">{own ? "Debe autorizarla otra persona de jefatura, distinta del solicitante y del titular." : "Pendiente de autorización de jefatura."}</p>}
      </article>;
    })}
  </section>;
}
