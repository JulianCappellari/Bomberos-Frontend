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
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    try {
      setServerError("");
      await login(values.username, values.password);
      router.push("/dashboard");
    } catch (error: any) {
      setServerError(error?.response?.data?.message || "No se pudo iniciar sesión");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

        .login-root {
          font-family: 'Barlow', sans-serif;
          min-height: 100vh;
          background-color: #0a0a0b;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Atmospheric background */
        .login-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 10% 90%, rgba(180, 20, 20, 0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 90% 10%, rgba(180, 20, 20, 0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Noise texture overlay */
        .login-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.5;
        }

        /* Grid lines */
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .login-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 400px;
        }

        /* TOP BADGE */
        .login-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
          animation: fadeSlideDown 0.5s ease both;
        }

        .badge-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(200, 30, 30, 0.5));
        }
        .badge-line.right {
          background: linear-gradient(90deg, rgba(200, 30, 30, 0.5), transparent);
        }

        .badge-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: rgba(200, 30, 30, 0.8);
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* LOGO */
        .login-logo {
          margin-bottom: 36px;
          animation: fadeSlideDown 0.5s 0.1s ease both;
        }

        .logo-icon-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 6px;
        }

        .logo-emblem {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #c81e1e, #7f1d1d);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          box-shadow: 0 0 0 1px rgba(200,30,30,0.4), 0 8px 32px rgba(200,30,30,0.3);
          position: relative;
          flex-shrink: 0;
        }

        .logo-emblem::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
        }

        .logo-text-wrap {
          display: flex;
          flex-direction: column;
        }

        .logo-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #f5f5f5;
          line-height: 1;
        }

        .logo-title span {
          color: #ef4444;
        }

        .logo-subtitle {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-top: 4px;
        }

        /* CARD */
        .login-card {
          background: rgba(15, 15, 18, 0.95);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 32px;
          box-shadow:
            0 0 0 1px rgba(200,30,30,0.06),
            0 32px 64px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideUp 0.5s 0.2s ease both;
          position: relative;
          overflow: hidden;
        }

        .login-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #ef4444, transparent);
          opacity: 0.6;
        }

        .card-header {
          margin-bottom: 28px;
        }

        .card-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #f0f0f0;
          margin-bottom: 4px;
        }

        .card-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          font-weight: 400;
        }

        /* FORM */
        .form-field {
          margin-bottom: 20px;
        }

        .field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin-bottom: 8px;
        }

        .field-label svg {
          opacity: 0.6;
        }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 13px 16px;
          font-family: 'Barlow', sans-serif;
          font-size: 15px;
          color: #f0f0f0;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .field-input::placeholder {
          color: rgba(255,255,255,0.18);
        }

        .field-input:focus {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
        }

        .field-input.error {
          border-color: rgba(239, 68, 68, 0.6);
        }

        .field-error {
          margin-top: 6px;
          font-size: 12px;
          color: #f87171;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* SERVER ERROR */
        .server-error {
          margin-bottom: 20px;
          border-radius: 10px;
          border: 1px solid rgba(239, 68, 68, 0.25);
          background: rgba(239, 68, 68, 0.07);
          padding: 12px 16px;
          font-size: 13px;
          color: #fca5a5;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* SUBMIT BUTTON */
        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(185, 28, 28, 0.4);
          margin-top: 8px;
        }

        .btn-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .btn-submit:hover:not(:disabled)::before {
          opacity: 1;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(185, 28, 28, 0.5);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* SPINNER */
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* FOOTER */
        .login-footer {
          margin-top: 24px;
          text-align: center;
          animation: fadeSlideUp 0.5s 0.35s ease both;
        }

        .footer-text {
          font-size: 11px;
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.05em;
        }

        /* SIDE DECORATIONS */
        .deco-line {
          position: fixed;
          bottom: 0;
          right: 48px;
          width: 1px;
          height: 40vh;
          background: linear-gradient(to bottom, transparent, rgba(200,30,30,0.2));
        }

        .deco-dot {
          position: fixed;
          bottom: 40vh;
          right: 47px;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(200,30,30,0.6);
          box-shadow: 0 0 8px rgba(200,30,30,0.6);
        }

        /* ANIMATIONS */
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="login-root">
        <div className="bg-grid" />
        <div className="deco-line" />
        <div className="deco-dot" />

        <div className="login-wrapper">
          {/* Top badge */}
          <div className="login-badge">
            <div className="badge-line" />
            <span className="badge-text">Sistema Operativo · Acceso Seguro</span>
            <div className="badge-line right" />
          </div>

          {/* Logo */}
          <div className="login-logo">
            <div className="logo-icon-wrap">
              <div className="logo-emblem">🔥</div>
              <div className="logo-text-wrap">
                <div className="logo-title">
                  BOMBEROS<span>APP</span>
                </div>
                <div className="logo-subtitle">Cuartel Sampacho · Voluntarios</div>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="login-card">
            <div className="card-header">
              <div className="card-title">Iniciar Sesión</div>
              <div className="card-desc">Ingresá tus credenciales para continuar</div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Username */}
              <div className="form-field">
                <label htmlFor="username" className="field-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Usuario
                </label>
                <input
                  id="username"
                  {...register("username")}
                  className={`field-input${errors.username ? " error" : ""}`}
                  placeholder="Tu nombre de usuario"
                  autoComplete="username"
                  autoCapitalize="none"
                />
                {errors.username && (
                  <div className="field-error">
                    <span>⚠</span> {errors.username.message}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="form-field">
                <label htmlFor="password" className="field-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Contraseña
                </label>
                <input
                  id="password"
                  {...register("password")}
                  type="password"
                  className={`field-input${errors.password ? " error" : ""}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <div className="field-error">
                    <span>⚠</span> {errors.password.message}
                  </div>
                )}
              </div>

              {serverError && (
                <div className="server-error">
                  <span>⚠️</span>
                  <span>{serverError}</span>
                </div>
              )}

              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                <div className="btn-inner">
                  {isSubmitting ? (
                    <>
                      <div className="spinner" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Ingresar al sistema
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p className="footer-text">
              Cuartel de Bomberos Voluntarios · Sampacho, Córdoba
            </p>
          </div>
        </div>
      </div>
    </>
  );
}