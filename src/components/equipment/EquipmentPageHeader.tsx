"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

type Props = {
  title: string;
  backHref?: string;
  actionHref?: string;
  actionLabel?: string;
};

// Encabezado de las pantallas de un movil. Volver e Inicio los provee la barra superior comun.
export default function EquipmentPageHeader({ title, backHref, actionHref, actionLabel }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        {backHref && <Link href={backHref} className="text-sm text-red-300 underline-offset-4 hover:underline">{backHref === "/equipment" ? "← Móviles" : "← Volver al móvil"}</Link>}
        <h1 className="mt-1 break-words text-2xl font-bold text-white">{title}</h1>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="app-button app-button-red w-auto">
          <ClipboardCheck className="h-4 w-4" aria-hidden />
          {actionLabel}
        </Link>
      )}
    </header>
  );
}
