"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

type BackButtonProps = {
  fallbackHref?: string;
  className?: string;
  label?: string;
};

export function BackButton({
  fallbackHref = "/dashboard",
  className = "flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95",
  label = "Volver",
}: BackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={className}
      aria-label={label}
      title={label}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}

export function HomeButton({
  className = "flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95",
  label = "Ir al inicio",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Link className={className} href="/dashboard" aria-label={label} title={label}>
      <Home className="h-4 w-4" />
    </Link>
  );
}
