"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/features/auth/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  username: z.string().min(1, "Ingresá tu usuario"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");

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
      await login(values.username, values.password);
      router.push("/dashboard");
    } catch (error: any) {
      setServerError(
        error?.response?.data?.message || "No se pudo iniciar sesión",
      );
    }
  }

  return (
    <div className="login-root">
      <div className="bg-grid" />

      <div className="login-wrapper">
        <div className="login-badge">
          <div className="badge-line" />
          <span className="badge-text">Sistema Operativo · Acceso Seguro</span>
          <div className="badge-line right" />
        </div>

        <div className="login-logo">
          <div className="logo-icon-wrap">
            <div className="logo-emblem">🔥</div>

            <div>
              <div className="logo-title">
                BOMBEROS<span>APP</span>
              </div>
              <div className="logo-subtitle">
                Cuartel Sampacho · Voluntarios
              </div>
            </div>
          </div>
        </div>

        <div className="login-card-modern">
          <div className="mb-7">
            <div className="card-title-modern">Iniciar sesión</div>
            <div className="card-desc-modern">
              Ingresá tus credenciales para continuar
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-5">
              <label htmlFor="username" className="field-label-modern">
                Usuario
              </label>
              <input
                id="username"
                {...register("username")}
                className={`field-input-modern ${
                  errors.username ? "field-input-modern-error" : ""
                }`}
                placeholder="Tu nombre de usuario"
                autoComplete="username"
                autoCapitalize="none"
              />
              {errors.username && (
                <div className="mt-1.5 text-xs text-red-400">
                  {errors.username.message}
                </div>
              )}
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="field-label-modern">
                Contraseña
              </label>
              <input
                id="password"
                {...register("password")}
                type="password"
                className={`field-input-modern ${
                  errors.password ? "field-input-modern-error" : ""
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && (
                <div className="mt-1.5 text-xs text-red-400">
                  {errors.password.message}
                </div>
              )}
            </div>

            {serverError && (
              <div className="mb-5 rounded-[10px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              className="btn-submit-modern"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verificando..." : "Ingresar al sistema"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-[11px] text-white/20">
          Cuartel de Bomberos Voluntarios · Sampacho, Córdoba
        </div>
      </div>
    </div>
  );
}