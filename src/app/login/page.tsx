"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, FlaskConical, ChevronRight } from "lucide-react";
import { StationCrest } from "@/components/layout/station-crest";
import { useAuth } from "@/features/auth/auth-context";
import { getErrorMessage } from "@/lib/get-error-message";
import { Button } from "@/components/ui/button";
import { demoProfilesRequest } from "@/services/auth.service";
import type { DemoProfile } from "@/types/auth";

const schema = z.object({
  username: z.string().min(1, "Ingresá tu nombre de usuario"),
  password: z.string().min(1, "Ingresá tu contraseña de acceso"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Demo: perfiles ficticios para conocer el sistema. Solo aparece si el servidor tiene la demo activa.
  const [demoProfiles, setDemoProfiles] = useState<DemoProfile[]>([]);
  const [demoBusy, setDemoBusy] = useState("");
  const [demoError, setDemoError] = useState("");

  useEffect(() => {
    let active = true;
    demoProfilesRequest().then((data) => { if (active && data.enabled) setDemoProfiles(data.profiles); }).catch(() => { /* Sin demo: solo el ingreso normal. */ });
    return () => { active = false; };
  }, []);

  async function enterDemo(profile: string) {
    try {
      setDemoError("");
      setDemoBusy(profile);
      await demoLogin(profile);
      router.replace("/dashboard");
    } catch (error: unknown) {
      setDemoError(getErrorMessage(error, "La demostración no está disponible en este momento."));
      setDemoBusy("");
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormData) {
    try {
      setServerError("");
      const user = await login(values.username, values.password);
      router.replace(user.mustChangePassword ? "/security" : "/dashboard");
    } catch (error: unknown) {
      setServerError(getErrorMessage(error, "Credenciales incorrectas o servidor no disponible"));
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08090b] text-white lg:grid lg:grid-cols-2">
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-red-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 -bottom-40 h-96 w-96 rounded-full bg-red-900/20 blur-[140px]" />
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />

      <section className="relative z-10 hidden flex-col justify-between px-10 py-12 lg:flex xl:px-16">
        <div className="flex items-center gap-3">
          <StationCrest height={88} label="Escudo de Bomberos Voluntarios de Sampacho" />
          <div>
            <p className="font-[family-name:var(--font-bebas)] text-3xl tracking-wider">
              BOMBEROS <span className="text-red-500">SAMPACHO</span>
            </p>
            <p className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold tracking-[0.18em] text-white/40 uppercase">
              Córdoba, Argentina
            </p>
          </div>
        </div>

        <div className="max-w-xl space-y-6">
          <h2 className="font-[family-name:var(--font-bebas)] text-6xl leading-[0.9] tracking-wide text-white uppercase">
            El cuartel, en una sola guardia.
          </h2>
          <p className="max-w-md text-base text-white/55">
            Alertas, flota, turnos y personal del cuartel Sampacho, listos para consultarse desde el teléfono o la guardia.
          </p>
          <ul className="grid max-w-lg gap-3 text-sm text-white/70">
            {[
              "Despacho y seguimiento de alertas",
              "Estado de la flota y los controles",
              "Guardias, asistencia y comunicaciones",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold tracking-[0.18em] text-white/30 uppercase">
          Asociación Bomberos Voluntarios Sampacho
        </p>
      </section>

      <div className="relative z-10 flex min-h-screen items-center justify-center border-white/10 bg-[#0c0e13]/80 px-4 py-10 backdrop-blur-sm sm:px-8 lg:border-l">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md space-y-6"
      >
        {/* Top security tag */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <div className="flex items-center gap-1.5 font-[family-name:var(--font-barlow-condensed)] text-[11px] font-bold uppercase tracking-widest text-red-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Acceso Operativo Seguro
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Brand header */}
        <div className="space-y-2 text-center lg:hidden">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mx-auto flex justify-center"
          >
            <StationCrest height={96} label="Escudo de Bomberos Voluntarios de Sampacho" />
          </motion.div>

          <h1 className="font-[family-name:var(--font-bebas)] text-4xl uppercase tracking-wider text-white">
            BOMBEROS <span className="text-red-500">SAMPACHO</span>
          </h1>
          <p className="font-[family-name:var(--font-barlow-condensed)] text-xs font-semibold uppercase tracking-widest text-white/50">
            Sistema Operativo de Cuartel · Córdoba
          </p>
        </div>

        {/* Login form card */}
        <div className="rounded-3xl border border-white/10 bg-[#121316]/90 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 space-y-1">
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl uppercase tracking-wider text-white">
              Ingreso de Dotación
            </h2>
            <p className="text-xs text-white/50">
              Ingresá tu usuario y contraseña asignada por jefatura.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Username field */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-wider text-white/60"
              >
                Usuario
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  {...register("username")}
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="Tu nombre de usuario"
                  className={`w-full rounded-xl border bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-red-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-red-500/15 ${
                    errors.username
                      ? "border-red-500/50 bg-red-500/[0.04]"
                      : "border-white/[0.08]"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-400 font-medium">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="font-[family-name:var(--font-barlow-condensed)] text-xs font-bold uppercase tracking-wider text-white/60"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-white/[0.04] pl-10 pr-11 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-red-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-red-500/15 ${
                    errors.password
                      ? "border-red-500/50 bg-red-500/[0.04]"
                      : "border-white/[0.08]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 hover:text-white/80 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error alert */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{serverError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Verificando dotación..." : "Ingresar al Cuartel"}
              </Button>
            </div>
          </form>
        </div>

        {demoProfiles.length > 0 && (
          <section id="demo" aria-labelledby="demo-title" className="rounded-3xl border border-amber-500/30 bg-[#121316]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
            <div className="mb-4 flex items-start gap-3">
              <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
              <div className="space-y-1">
                <h2 id="demo-title" className="font-[family-name:var(--font-bebas)] text-2xl uppercase tracking-wider text-white">
                  Probar la demo
                </h2>
                <p className="text-xs text-white/50">
                  Entrá con un perfil ficticio y recorré todo el sistema. Lo que hagas se simula: no se guarda ningún cambio.
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {demoProfiles.map((profile) => (
                <button
                  key={profile.key}
                  type="button"
                  disabled={Boolean(demoBusy)}
                  onClick={() => void enterDemo(profile.key)}
                  className="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-left transition-colors hover:border-amber-500/40 hover:bg-amber-500/[0.06] disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-[family-name:var(--font-barlow-condensed)] text-sm font-bold tracking-wider text-white uppercase">
                      {demoBusy === profile.key ? "Ingresando..." : profile.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-white/45">{profile.description}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-amber-300" aria-hidden />
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/40">
              ¿Te pasaron un usuario de invitado para ver los perfiles de mando? Ingresalo arriba, con su contraseña.
            </p>
            {demoError && (
              <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                {demoError}
              </p>
            )}
          </section>
        )}

        {/* Footer info */}
        <div className="text-center font-[family-name:var(--font-barlow-condensed)] text-xs font-semibold tracking-widest text-white/30 uppercase lg:hidden">
          Asociación Bomberos Voluntarios Sampacho · Córdoba, Argentina
        </div>
        <Link href="/novedades" className="block text-center text-sm font-semibold text-white/70 underline underline-offset-4 hover:text-white">Novedades del cuartel para la comunidad</Link>
      </motion.div>
      </div>
    </div>
  );
}
