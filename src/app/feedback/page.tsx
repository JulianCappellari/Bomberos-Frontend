"use client";
import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, EyeOff, Lock, Send, UserRound } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { isCommand } from "@/lib/permissions";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { toast } from "@/lib/toast";
import { clearStepUp } from "@/lib/step-up";

type Kind = "COMPLAINT" | "SUGGESTION" | "IDEA" | "OPINION" | "IMPROVEMENT";
const KINDS: Array<{ value: Kind; label: string }> = [
  { value: "SUGGESTION", label: "Sugerencia" }, { value: "IDEA", label: "Idea" }, { value: "IMPROVEMENT", label: "Mejora" },
  { value: "OPINION", label: "Opinión" }, { value: "COMPLAINT", label: "Queja" },
];
const kindLabel = (k: string) => KINDS.find((x) => x.value === k)?.label ?? k;
type Mine = { id: string; kind: Kind; title: string; body: string; anonymous: boolean; receivedOn: string; readAt: string | null };
type Received = Mine & { sentAt: string | null; author: { name: string | null; rank: string | null } | null; readBy: string | null };
const day = (v: string) => new Date(v).toLocaleDateString("es-AR", { timeZone: "UTC" });

// Buzon confidencial: se entra confirmando la contrasena. Lo recibido lo lee solo jefatura/administracion.
export default function FeedbackPage() {
  const { user } = useAuth(), client = useQueryClient();
  const command = isCommand(user?.role);
  const [tab, setTab] = useState<"send" | "received">(command ? "received" : "send");
  const [anonymous, setAnonymous] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  // Siempre se pide la contrasena al entrar (no se reutiliza la confirmacion de otra pantalla) y se olvida al salir.
  const [ready] = useState(() => { clearStepUp(); return true; });
  useEffect(() => () => { clearStepUp(); client.removeQueries({ queryKey: ["feedback"] }); }, [client]);
  const mine = useQuery({ queryKey: ["feedback", "mine", user?.id], queryFn: async () => (await api.get<Mine[]>("/feedback/mine")).data, enabled: Boolean(user) && ready, retry: false, gcTime: 0 });
  const received = useQuery({ queryKey: ["feedback", "received", user?.id], queryFn: async () => (await api.get<Received[]>("/feedback")).data, enabled: command && tab === "received" && Boolean(mine.data), retry: false, gcTime: 0 });
  const locked = !mine.data;

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, data = new FormData(form);
    setBusy(true); setError("");
    try {
      await api.post("/feedback", { kind: data.get("kind"), title: String(data.get("title") || ""), body: String(data.get("body") || ""), anonymous });
      form.reset(); setAnonymous(true);
      await client.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Enviado a jefatura", anonymous ? "Se envió de forma anónima." : "Se envió con tu nombre.");
    } catch (err) { setError(getErrorMessage(err, "No se pudo enviar")); } finally { setBusy(false); }
  }
  async function markRead(id: string) {
    try { await api.post(`/feedback/${id}/read`, {}); await client.invalidateQueries({ queryKey: ["feedback"] }); }
    catch (err) { setError(getErrorMessage(err, "No se pudo marcar como leído")); }
  }

  return <ProtectedLayout><main className="screen-body">
    <h1 className="flex items-center gap-2 text-2xl font-bold"><Lock className="h-5 w-5 text-red-400" aria-hidden /> Buzón de sugerencias</h1>
    <p className="mb-4 mt-1 text-sm text-[var(--mut)]">Quejas, sugerencias, ideas, opiniones y mejoras. Lo lee solo jefatura y administración. Para entrar se confirma tu contraseña.</p>
    {locked && <div className="card space-y-3"><p className="text-sm">{mine.isFetching ? "Confirmá tu contraseña para entrar al buzón." : "Para entrar al buzón tenés que confirmar tu contraseña."}</p>{!mine.isFetching && <button className="app-button app-button-red w-auto" onClick={() => void mine.refetch()}>Confirmar contraseña</button>}</div>}
    {!locked && <>
      {command && <div role="tablist" className="mb-4 grid grid-cols-2 gap-2 sm:inline-grid">
        {([["received", "Recibidas"], ["send", "Enviar y mis envíos"]] as const).map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${tab === k ? "border-red-500 bg-red-500/10" : "border-[var(--bord)]"}`}>{label}{k === "received" && received.data ? ` (${received.data.filter((r) => !r.readAt).length} sin leer)` : ""}</button>)}
      </div>}
      {error && <ErrorNotice>{error}</ErrorNotice>}

      {tab === "received" && command && <section className="space-y-3" aria-label="Recibidas">
        {received.isLoading && <ListSkeleton label="Cargando buzón" />}
        {received.data?.length === 0 && <p className="py-6 text-center text-sm text-[var(--mut)]">Todavía no llegó nada al buzón.</p>}
        {received.data?.map((r) => <article key={r.id} className={`rounded-xl border p-4 ${r.readAt ? "border-[var(--bord)]" : "border-amber-500/50 bg-amber-500/5"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="badge">{kindLabel(r.kind)}</span>
            <span className="text-xs text-[var(--mut)]">Recibida el {day(r.receivedOn)}</span>
          </div>
          <h2 className="mt-2 break-words font-bold">{r.title}</h2>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{r.body}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--mut)]">{r.anonymous ? <><EyeOff className="h-3.5 w-3.5" aria-hidden /> Anónimo: el sistema no guarda quién lo envió.</> : <><UserRound className="h-3.5 w-3.5" aria-hidden /> {r.author?.name}{r.author?.rank ? ` · ${r.author.rank}` : ""}</>}</p>
          <div className="mt-3">{r.readAt ? <p className="flex items-center gap-1.5 text-xs text-[var(--ok-text)]"><CheckCheck className="h-4 w-4" aria-hidden /> Leído{r.readBy ? ` por ${r.readBy}` : ""}</p> : <button className="app-button w-auto" onClick={() => void markRead(r.id)}>Marcar como leído</button>}</div>
        </article>)}
      </section>}

      {tab === "send" && <>
        <form onSubmit={send} className="card"><fieldset disabled={busy} className="space-y-3">
          <Field label="Tipo"><select name="kind" className="app-input" defaultValue="SUGGESTION">{KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select></Field>
          <Field label="Título"><input name="title" className="app-input" required minLength={3} maxLength={160} /></Field>
          <Field label="Mensaje"><textarea name="body" className="app-input min-h-32" required minLength={5} maxLength={4000} /></Field>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">¿Cómo querés enviarlo?</legend>
            <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${anonymous ? "border-red-500 bg-red-500/5" : "border-[var(--bord)]"}`}><input type="radio" name="mode" checked={anonymous} onChange={() => setAnonymous(true)} className="mt-1" /><span><span className="block font-semibold">Anónimo</span><span className="text-xs text-[var(--mut)]">No queda registrado quién lo envió en ningún lugar del sistema. Solo vos lo ves en tus envíos.</span></span></label>
            <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${!anonymous ? "border-red-500 bg-red-500/5" : "border-[var(--bord)]"}`}><input type="radio" name="mode" checked={!anonymous} onChange={() => setAnonymous(false)} className="mt-1" /><span><span className="block font-semibold">Con mi nombre</span><span className="text-xs text-[var(--mut)]">Jefatura ve quién lo envió y te avisa cuando lo lee.</span></span></label>
          </fieldset>
          <button className="app-button app-button-red w-auto"><Send className="h-4 w-4" aria-hidden /> {busy ? "Enviando…" : "Enviar a jefatura"}</button>
        </fieldset></form>
        <section className="mt-6" aria-label="Mis envíos">
          <h2 className="mb-2 text-lg font-bold">Mis envíos</h2>
          {mine.isLoading && <ListSkeleton label="Cargando tus envíos" />}
          {mine.data?.length === 0 && <p className="text-sm text-[var(--mut)]">Todavía no enviaste nada.</p>}
          <ul className="space-y-2">{mine.data?.map((m) => <li key={m.id} className="rounded-xl border border-[var(--bord)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{kindLabel(m.kind)} · {m.title}</span>{m.readAt ? <span className="badge badge-green inline-flex items-center gap-1"><CheckCheck className="h-3.5 w-3.5" aria-hidden /> Leído</span> : <span className="badge">Sin leer</span>}</div>
            <p className="mt-1 text-xs text-[var(--mut)]">{day(m.receivedOn)} · {m.anonymous ? "Anónimo" : "Con tu nombre"}</p>
          </li>)}</ul>
        </section>
      </>}
    </>}
  </main></ProtectedLayout>;
}
