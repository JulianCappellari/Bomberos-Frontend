"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isIOS } from "@/lib/qr-camera";
import { Download, Smartphone } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { useAppLifecycle } from "@/components/operations/app-lifecycle";
import { useAuth } from "@/features/auth/auth-context";
const changes = [
  ["Actas de salida", "Horas por participante, historial y anulacion con motivo. No se interrumpe el fichaje del cuartel y el total acreditado no duplica intervalos."],
  ["Bauleras y herramientas", "Orden, renombrado, etiquetas unicas, vencimientos y plantillas iniciales pendientes de revision fisica."],
  ["Control de moviles", "Novedades por ubicacion incorrecta, aviso de faltantes del ultimo control y acceso para revisar y reponer tras una salida."],
  ["Mis tareas", "La hice, Se la paso y No puedo desde el inicio, equipo visible y mensajes del verificador en las notificaciones."],
  ["Evidencia fotografica", "Hasta tres fotos por envio, validadas y recodificadas por el servidor sin metadatos originales. Acceso restringido a quienes pueden consultar la tarea."],
  ["Pendientes sin conexion", "Las acciones rapidas de tareas se guardan localmente y se reintentan al reconectar. Los conflictos requieren revision; no se sobrescriben versiones nuevas."],
  ["Proximo control", "Grupo y semana personal visibles en el inicio y en Mi perfil. Solo se puede registrar un control durante la semana vigente del propio grupo."],
  ["Permisos del cuartel", "Navegacion contextual por cargo, perfil Guardia con funciones operativas acotadas y administracion organizada por areas."],
  ["Materiales peligrosos", "Indice auxiliar GRE 2024 por nombre y ONU/NA con enlace a la pagina original. No sustituye la guia ni conserva sus resaltados verdes."],
  ["Aplicacion instalable", "Instalacion desde navegadores compatibles y deteccion de actualizaciones. No se recarga automaticamente un formulario abierto."],
  ["Funciones existentes", "Combustible con decimales, viajes de agua y calculo de horas de compresor siguen disponibles. La presencia conserva la regla del cuartel: confirmar cada 30 minutos."],
];
export default function AppPage() {
  const { user } = useAuth(), lifecycle = useAppLifecycle(); const [seen, setSeen] = useState(false);
  const key = `app-news:20261105:${user?.id || ""}`;
  useEffect(() => { const id = requestAnimationFrame(() => setSeen(localStorage.getItem(key) === "seen")); return () => cancelAnimationFrame(id); }, [key]);
  return <ProtectedLayout><section className="screen-body"><h1 className="flex items-center gap-2 text-2xl font-bold"><Smartphone /> Aplicacion y novedades</h1><p className="my-3 text-xs text-[var(--mut)]">Version de compilacion: {lifecycle.version || "Desarrollo / no disponible"}</p><section className="my-5 border-y border-[var(--bord)] py-4"><h2 className="font-bold">Instalar en el dispositivo</h2>{lifecycle.canInstall ? <button className="app-button mt-3 w-auto" onClick={() => lifecycle.install()}><Download size={16} /> Instalar aplicacion</button> : <InstallHelp />}<p className="mt-3 text-xs text-[var(--mut)]">Esta es una instalacion web. No se publico en Play Store ni se solicita una cuenta Gmail.</p>{lifecycle.waiting && <button className="app-button mt-3 w-auto" onClick={lifecycle.update}>Aplicar actualizacion</button>}{lifecycle.error && <p role="status" className="mt-3 text-sm text-amber-200">{lifecycle.error}</p>}</section><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Novedades de esta revision</h2><button className="app-button w-auto" disabled={seen} onClick={() => { localStorage.setItem(key, "seen"); setSeen(true); }}>{seen ? "Novedades vistas" : "Marcar como vistas"}</button></div><ul className="divide-y divide-[var(--bord)]">{changes.map(([title, text]) => <li className="py-4" key={title}><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-[var(--mut)]">{text}</p></li>)}</ul><aside className="mt-5 rounded-lg border border-amber-500/40 p-3 text-sm">Los pendientes locales no son registros confirmados. Se eliminan al cerrar sesion en este dispositivo; sincronice antes. No hay acceso offline completo. Los avisos externos se activan desde la campanita cuando el servidor esta configurado; requieren permisos y no garantizan entrega ni sonido en modo silencio.</aside></section></ProtectedLayout>;
}

// Instrucciones segun el celular: iPhone no ofrece boton de instalacion automatico.
const noop = () => () => {};
function InstallHelp() {
  const platform = useSyncExternalStore(noop, () => (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone) ? "installed" : isIOS() ? "ios" : /Android/i.test(navigator.userAgent) ? "android" : "other", () => "other");
  const text = platform === "installed" ? "La aplicación ya está instalada en este dispositivo."
    : platform === "ios" ? "En el iPhone abrila con Safari, tocá Compartir (el cuadrado con la flecha hacia arriba) y elegí «Agregar a inicio». Abrila siempre desde ese ícono: así funcionan los avisos y la cámara."
    : platform === "android" ? "En Chrome tocá el menú ⋮ y elegí «Instalar aplicación» o «Agregar a la pantalla principal»."
    : "Usá la opción Instalar o Agregar a inicio del navegador. Requiere conexión segura (https).";
  return <p className="mt-2 text-sm text-[var(--mut)]">{text}</p>;
}
