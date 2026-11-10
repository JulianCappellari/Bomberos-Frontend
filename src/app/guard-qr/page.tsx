"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field } from "@/components/operations/operations-ui";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import { isDutyManager } from "@/lib/permissions";
type Challenge = { id: string; qrToken: string; expiresAt: string };
export default function GuardQrPage() {
  const { user } = useAuth(); const [station, setStation] = useState(""), [active, setActive] = useState(false), [qr, setQr] = useState<Challenge | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const enabled = useRef(false);
  const lastId = useRef<string | null>(null);
  const renewal = useRef<Promise<void> | null>(null);
  const stations = useQuery({ queryKey: ["qr-stations", user?.id], queryFn: async () => (await api.get<Array<{ id: string; name: string }>>("/attendance/stations")).data, enabled: isDutyManager(user?.role) });
  useEffect(() => {
    if (!active || !station) return;
    let stopped = false;
    const timer = setInterval(() => {
      if (!enabled.current || renewal.current) return;
      renewal.current = api.post<Challenge>("/attendance/qr-challenges", { stationId: station }).then(({ data }) => {
        lastId.current = data.id;
        if (!stopped && enabled.current) { setQr(data); setError(""); }
      }).catch(() => {
        if (!stopped) { setQr(null); setError("No se pudo renovar el QR. Verifique la conexion."); }
      }).finally(() => { renewal.current = null; });
    }, 25000);
    return () => { stopped = true; clearInterval(timer); };
  }, [active, station]);
  useEffect(() => {
    if (!qr) return;
    const timer = setTimeout(() => setQr(null), Math.max(0, new Date(qr.expiresAt).getTime() - Date.now()));
    return () => clearTimeout(timer);
  }, [qr]);
  async function toggle() {
    setBusy(true); setError("");
    try {
      if (enabled.current) {
        enabled.current = false;
        await renewal.current;
        if (lastId.current) await api.post(`/attendance/qr-challenges/${lastId.current}/revoke`);
        lastId.current = null; setActive(false); setQr(null);
      } else {
        const { data } = await api.post<Challenge>("/attendance/qr-challenges", { stationId: station });
        lastId.current = data.id; enabled.current = true; setQr(data); setActive(true);
      }
    } catch {
      enabled.current = active;
      setError("No se pudo cambiar la habilitacion del QR. Vuelva a intentarlo.");
    } finally { setBusy(false); }
  }
  return <ProtectedLayout><section className="screen-body mx-auto max-w-xl"><h1 className="text-2xl font-bold">QR del cuartel</h1><p className="my-3 text-sm text-[var(--mut)]">El QR es único por base, vence a los 30 segundos y se renueva mientras esta pantalla está activa.</p>{error && <ErrorNotice>{error}</ErrorNotice>}{stations.isError && <ErrorNotice>No se pudieron cargar las bases.</ErrorNotice>}<Field label="Base"><select disabled={active || busy} required className="app-input" value={station} onChange={(e) => setStation(e.target.value)}><option value="">Seleccionar base</option>{stations.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><button className="app-button app-button-red my-4" disabled={!station || busy} onClick={toggle}>{busy ? "Procesando..." : active ? "Deshabilitar QR" : "Habilitar QR"}</button>{qr && <><div className="mx-auto flex max-w-sm justify-center rounded-lg bg-white p-5"><QRCode value={qr.qrToken} size={260} className="h-auto max-w-full" /></div><p className="mt-3 text-center text-xs text-[var(--mut)]">Vence {new Date(qr.expiresAt).toLocaleTimeString("es-AR")}. No comparta capturas del codigo.</p></>}</section></ProtectedLayout>;
}
