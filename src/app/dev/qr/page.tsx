"use client";

import { useCreateAttendanceQrChallenge } from "@/hooks/use-scan-attendance-qr";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";


const STATION_ID = "station_sampacho_dev";

export default function DevAttendanceQrPage() {
  const [qrData, setQrData] = useState<{
    qrToken: string;
    expiresAt: string;
  } | null>(null);

  const mutation = useCreateAttendanceQrChallenge();

  async function generateQr() {
    try {
      const data = await mutation.mutateAsync(STATION_ID);
      setQrData({
        qrToken: data.qrToken,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      console.error(error);
      alert("No se pudo generar el QR");
    }
  }

  useEffect(() => {
    generateQr();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <h1 className="text-2xl font-black uppercase tracking-wider text-red-500">
          QR asistencia DEV
        </h1>

        <p className="mt-2 text-sm text-white/60">
          Genera un challenge real desde backend para probar entrada/salida.
        </p>

        <button
          onClick={generateQr}
          disabled={mutation.isPending}
          className="mt-5 h-12 w-full rounded-2xl bg-red-500 font-black uppercase tracking-wide text-white"
        >
          {mutation.isPending ? "Generando..." : "Regenerar QR"}
        </button>

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