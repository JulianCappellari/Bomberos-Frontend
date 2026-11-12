"use client";
/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

// Constancia de intervencion para imprimir o guardar en PDF: planilla formal (A4) con el escudo del cuartel.
// Se arma solo para la impresion; en pantalla queda oculta.
type Named = { username: string; profile?: { fullName: string | null; rank?: string | null } | null } | null | undefined;
type Movement = { id: string; asset: { name: string; vehicle?: { unitNumber: string } | null }; driverUserId: string; leaderUserId: string; driver?: Named; leader?: Named; departedAt: string; arrivedAt: string | null; returnedAt: string | null; returnWithoutArrivalReason: string | null; crew: Array<{ userId: string; user: { username: string; profile?: { fullName: string | null; rank?: string | null } | null } }> };
export type PrintableIncident = {
  title: string; type: string; location: string; occurredAt: string; closedAt?: string | null; closingReport?: string | null; closedBy?: Named; status: string;
  requestNumber?: number | null; requestYear?: number | null; movements: Movement[];
  agencies?: Array<{ agencyType: string; name: string; unit: string; inCharge: string }>;
};
export type PrintableSheet = {
  revision: number; author: { username: string; profile?: { fullName: string | null } | null }; callerName: string; callerPhone: string; addressNumber?: string; receivedBy?: string;
  firefightersOnScene?: string; classifications?: string[]; classificationDetail?: string; notes: string; materials: Array<{ name: string; quantity: number; notes: string }>; finalizedAt: string | null;
} | null;

const zone = "America/Argentina/Buenos_Aires";
const time = (v?: string | null) => v ? new Date(v).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone }) : "—";
const date = (v?: string | null) => v ? new Date(v).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: zone }) : "—";
const name = (u: Named) => u ? u.profile?.fullName || u.username : "—";
const AGENCY: Record<string, string> = { FIRE_STATION: "Bomberos", POLICE: "Policía", MEDICAL: "Emergencias médicas", CIVIL_DEFENSE: "Defensa Civil", UTILITY: "Servicio público", MUNICIPAL: "Municipalidad", OTHER: "Otra institución" };

const cell = "border border-black px-2 py-1 align-top";
const label = `${cell} w-[34%] bg-neutral-100 font-semibold`;
function Row({ k, v }: { k: string; v: ReactNode }) { return <tr><th scope="row" className={`${label} text-left`}>{k}</th><td className={cell}>{v || "—"}</td></tr>; }
function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="mt-3 break-inside-avoid"><h2 className="border border-b-0 border-black bg-black px-2 py-0.5 text-[10pt] font-bold uppercase tracking-wide text-white">{title}</h2>{children}</section>; }

