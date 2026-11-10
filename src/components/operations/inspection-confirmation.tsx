"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { InspectionHistoryEntry } from "@/types/inspection";
export function InspectionConfirmation({entry}: {entry: InspectionHistoryEntry}) {
  const {user} = useAuth(), client = useQueryClient();
  const [busy,setBusy] = useState(false),[error,setError] = useState(""),[accepted,setAccepted] = useState(false);
  const [removing, setRemoving] = useState("");
  const manager = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const expired = Boolean(entry.createdAt && now > +new Date(entry.createdAt) + 24 * 3600000);
  const own = entry.responsibles?.find(member => member.user.id === user?.id);
  async function confirm() {
    setBusy(true);setError("");
    try { await api.post(`/inspections/${entry.id}/confirm`); await client.invalidateQueries({queryKey:["vehicle-inspection-history"]}); await client.invalidateQueries({queryKey:["equipment"]}); }
    catch(err) {setError(getErrorMessage(err,"No se pudo confirmar el control"));} finally {setBusy(false);}
  }
  async function remove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const reason = new FormData(event.currentTarget).get("reason");
    if (!window.confirm("Retirar a esta persona no firmante? Se conservara el motivo y se recalculara el control.")) return;
    setBusy(true); setError("");
    try { await api.post(`/inspections/${entry.id}/participants/${removing}/remove`, { revision: entry.revision || 1, reason }); setRemoving(""); await client.invalidateQueries({ queryKey: ["vehicle-inspection-history"] }); await client.invalidateQueries({ queryKey: ["equipment"] }); }
    catch (err) { setError(getErrorMessage(err, "No se pudo retirar al participante")); } finally { setBusy(false); }
  }
  if (entry.voidedAt || entry.confirmationsComplete !== false) return null;
  return <section className="my-3 border-y border-amber-500/30 py-3 text-sm"><p className="font-bold text-amber-200">Pendiente de confirmación del equipo</p><p className="my-2">Firmas: {entry.responsibles.filter(m => m.confirmedAt).length}/{entry.responsibles.length}. Plazo: 24 horas desde el registro.{expired ? " El plazo de firma vencio." : ""}</p><ul>{entry.responsibles.map(member => <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{member.user.profile?.fullName || member.user.username}: {member.confirmedAt ? "Confirmado" : "Pendiente"}</span>{manager && !member.confirmedAt && member.user.id !== entry.createdByUserId && entry.responsibles.length > 1 && <button className="underline" disabled={busy} onClick={() => setRemoving(removing === member.user.id ? "" : member.user.id)}>Retirar participante</button>}</li>)}</ul>
  {removing && <form onSubmit={remove} className="my-3 space-y-2"><label className="block">Motivo del retiro<textarea name="reason" required minLength={10} maxLength={2000} className="app-input" disabled={busy} /></label><div className="flex flex-wrap gap-2"><button disabled={busy} className="app-button w-auto">Confirmar retiro</button><button type="button" className="app-button w-auto" disabled={busy} onClick={() => setRemoving("")}>Cancelar</button></div></form>}
  {own && !own.confirmedAt && !expired && <><label className="my-2 flex items-start gap-2"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)}/>Confirmo que participé en este control y revisé los datos registrados.</label><button disabled={busy || !accepted} className="app-button w-auto" onClick={confirm}>{busy ? "Confirmando..." : "Confirmar mi participación"}</button></>}{error && <p role="alert">{error}</p>}</section>;
}
