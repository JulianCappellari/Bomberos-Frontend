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
  className = "btn-icon",
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
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

export function HomeButton({
  className = "btn-icon",
  label = "Ir al inicio",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Link className={className} href="/dashboard" aria-label={label} title={label}>
      <Home className="h-5 w-5" />
    </Link>
  );
}
