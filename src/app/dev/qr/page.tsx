"use client";

import { useEffect } from "react";
import QRCode from "react-qr-code";
import { useCreateAttendanceQrChallenge } from "@/hooks/use-scan-attendance-qr";

const STATION_ID = "station_sampacho_dev";

export default function DevAttendanceQrPage() {
  const { mutate, data: qrData, error, isPending } =
    useCreateAttendanceQrChallenge();

  useEffect(() => {
    mutate(STATION_ID);
  }, [mutate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <h1 className="text-2xl font-black uppercase tracking-wider text-red-500">
          QR asistencia DEV
        </h1>

        <p className="mt-2 text-sm text-white/60">
          Genera un challenge real desde backend para probar entrada/salida.
        </p>

        <button
          type="button"
          onClick={() => mutate(STATION_ID)}
          disabled={isPending}
          className="mt-5 h-12 w-full rounded-2xl bg-red-500 font-black uppercase tracking-wide text-white disabled:opacity-70"
        >
          {isPending ? "Generando..." : "Regenerar QR"}
        </button>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            No se pudo generar el QR.
          </div>
        )}

        {qrData && (
          <>
            <div className="mt-6 flex justify-center rounded-2xl bg-white p-4">
              <QRCode value={qrData.qrToken} size={220} />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
              <div>
                <span className="text-white/40">Token:</span> {qrData.qrToken}
              </div>
              <div className="mt-1">
                <span className="text-white/40">Expira:</span>{" "}
                {new Date(qrData.expiresAt).toLocaleTimeString("es-AR")}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
