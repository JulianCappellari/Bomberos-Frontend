"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, MapPin } from "lucide-react";
import { OperationDialog } from "@/components/operations/work-ui";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { getCurrentPositionAsync } from "@/lib/geolocation";
import { getDeviceFingerprint } from "@/helper/getDeviceFingerprint";
import { toast } from "@/lib/toast";

type Preview = { open: false } | { open: true; station: string; requiresLocation: boolean; checkInAt: string; verifiedUntil: string; creditedUntil: string; graceMinutes: number; late?: boolean; lateHours?: number; now?: string; onMission: boolean };
// Hora; si no es de hoy, tambien el dia (una permanencia olvidada puede venir de otro dia).
const hour = (v: string) => {
  const zone = "America/Argentina/Buenos_Aires", d = new Date(v);
  const time = d.toLocaleTimeString("es-AR", { hourCycle: "h23", hour: "2-digit", minute: "2-digit", timeZone: zone });
  const day = (x: Date) => x.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: zone });
  return day(d) === day(new Date()) ? time : `${day(d)} ${time}`;
};
const toLocal = (v: Date) => new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

// Cerrar la permanencia sin QR. Nunca suma horas sin verificar: se acredita hasta la ultima presencia
// verificada (+ margen). Si el GPS confirma que seguis en el cuartel, se cierra en el momento.
export function RemoteCheckout({ onClosed }: { onClosed: () => void }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(""), [error, setError] = useState("");
  const [leftAt, setLeftAt] = useState(""), [reason, setReason] = useState("");
  const preview = useQuery({ queryKey: ["attendance", "remote-close"], queryFn: async () => (await api.get<Preview>("/attendance/me/close-remote")).data, enabled: open, refetchOnWindowFocus: false });
  const p = preview.data && preview.data.open ? preview.data : null;
  // Validacion local de la hora (iOS ignora min/max del selector): nunca futura ni antes del ingreso.
  const [timeError, setTimeError] = useState("");
  const leftDate = leftAt ? new Date(leftAt) : null;
  function pickTime(value: string) {
    setLeftAt(value);
    const d = value ? new Date(value) : null;
    setTimeError(!p || !d ? "" : Number.isNaN(+d) ? "Hora inválida."
      : +d > Date.now() + 60000 ? "No podés indicar una hora posterior a este momento."
      : +d < +new Date(p.checkInAt) ? `No puede ser anterior a tu ingreso (${hour(p.checkInAt)}).` : "");
  }
  const beyondCap = Boolean(p && leftDate && !timeError && +leftDate > +new Date(p.creditedUntil));

  async function close(withLocation: boolean) {
    setBusy(withLocation ? "gps" : "remote"); setError("");
    try {
      let point: GeolocationPosition | null = null;
      if (withLocation) { try { point = await getCurrentPositionAsync(); } catch { throw new Error("No se pudo obtener tu ubicación. Revisá el permiso de GPS o cerrá sin ubicación."); } }
      const { data } = await api.post<{ creditedUntil: string; capped: boolean; gpsInside: boolean; workedMinutes: number }>("/attendance/me/close-remote", {
        ...(leftAt ? { leftAt: new Date(leftAt).toISOString() } : {}), ...(reason.trim() ? { reason: reason.trim() } : {}), deviceFingerprint: getDeviceFingerprint(),
        ...(point ? { latitude: point.coords.latitude, longitude: point.coords.longitude, accuracy: point.coords.accuracy } : {}),
      });
      await client.invalidateQueries({ queryKey: ["attendance"] });
      setOpen(false); setLeftAt(""); setTimeError(""); setReason(""); onClosed();
      toast.success(data.gpsInside ? "Salida registrada en el cuartel" : "Permanencia cerrada", data.capped ? `Se acreditó hasta las ${hour(data.creditedUntil)}: la última presencia verificada.` : `Se acreditó hasta las ${hour(data.creditedUntil)}.`);
    } catch (err) { setError(err instanceof Error && !("response" in err) ? err.message : getErrorMessage(err, "No se pudo cerrar la permanencia.")); }
    finally { setBusy(""); }
  }

  return <>
    <button type="button" onClick={() => { setOpen(true); setError(""); }} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[var(--mut)] underline-offset-4 hover:text-[var(--txt)] hover:underline"><LogOut className="h-4 w-4" aria-hidden /> ¿Ya te fuiste? Cerrar sin QR</button>
    {open && <OperationDialog title="Cerrar permanencia sin QR" pending={Boolean(busy)} onClose={() => setOpen(false)}>
      <div className="space-y-3">
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {preview.isLoading && <p className="text-sm text-[var(--mut)]">Consultando tu permanencia…</p>}
        {preview.data && !preview.data.open && <p className="text-sm">No tenés una permanencia abierta.</p>}
        {p && p.onMission && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Estás integrando una salida: tu permanencia se retoma al volver al cuartel. Cerrala cuando regreses.</p>}
        {p && !p.onMission && <>
          <dl className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--bord)] p-3 text-sm">
            <dt className="text-[var(--mut)]">Ingresaste</dt><dd className="text-right font-semibold">{hour(p.checkInAt)} · {p.station}</dd>
            <dt className="text-[var(--mut)]">Última presencia verificada</dt><dd className="text-right font-semibold">{hour(p.verifiedUntil)}</dd>
            <dt className="text-[var(--mut)]">Se acredita hasta</dt><dd className="text-right font-bold text-[var(--ok-text)]">{hour(p.creditedUntil)}</dd>
          </dl>
          {p.late && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Pasaron más de {p.lateHours ?? 2} h desde tu última presencia verificada. El cierre queda marcado como tardío y se avisa a jefatura; las horas sin verificar no se suman.</p>}
          <p className="text-xs text-[var(--mut)]">Sin QR se acredita como máximo hasta tu última presencia verificada ({p.requiresLocation ? "QR, confirmación por GPS o vuelta de una salida" : "QR o confirmación tocando el aviso cada 30 minutos"}) más {p.graceMinutes} minutos.{p.requiresLocation ? " Si todavía estás en el cuartel, usá tu ubicación y se cierra ahora." : ""}</p>
          {p.requiresLocation && <button type="button" disabled={Boolean(busy)} onClick={() => void close(true)} className="app-button app-button-red w-full"><MapPin className="h-4 w-4" aria-hidden /> {busy === "gps" ? "Verificando ubicación…" : "Sigo en el cuartel: cerrar con mi ubicación"}</button>}
          <div className="space-y-2 rounded-xl border border-[var(--bord)] p-3">
            <p className="text-sm font-semibold">Ya me fui del cuartel</p>
            <Field label="¿A qué hora te fuiste? (opcional)"><input type="datetime-local" lang="es-AR" className="app-input" aria-invalid={Boolean(timeError)} min={toLocal(new Date(p.checkInAt))} max={toLocal(new Date())} value={leftAt} onChange={(e) => pickTime(e.target.value)} /></Field>
            {timeError && <p role="alert" className="text-sm font-semibold text-red-400">{timeError}</p>}
            {beyondCap && <p className="text-sm text-[var(--warn-text)]">Esa hora es posterior a lo verificado: se acreditará hasta las {hour(p.creditedUntil)}.</p>}
            {leftAt && <button type="button" className="text-xs font-semibold text-[var(--mut)] underline" onClick={() => pickTime("")}>Quitar la hora</button>}
            <Field label="Motivo (opcional)"><input className="app-input" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. me fui apurado y no escaneé" /></Field>
            <button type="button" disabled={Boolean(busy) || Boolean(timeError)} onClick={() => void close(false)} className="app-button w-full">{busy === "remote" ? "Cerrando…" : "Cerrar mi permanencia"}</button>
          </div>
          <p className="text-xs text-[var(--mut)]">Queda registrado como cierre sin QR. Si se repite seguido, jefatura recibe un aviso.</p>
        </>}
      </div>
    </OperationDialog>}
  </>;
}
