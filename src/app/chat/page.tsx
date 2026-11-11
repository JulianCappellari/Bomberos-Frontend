"use client";
import { toast } from "@/lib/toast";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import {
  BarChart3,
  Check,
  CheckSquare,
  Circle,
  CircleCheck,
  Lock,
  MessageCircle,
  Plus,
  Pencil,
  Pin,
  PinOff,
  Search,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAuth } from "@/features/auth/auth-context";
import {
  useChatMessages,
  useCreateChatMessage,
  useDeleteChatMessage,
  usePinChatMessage,
  useUpdateChatMessage,
} from "@/hooks/use-chat";
import { getErrorMessage } from "@/lib/get-error-message";
import { ChatAudience, chatAudienceLabels, ChatMessage, ChatPoll } from "@/types/chat";
import { closePollRequest, votePollRequest } from "@/services/chat.service";
import { MessageAcknowledgement } from "@/components/operations/message-acknowledgement";
import { chatOutboxEvent, discardChatMessage, flushChatOutbox, isNetworkError, queueChatMessage, QueuedMessage, readChatOutbox } from "@/lib/chat-outbox";
import { useQueryClient } from "@tanstack/react-query";

function displayName(message: ChatMessage) {
  return (
    message.author.profile?.fullName ||
    message.author.username ||
    "Usuario"
  );
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ChatPage() {
  const { user } = useAuth();
  const { data: messages = [], isLoading, isError } = useChatMessages();
  const createMutation = useCreateChatMessage();
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [sendError, setSendError] = useState("");
  const [audience, setAudience] = useState<ChatAudience>("ALL");
  const [queued, setQueued] = useState<QueuedMessage[]>([]);
  // Encuesta: el texto del mensaje es la pregunta.
  const [pollMode, setPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const client = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const refresh = () => setQueued(readChatOutbox(user.id));
    const flush = async () => { if (await flushChatOutbox(user.id)) await client.invalidateQueries({ queryKey: ["chat"] }); refresh(); };
    refresh(); void flush();
    window.addEventListener("online", flush); window.addEventListener(chatOutboxEvent, refresh);
    return () => { window.removeEventListener("online", flush); window.removeEventListener(chatOutboxEvent, refresh); };
  }, [user, client]);
  const userHasCommandRank = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const showAcknowledgement = user?.profile?.rank?.toLocaleLowerCase() !== "administrador";

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    if (!q) return messages;
    return messages.filter((message) => message.body.toLocaleLowerCase().includes(q) || displayName(message).toLocaleLowerCase().includes(q));
  }, [messages, search]);
  const pinned = filtered.filter((message) => message.isPinned);
  const recent = filtered.filter((message) => !message.isPinned);

  async function send() {
    const trimmed = body.trim();
    if (!trimmed || createMutation.isPending) return;
    setSendError("");
    if (pollMode) {
      const options = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (options.length < 2) { setSendError("La encuesta necesita al menos 2 opciones."); return; }
      if (new Set(options.map((o) => o.toLocaleLowerCase())).size !== options.length) { setSendError("Hay opciones repetidas."); return; }
      try {
        await createMutation.mutateAsync({ body: trimmed, audience, poll: { options, allowMultiple } });
        setBody(""); setPollMode(false); setPollOptions(["", ""]); setAllowMultiple(false);
        toast.success("Encuesta publicada");
      } catch (error: unknown) {
        setSendError(isNetworkError(error) ? "Sin señal: las encuestas necesitan conexión para publicarse." : getErrorMessage(error, "No se pudo publicar la encuesta."));
      }
      return;
    }
    const queue = () => { try { queueChatMessage(user!.id, trimmed, audience); setBody(""); setSendError("Sin señal: el mensaje se guardó y se envía solo cuando vuelva la conexión."); } catch (err) { setSendError(getErrorMessage(err, "No se pudo guardar el mensaje")); } };
    if (user && !navigator.onLine) { queue(); return; }
    try {
      await createMutation.mutateAsync({ body: trimmed, audience });
      setBody("");
      toast.success("Mensaje enviado");
    } catch (error: unknown) {
      if (user && isNetworkError(error)) queue();
      else setSendError(getErrorMessage(error, "No se pudo enviar el mensaje."));
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send();
  }

  const renderMessage = (message: ChatMessage) => (
    <div key={message.id}>
      <ChatMessageCard
        message={message}
        canEdit={message.author.id === user?.id && !message.poll}
        canDelete={userHasCommandRank || message.author.id === user?.id}
        canPin={userHasCommandRank}
        userId={user?.id}
        canVote={showAcknowledgement}
        canClosePoll={userHasCommandRank || message.author.id === user?.id}
      />
      {showAcknowledgement && <MessageAcknowledgement message={message} />}
    </div>
  );

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <header className="mb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><MessageCircle className="h-6 w-6 text-red-400" aria-hidden /> Comunicaciones</h1>
          <p className="mt-1 text-sm text-[var(--mut)]">Avisos internos para todo el cuartel. Confirmá la lectura de cada mensaje.{userHasCommandRank ? " Podés fijar los avisos importantes para que queden arriba." : ""}</p>
        </header>

        <form onSubmit={submitMessage} className="card">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="chat-message" className="app-label mb-0">{pollMode ? "Pregunta de la encuesta" : "Nuevo mensaje"}</label>
              <button type="button" aria-pressed={pollMode} onClick={() => { setPollMode((v) => !v); setSendError(""); }} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${pollMode ? "border-red-500/60 bg-red-500/15 text-[var(--txt)]" : "border-[var(--bord)] text-[var(--mut)] hover:text-[var(--txt)]"}`}>
                <BarChart3 className="h-3.5 w-3.5" aria-hidden /> Encuesta
              </button>
            </div>
            {/* 25: mensajes a un grupo; solo lo ven y confirman sus integrantes (y jefatura). */}
            <label className="flex items-center gap-2 text-xs text-[var(--mut)]">Para
              <select value={audience} onChange={(e) => setAudience(e.target.value as ChatAudience)} className="app-input w-auto py-1.5 text-sm">
                {(Object.keys(chatAudienceLabels) as ChatAudience[]).map((key) => <option key={key} value={key}>{chatAudienceLabels[key]}</option>)}
              </select>
            </label>
          </div>
          <textarea
            id="chat-message"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void send(); } }}
            maxLength={1000}
            className={`app-input resize-y ${pollMode ? "min-h-[56px]" : "min-h-[88px]"}`}
            placeholder={pollMode ? "Ej. ¿Qué día les queda mejor la capacitación?" : "Escribí una novedad, pedido o aviso…"}
          />
          {pollMode && <fieldset className="mt-3 space-y-2">
            <legend className="app-label">Opciones</legend>
            {pollOptions.map((option, index) => <div key={index} className="flex items-center gap-2">
              <input className="app-input" value={option} maxLength={120} aria-label={`Opción ${index + 1}`} placeholder={`Opción ${index + 1}`}
                onChange={(e) => setPollOptions((rows) => rows.map((row, i) => i === index ? e.target.value : row))}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.ctrlKey || e.metaKey) return;
                  // Enter pasa a la opcion siguiente (y la crea si es la ultima), como en WhatsApp.
                  e.preventDefault();
                  if (index === pollOptions.length - 1) {
                    if (pollOptions.length >= 12 || !option.trim()) return;
                    flushSync(() => setPollOptions((rows) => [...rows, ""]));
                  }
                  document.querySelector<HTMLInputElement>(`[data-poll-option="${index + 1}"]`)?.focus();
                }} data-poll-option={index} />
              {pollOptions.length > 2 && <button type="button" className="btn-icon h-9 w-9 shrink-0" aria-label={`Quitar opción ${index + 1}`} title="Quitar opción" onClick={() => setPollOptions((rows) => rows.filter((_, i) => i !== index))}><X className="h-4 w-4" /></button>}
            </div>)}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {pollOptions.length < 12 ? <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline" onClick={() => setPollOptions((rows) => [...rows, ""])}><Plus className="h-4 w-4" aria-hidden /> Agregar opción</button> : <span className="text-xs text-[var(--mut)]">Máximo 12 opciones</span>}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} className="h-4 w-4 accent-red-600" /> Permitir varias respuestas</label>
            </div>
          </fieldset>}
          {sendError && <p role="alert" className="mt-2 text-sm text-red-300">{sendError}</p>}
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--mut)]">{body.length > 800 ? `${body.length}/1000 caracteres` : <span className="hidden sm:inline">Ctrl + Enter para enviar</span>}</span>
            <button type="submit" disabled={createMutation.isPending || !body.trim()} className="app-button app-button-red w-auto px-5 disabled:cursor-not-allowed disabled:opacity-60">
              <Send className="h-4 w-4" /> {createMutation.isPending ? "Enviando…" : pollMode ? "Publicar encuesta" : "Enviar"}
            </button>
          </div>
        </form>

        {queued.length > 0 && <section className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3" aria-label="Mensajes sin enviar">
          <p className="text-sm font-semibold text-amber-100">{queued.length === 1 ? "1 mensaje espera señal para enviarse" : `${queued.length} mensajes esperan señal para enviarse`}</p>
          <ul className="mt-2 space-y-1">{queued.map((row) => <li key={row.id} className="flex items-start justify-between gap-2 text-sm"><span className="min-w-0 break-words">{row.body}</span><button type="button" className="shrink-0 text-xs underline" onClick={() => discardChatMessage(user!.id, row.id)}>Descartar</button></li>)}</ul>
        </section>}

        {messages.length > 3 && (
          <label className="relative mt-4 block">
            <span className="sr-only">Buscar mensajes</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--mut)]" aria-hidden />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por texto o autor" className="app-input pl-9" />
          </label>
        )}

        {isLoading && <div className="card mt-4 text-sm text-[var(--mut)]">Cargando mensajes…</div>}
        {isError && <div className="card mt-4 border-red-500/30 bg-red-500/10 text-sm text-red-300">No se pudo cargar el chat. Revisá la conexión y volvé a intentar.</div>}
        {!isLoading && !isError && messages.length === 0 && <div className="card mt-4 text-sm text-[var(--mut)]">Todavía no hay mensajes. Publicá el primer aviso del turno.</div>}
        {messages.length > 0 && filtered.length === 0 && <p className="mt-4 text-sm text-[var(--mut)]">Ningún mensaje coincide con la búsqueda.</p>}

        {pinned.length > 0 && (
          <section className="mt-5 space-y-3" aria-labelledby="pinned-title">
            <h2 id="pinned-title" className="flex items-center gap-2 text-sm font-bold text-white"><Pin className="h-4 w-4 text-red-400" aria-hidden /> Fijados ({pinned.length})</h2>
            {pinned.map(renderMessage)}
          </section>
        )}
        {recent.length > 0 && (
          <section className="mt-5 space-y-3" aria-labelledby="recent-title">
            <h2 id="recent-title" className="text-sm font-bold text-white">Recientes</h2>
            {recent.map(renderMessage)}
          </section>
        )}
      </main>
    </ProtectedLayout>
  );
}

function ChatMessageCard({
  message,
  canEdit,
  canDelete,
  canPin,
  userId,
  canVote,
  canClosePoll,
}: {
  message: ChatMessage;
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
  userId?: string;
  canVote: boolean;
  canClosePoll: boolean;
}) {
  const updateMutation = useUpdateChatMessage();
  const deleteMutation = useDeleteChatMessage();
  const pinMutation = usePinChatMessage();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [error, setError] = useState("");

  async function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    setError("");
    try {
      await updateMutation.mutateAsync({ id: message.id, body: trimmed });
      setIsEditing(false);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo editar el mensaje."));
    }
  }

  async function deleteMessage() {
    const confirmed = window.confirm("¿Borrar este mensaje? No se puede deshacer.");
    if (!confirmed) return;

    setError("");
    try {
      await deleteMutation.mutateAsync(message.id);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo borrar el mensaje."));
    }
  }

  async function togglePin() {
    setError("");
    try {
      await pinMutation.mutateAsync({
        id: message.id,
        isPinned: !message.isPinned,
      });
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo fijar el mensaje."));
    }
  }

  return (
    <article
      className={[
        "rounded-xl border p-4",
        message.isPinned
          ? "border-red-500/35 bg-red-500/10"
          : "border-[var(--bord)] bg-[var(--card)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-bold text-white">
              {displayName(message)}
            </h2>
            {message.audience && message.audience !== "ALL" && <span className="badge badge-blue">Para: {chatAudienceLabels[message.audience]}</span>}
            {message.poll && <span className="badge badge-blue inline-flex items-center gap-1"><BarChart3 className="h-3 w-3" aria-hidden />Encuesta</span>}
            {message.isPinned && (
              <span className="badge badge-red inline-flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Fijado
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--mut)]">
            {message.author.profile?.rank || "Integrante"} ·{" "}
            {formatMessageTime(message.createdAt)}
            {message.editedAt ? " · editado" : ""}
          </div>
        </div>

        {(canEdit || canDelete || canPin) && (
          <div className="flex shrink-0 items-center gap-1">
            {canPin && (
              <button
                type="button"
                onClick={togglePin}
                disabled={pinMutation.isPending}
                className="btn-icon h-9 w-9"
                aria-label={message.isPinned ? "Quitar de fijados" : "Fijar arriba"} title={message.isPinned ? "Quitar de fijados" : "Fijar arriba"}
              >
                {message.isPinned ? (
                  <PinOff className="h-4 w-4" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </button>
            )}
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setDraft(message.body);
                  setIsEditing(true);
                }}
                className="btn-icon h-9 w-9"
                aria-label="Editar" title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={deleteMessage}
                disabled={deleteMutation.isPending}
                className="btn-icon h-9 w-9 text-red-300"
                aria-label="Borrar" title="Borrar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
      {isEditing ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={1000}
            className="app-input min-h-[90px] resize-none"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setDraft(message.body);
              }}
              className="app-button app-button-outline"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={updateMutation.isPending || !draft.trim()}
              className="app-button app-button-red disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-6 text-[var(--txt)]">
          {message.body}
        </p>
      )}
      {message.poll && <PollView poll={message.poll} userId={userId} canVote={canVote} canClose={canClosePoll} />}
    </article>
  );
}

// Encuesta estilo WhatsApp: tocar una opcion vota; en eleccion unica, tocar la propia la retira.
function PollView({ poll, userId, canVote, canClose }: { poll: ChatPoll; userId?: string; canVote: boolean; canClose: boolean }) {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showVoters, setShowVoters] = useState(false);
  const mine = poll.options.filter((o) => o.votes.some((v) => v.userId === userId)).map((o) => o.id);
  const voters = new Set(poll.options.flatMap((o) => o.votes.map((v) => v.userId)));
  const maxVotes = Math.max(0, ...poll.options.map((o) => o.votes.length));
  const closed = Boolean(poll.closedAt);
  const interactive = canVote && !closed && !busy;

  async function run(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true); setError("");
    try { await fn(); await client.invalidateQueries({ queryKey: ["chat", "messages"] }); if (ok) toast.success(ok); }
    catch (err) { setError(getErrorMessage(err, "No se pudo registrar el voto.")); }
    finally { setBusy(false); }
  }
  function choose(optionId: string) {
    if (!interactive) return;
    const selected = mine.includes(optionId);
    const next = poll.allowMultiple ? (selected ? mine.filter((id) => id !== optionId) : [...mine, optionId]) : (selected ? [] : [optionId]);
    void run(() => votePollRequest(poll.id, next), next.length ? undefined : "Retiraste tu voto");
  }
  async function close() {
    if (!window.confirm("¿Cerrar la encuesta? Nadie más va a poder votar ni cambiar su voto.")) return;
    await run(() => closePollRequest(poll.id), "Encuesta cerrada");
  }
  const name = (v: ChatPoll["options"][number]["votes"][number]) => v.user.profile?.fullName || v.user.username;

  return <div className="mt-3 rounded-xl border border-[var(--bord)] bg-[var(--card2)] p-3">
    <p className="mb-2 text-xs text-[var(--mut)]">{closed ? "Encuesta cerrada" : poll.allowMultiple ? "Elegí una o varias opciones" : "Elegí una opción"}</p>
    <ul className="space-y-2" role={poll.allowMultiple ? "group" : "radiogroup"} aria-label="Opciones de la encuesta">
      {poll.options.map((option) => {
        const selected = mine.includes(option.id);
        const count = option.votes.length;
        const pct = voters.size ? Math.round((count / voters.size) * 100) : 0;
        const leader = closed && count > 0 && count === maxVotes;
        const Icon = poll.allowMultiple ? (selected ? CheckSquare : Square) : (selected ? CircleCheck : Circle);
        return <li key={option.id}>
          <button type="button" role={poll.allowMultiple ? "checkbox" : "radio"} aria-checked={selected} disabled={!interactive} onClick={() => choose(option.id)}
            className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left transition-colors ${selected ? "border-red-500/60" : "border-[var(--bord)]"} ${interactive ? "hover:border-red-400/60" : "cursor-default"}`}>
            <span aria-hidden className={`absolute inset-y-0 left-0 transition-[width] duration-500 ease-out ${leader || selected ? "bg-red-500/20" : "bg-[var(--bord)]/40"}`} style={{ width: `${pct}%` }} />
            <span className="relative flex items-center gap-2">
              {canVote && <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-red-400" : "text-[var(--mut)]"}`} aria-hidden />}
              <span className={`min-w-0 flex-1 break-words text-sm ${leader ? "font-bold" : ""}`}>{option.text}</span>
              <span className="shrink-0 text-xs tabular-nums text-[var(--mut)]">{count} · {pct}%</span>
            </span>
          </button>
          {showVoters && count > 0 && <p className="mt-1 px-1 text-xs text-[var(--mut)]">{option.votes.map(name).join(", ")}</p>}
        </li>;
      })}
    </ul>
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--mut)]">
      <span>{voters.size === 1 ? "1 persona votó" : `${voters.size} personas votaron`}{!canVote ? " · El administrador del sistema no vota" : ""}</span>
      <span className="flex items-center gap-3">
        {voters.size > 0 && <button type="button" className="underline" onClick={() => setShowVoters((v) => !v)}>{showVoters ? "Ocultar votos" : "Ver votos"}</button>}
        {canClose && !closed && <button type="button" disabled={busy} className="inline-flex items-center gap-1 underline" onClick={() => void close()}><Lock className="h-3 w-3" aria-hidden />Cerrar encuesta</button>}
      </span>
    </div>
  </div>;
}
