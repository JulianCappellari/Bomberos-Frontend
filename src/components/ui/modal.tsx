"use client";

import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  pending?: boolean;
  dismissOnBackdrop?: boolean;
  animate?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

function OpenModal({
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
  pending = false,
  dismissOnBackdrop = true,
  animate = true,
}: Omit<ModalProps, "open">) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Native modality isolates focus and restores it to the opener on close.
    closeButton.current?.setAttribute("autofocus", "");
    function show() {
      if (dialog?.isConnected && !dialog.open && !document.querySelector("dialog[data-urgent-alert]:modal")) dialog.showModal();
    }
    show();
    document.addEventListener("bomberos:urgent-dialog-closed", show);
    return () => {
      document.removeEventListener("bomberos:urgent-dialog-closed", show);
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      data-bomberos-dialog
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "Ventana"}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={pending || undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(event) => {
        if (pending || !dismissOnBackdrop || event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
      }}
      className={cn(
        "fixed inset-x-0 top-auto bottom-0 mx-auto w-full max-h-[min(92dvh,880px)] overflow-hidden rounded-t-3xl border border-white/10 bg-[#12151c] text-white shadow-2xl",
        animate && "dialog-panel",
        "sm:inset-y-0 sm:my-auto sm:w-[calc(100%-2rem)] sm:rounded-2xl",
        sizeClasses[size],
        className,
      )}
    >
      <div className="flex max-h-[min(92dvh,880px)] flex-col">
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/[0.08] p-5 pb-4 sm:p-6 sm:pb-4">
          <div className="min-w-0 space-y-1 pr-6">
            {title && <h2 id={titleId} className="font-[family-name:var(--font-bebas)] text-xl uppercase tracking-wider text-white sm:text-2xl">{title}</h2>}
            {description && <p id={descriptionId} className="text-xs text-white/50 sm:text-sm">{description}</p>}
          </div>
          <button ref={closeButton} type="button" onClick={onClose} disabled={pending} className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50" aria-label="Cerrar" title="Cerrar">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          {children}
        </div>
      </div>
    </dialog>
  );
}

export function Modal({ open, ...props }: ModalProps) {
  return open ? <OpenModal {...props} /> : null;
}
