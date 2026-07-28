"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Check,
  MessageCircle,
  Pencil,
  Pin,
  PinOff,
  Send,
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
import { isCommandRank } from "@/lib/ranks";
import { ChatMessage } from "@/types/chat";

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
  const userHasCommandRank = isCommandRank(user?.profile?.rank);

  const pinnedCount = useMemo(
    () => messages.filter((message) => message.isPinned).length,
    [messages],
  );

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = body.trim();
    if (!trimmed) return;

    try {
      await createMutation.mutateAsync(trimmed);
      setBody("");
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo enviar el mensaje."));
    }
  }

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <section className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="section-title mb-1 mt-0">Chat operativo</div>
              <p className="text-sm text-[var(--mut)]">
                Comunicacion interna visible para todo el cuartel. Oficiales y
                sub oficiales pueden fijar o retirar mensajes.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400">
              <MessageCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniStat label="Mensajes" value={messages.length} />
            <MiniStat label="Fijados" value={pinnedCount} />
          </div>
        </section>

        <form onSubmit={submitMessage} className="card">
          <label htmlFor="chat-message" className="app-label">
            Nuevo mensaje
          </label>
          <textarea
            id="chat-message"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={1000}
            className="app-input min-h-[98px] resize-none"
            placeholder="Escribi una novedad, pedido o aviso..."
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--mut)]">
              {body.trim().length}/1000
            </span>
            <button
              type="submit"
              disabled={createMutation.isPending || !body.trim()}
              className="app-button app-button-red max-w-[180px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              Enviar
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="card text-sm text-[var(--mut)]">
            Cargando mensajes...
          </div>
        )}

        {isError && (
          <div className="card border-red-500/30 bg-red-500/10 text-sm text-red-300">
            No se pudo cargar el chat.
          </div>
        )}

        {!isLoading && !isError && messages.length === 0 && (
          <div className="card text-sm text-[var(--mut)]">
            Todavia no hay mensajes. Publica el primer aviso del turno.
          </div>
        )}

        <section className="space-y-3">
          {messages.map((message) => (
            <ChatMessageCard
              key={message.id}
              message={message}
              canEdit={message.author.id === user?.id}
              canDelete={userHasCommandRank}
              canPin={userHasCommandRank}
            />
          ))}
        </section>
      </main>
    </ProtectedLayout>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-[var(--bord)] bg-[var(--card2)] p-3 text-center">
      <div className="font-['Bebas_Neue'] text-2xl text-red-400">
        {value}
      </div>
      <div className="text-xs uppercase tracking-[0.08em] text-[var(--mut)]">
        {label}
      </div>
    </div>
  );
}

function ChatMessageCard({
  message,
  canEdit,
  canDelete,
  canPin,
}: {
  message: ChatMessage;
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
}) {
  const updateMutation = useUpdateChatMessage();
  const deleteMutation = useDeleteChatMessage();
  const pinMutation = usePinChatMessage();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);

  async function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    try {
      await updateMutation.mutateAsync({ id: message.id, body: trimmed });
      setIsEditing(false);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo editar el mensaje."));
    }
  }

  async function deleteMessage() {
    const confirmed = window.confirm("Borrar este mensaje del chat?");
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(message.id);
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo borrar el mensaje."));
    }
  }

  async function togglePin() {
    try {
      await pinMutation.mutateAsync({
        id: message.id,
        isPinned: !message.isPinned,
      });
    } catch (error: unknown) {
      window.alert(getErrorMessage(error, "No se pudo fijar el mensaje."));
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
            {message.isPinned && (
              <span className="badge badge-red inline-flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Fijado
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--mut)]">
            {message.author.profile?.rank || message.author.role} ·{" "}
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
                aria-label={message.isPinned ? "Desfijar" : "Fijar"}
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
                aria-label="Editar"
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
                aria-label="Borrar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

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
    </article>
  );
}
