"use client";
import { TaskPhotoPicker } from "@/components/operations/task-photos";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Forward, X } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { WorkTask } from "@/types/work";
import { taskAction } from "@/services/work.service";
import { getUserRosterRequest } from "@/services/user.service";
import { getErrorMessage } from "@/lib/get-error-message";
import { ErrorNotice, Field, personName } from "./operations-ui";
import { localNow, OperationDialog } from "./work-ui";
import { isAxiosError } from "axios";
import { queueTask, QueuedTask } from "@/lib/task-outbox";

export function TaskQuickActions({ task }: { task: WorkTask }) {
  const { user } = useAuth(), client = useQueryClient();
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [mode, setMode] = useState<"submit" | "transfer" | "decline" | null>(null);
  const [notes, setNotes] = useState(""), [target, setTarget] = useState(""), [time, setTime] = useState(""), [urls, setUrls] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const people = useQuery({ queryKey: ["work-roster", user?.id], queryFn: getUserRosterRequest, enabled: mode === "transfer" });
  const member = task.members.find((m) => m.userId === user?.id);
  if (!member || member.declinedAt || !["ASSIGNED", "RETURNED"].includes(task.status)) return null;
  function open(value: typeof mode) { setMode(value); setNotes(""); setTarget(""); setTime(localNow()); setUrls(""); setPhotos([]); setError(""); }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!mode || busy) return; setBusy(true); setError("");
    const route = mode === "submit" ? "submit" : "member";
    const body: QueuedTask["body"] = { revision: task.revision, notes, ...(mode === "submit" ? { photos, completedAt: new Date(time).toISOString(), evidenceUrls: urls.split("\n").map((v) => v.trim()).filter(Boolean) } : { action: mode === "transfer" ? "TRANSFER" as const : "DECLINE" as const, ...(mode === "transfer" ? { targetUserId: target } : {}) }) };
    try {
      if (!navigator.onLine) { if (!user) throw new Error("Sesion no disponible"); queueTask(user.id, { id: crypto.randomUUID(), taskId: task.id, title: task.title, route, body, savedAt: Date.now(), conflict: false }); setMode(null); return; }
      await taskAction(task.id, route, body);
      setMode(null); await client.invalidateQueries({ queryKey: ["tasks"] }); await client.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      if (user && isAxiosError(err) && !err.response) { try { queueTask(user.id, { id: crypto.randomUUID(), taskId: task.id, title: task.title, route, body, savedAt: Date.now(), conflict: false }); setMode(null); } catch (storageError) { setError(getErrorMessage(storageError, "No se pudo guardar el pendiente local")); } }
      else setError(getErrorMessage(err, "No se pudo guardar. Se conserva el formulario para reintentar."));
    }
    finally { setBusy(false); }
  }
  const title = mode === "submit" ? "Informar finalizacion" : mode === "transfer" ? "Solicitar reasignación" : "Informar que no puedo";
  return <><div className="mt-3 grid grid-cols-1 gap-2 min-[400px]:grid-cols-3"><button className="flex min-h-10 items-center justify-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 text-xs font-bold text-emerald-200" onClick={() => open("submit")}><Check size={15} /> La hice</button><button className="flex min-h-10 items-center justify-center gap-1 rounded border border-sky-500/40 bg-sky-500/10 px-2 text-xs font-bold text-sky-200" onClick={() => open("transfer")}><Forward size={15} /> Solicitar cambio</button><button className="flex min-h-10 items-center justify-center gap-1 rounded border border-red-500/40 bg-red-500/10 px-2 text-xs font-bold text-red-200" onClick={() => open("decline")}><X size={15} /> No puedo</button></div>
    {mode && <OperationDialog title={`${title}: ${task.title}`} pending={busy} onClose={() => setMode(null)}><form onSubmit={submit}><fieldset disabled={busy} className="space-y-3">{error && <ErrorNotice>{error}</ErrorNotice>}<Field label={mode === "submit" ? "Trabajo realizado" : "Motivo"}><textarea autoFocus required minLength={5} maxLength={mode === "submit" ? 4000 : 2000} className="app-input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>{mode === "submit" && <><Field label="Fecha y hora"><input required type="datetime-local" step="1" className="app-input" value={time} onChange={(e) => setTime(e.target.value)} /></Field><TaskPhotoPicker photos={photos} onChange={setPhotos} onBusyChange={setPhotoBusy} /><Field label="Enlaces HTTPS de evidencia (hasta 3)"><textarea className="app-input" maxLength={1502} value={urls} onChange={(e) => setUrls(e.target.value)} /></Field></>}{mode === "transfer" && <><Field label="Integrante"><select required className="app-input" value={target} onChange={(e) => setTarget(e.target.value)}><option value="">Seleccionar</option>{people.data?.filter((p) => !task.members.some((m) => m.userId === p.id)).map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}</select></Field>{people.isError && <ErrorNotice>No se pudo cargar el personal.</ErrorNotice>}</>}<button disabled={busy || photoBusy || mode === "transfer" && !target} className="app-button app-button-red">{busy ? "Guardando..." : mode === "submit" ? "Enviar a verificacion" : "Confirmar"}</button></fieldset></form></OperationDialog>}
  </>;
}
