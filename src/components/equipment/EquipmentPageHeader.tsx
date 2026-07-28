"use client";

import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { BackButton, HomeButton } from "@/components/layout/navigation-buttons";

type Props = {
  title: string;
  backHref?: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function EquipmentPageHeader({
  title,
  backHref,
  actionHref,
  actionLabel,
}: Props) {
  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0a0d]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          {backHref ? (
            <BackButton
              fallbackHref={backHref}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
              <Truck className="h-5 w-5" />
            </div>
          )}

          <h1 className="text-xl font-black uppercase tracking-wide text-red-500 md:text-3xl">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <HomeButton className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10" />
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-red-400"
            >
              <Plus className="h-4 w-4" />
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