export function ConstanciaPrint({ incident, sheet, base, classifications, typeLabel }: { incident: PrintableIncident; sheet: PrintableSheet; base: string[]; classifications: Array<[string, string]>; typeLabel: string }) {
  const marked = new Set(sheet?.classifications ?? []);
  const request = incident.requestNumber ? `${incident.requestNumber}/${incident.requestYear}` : "S/N";
  const people = new Set(incident.movements.flatMap((m) => m.crew.map((c) => c.userId))).size;
  const agencies = incident.agencies ?? [];
  return <div id="constancia-print" aria-hidden className="hidden bg-white font-serif text-[10pt] leading-snug text-black">
    {/* Membrete */}
    <header className="flex items-center gap-4 border-b-2 border-black pb-2">
      <img src="/escudo-sampacho.png" alt="" className="h-[22mm] w-[22mm] object-contain" />
      <div className="flex-1 text-center">
        <p className="text-[13pt] font-bold uppercase">Sociedad de Bomberos Voluntarios de Sampacho</p>
        <p className="text-[9pt]">Cuartel Central · Sampacho, Provincia de Córdoba</p>
        <p className="mt-1 text-[15pt] font-black uppercase tracking-[0.12em]">Constancia de intervención</p>
      </div>
      <div className="min-w-[34mm] border-2 border-black p-1 text-center">
        <p className="text-[8pt] font-semibold uppercase">Pedido de auxilio N°</p>
        <p className="font-mono text-[16pt] font-black">{request}</p>
        <p className="text-[8pt]">{date(incident.occurredAt)}</p>
      </div>
    </header>

    <Section title="1. Datos del pedido">
      <table className="w-full border-collapse"><tbody>
        <Row k="Fecha y hora del aviso" v={`${date(incident.occurredAt)} · ${time(incident.occurredAt)} h`} />
        <Row k="Tipo de intervención" v={`${typeLabel}${incident.title ? ` — ${incident.title}` : ""}`} />
        <Row k="Solicitado por" v={`${sheet?.callerName || "—"}${sheet?.callerPhone ? ` · Tel. ${sheet.callerPhone}` : ""}`} />
        <Row k="Domicilio del siniestro" v={`${incident.location}${sheet?.addressNumber ? ` · N°/KM ${sheet.addressNumber}` : ""}`} />
        <Row k="Pedido recibido por" v={sheet?.receivedBy} />
        <Row k="Finalización" v={incident.closedAt ? `${date(incident.closedAt)} · ${time(incident.closedAt)} h${incident.closedBy ? ` · cerró ${name(incident.closedBy)}` : ""}` : "En curso"} />
      </tbody></table>
    </Section>

    <Section title="2. Clasificación">
      <div className="grid grid-cols-3 border border-black px-2 py-1">
        {classifications.map(([v, l]) => <span key={v} className="py-0.5"><span className="mr-1.5 inline-block h-[3.2mm] w-[3.2mm] border border-black text-center align-middle text-[8pt] leading-[3.2mm]">{marked.has(v) ? "X" : ""}</span>{l}</span>)}
      </div>
      {sheet?.classificationDetail && <p className="border border-t-0 border-black px-2 py-1"><span className="font-semibold">Detalle:</span> {sheet.classificationDetail}</p>}
    </Section>

    <Section title="3. Unidades y horarios (24 h)">
      <table className="w-full border-collapse text-center">
        <thead><tr className="bg-neutral-100">{["Unidad N°", "Salida", "Llegada al lugar", "Entrada al cuartel", "Chofer", "Encargado"].map((h) => <th key={h} className={`${cell} font-semibold`}>{h}</th>)}</tr></thead>
        <tbody>{incident.movements.length ? incident.movements.map((m) => <tr key={m.id}>
          <td className={`${cell} font-bold`}>{m.asset.vehicle?.unitNumber || m.asset.name}</td>
          <td className={`${cell} font-mono`}>{time(m.departedAt)}</td>
          <td className={`${cell} font-mono`}>{m.arrivedAt ? time(m.arrivedAt) : m.returnWithoutArrivalReason !== null && m.returnedAt ? "No llegó" : "—"}</td>
          <td className={`${cell} font-mono`}>{time(m.returnedAt)}</td>
          <td className={`${cell} text-left`}>{name(m.driver)}</td>
          <td className={`${cell} text-left`}>{name(m.leader)}</td>
        </tr>) : <tr><td colSpan={6} className={cell}>Sin salidas registradas.</td></tr>}</tbody>
      </table>
    </Section>

    <Section title={`4. Personal actuante (${people} ${people === 1 ? "persona" : "personas"})`}>
      <table className="w-full border-collapse"><tbody>
        {incident.movements.map((m) => <Row key={m.id} k={`Móvil ${m.asset.vehicle?.unitNumber || m.asset.name}`} v={m.crew.map((c) => `${c.user.profile?.fullName || c.user.username}${c.userId === m.driverUserId ? " (chofer)" : c.userId === m.leaderUserId ? " (a cargo)" : ""}`).join(" · ")} />)}
        <Row k="Personal en la base" v={base.join(" · ")} />
      </tbody></table>
    </Section>

    <Section title="5. Otras instituciones">
      <table className="w-full border-collapse"><tbody>
        {agencies.length ? agencies.map((a, i) => <Row key={i} k={AGENCY[a.agencyType] ?? "Institución"} v={[a.name, a.unit && `unidad ${a.unit}`, a.inCharge && `a cargo de ${a.inCharge}`].filter(Boolean).join(", ")} />) : <Row k="Participación" v={sheet?.firefightersOnScene || "No participaron otras instituciones"} />}
      </tbody></table>
    </Section>

    <Section title="6. Material empleado y observaciones">
      <table className="w-full border-collapse"><tbody>
        <Row k="Material empleado" v={(sheet?.materials ?? []).map((m) => `${m.name}${m.quantity > 1 ? ` ×${m.quantity}` : ""}${m.notes ? ` (${m.notes})` : ""}`).join(" · ")} />
        <Row k="Observaciones" v={sheet?.notes ? <span className="whitespace-pre-wrap">{sheet.notes}</span> : null} />
        <Row k="Informe de cierre" v={incident.closingReport ? <span className="whitespace-pre-wrap">{incident.closingReport}</span> : null} />
      </tbody></table>
    </Section>

    {/* Firmas */}
    <section className="mt-10 grid break-inside-avoid grid-cols-3 gap-6 text-center text-[9pt]">
      {[["Confeccionó", sheet ? sheet.author.profile?.fullName || sheet.author.username : ""], ["Jefe de dotación", ""], ["Jefe de Cuerpo", ""]].map(([role, who]) => <div key={role}><div className="h-12" /><div className="border-t border-black pt-1 font-semibold">{role}</div><div>{who || "Firma y aclaración"}</div></div>)}
    </section>

    <footer className="mt-6 flex justify-between border-t border-black pt-1 text-[7.5pt]">
      <span>Generado por el sistema del cuartel el {date(new Date().toISOString())} a las {time(new Date().toISOString())} h</span>
      <span>Planilla rev. {sheet?.revision ?? 0}{sheet?.finalizedAt ? " · finalizada" : " · sin finalizar"}</span>
    </footer>
  </div>;
}

/** Abre el dialogo de impresion con un nombre de archivo util ("Constancia 61-2026") para guardarlo como PDF. */
export function printConstancia(request: string) {
  const previous = document.title;
  document.title = `Constancia de intervencion ${request.replace("/", "-")}`;
  const restore = () => { document.title = previous; window.removeEventListener("afterprint", restore); };
  window.addEventListener("afterprint", restore);
  window.print();
}

/** Estilos de impresion: solo la planilla formal, en A4 y en blanco y negro. */
export const CONSTANCIA_PRINT_CSS = `@page{size:A4;margin:12mm 12mm 14mm}
@media print{html,body{background:#fff!important}body *{visibility:hidden!important}
#constancia-print,#constancia-print *{visibility:visible!important}
#constancia-print{display:block!important;position:absolute;top:0;left:0;width:100%;color:#000!important}
#constancia-print *{color:#000!important;border-color:#000!important}
#constancia-print h2{background:#000!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#constancia-print .bg-neutral-100{background:#eee!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
