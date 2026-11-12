"use client";
import { ListSkeleton } from "@/components/ui/list-skeleton";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, ShieldX, XCircle } from "lucide-react";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { ErrorNotice, Field, personName } from "@/components/operations/operations-ui";
import { useAuth } from "@/features/auth/auth-context";
import { isCommand } from "@/lib/permissions";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/get-error-message";
import { toast } from "@/lib/toast";
import { UserRosterItem } from "@/types/user";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
type Request = {
  assetId: string; userId: string; revision: number; status: Status; requestedAt: string; decidedAt: string | null; decisionNote: string | null; decidedBy: string | null;
  requiredClass: string; user: UserRosterItem; vehicle: { unitNumber: string; name: string; required: string[] }; covered: boolean; missing: string[];
  licenses: Array<{ id: string; number: string | null; classes: string[]; issuer: string | null; expiresOn: string | null; current: boolean }>;
};
type Options = { assets: Array<{ id: string; name: string }>; people: UserRosterItem[]; authorizations: Array<{ assetId: string; userId: string; revision: number }> };

const STATUS: Record<Status, { label: string; className: string; Icon: typeof Clock }> = {
  PENDING: { label: "Pendiente", className: "badge-yellow", Icon: Clock },
  APPROVED: { label: "Autorizado", className: "badge-green", Icon: CheckCircle2 },
  REJECTED: { label: "Rechazado", className: "badge-red", Icon: XCircle },
  REVOKED: { label: "Revocado", className: "badge-red", Icon: ShieldX },
};
const day = (v: string | null) => v ? new Date(v).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) : "—";

// Habilitacion de conductores: la licencia sola no alcanza. Al cargar una licencia que cubre un movil se genera el
// pedido; jefatura (oficial o administrador) autoriza o rechaza que esa persona maneje ese movil.
export default function DriverAuthorizationsPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const canEdit = isCommand(user?.role);
  const [busy, setBusy] = useState(""), [error, setError] = useState(""), [rejecting, setRejecting] = useState(""), [filter, setFilter] = useState<Status | "ALL">("PENDING");
  const requests = useQuery({ queryKey: ["driver-requests", user?.id], enabled: canEdit, queryFn: async () => (await api.get<Request[]>("/incidents/logistics/drivers")).data });
  const options = useQuery({ queryKey: ["mission-options", user?.id], enabled: canEdit, queryFn: async () => (await api.get<Options>("/incidents/logistics/options")).data });
  const counts = useMemo(() => (requests.data ?? []).reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {} as Record<string, number>), [requests.data]);
  const visible = (requests.data ?? []).filter((r) => filter === "ALL" || r.status === filter);
  // Agrupado por persona (en el orden institucional que ya trae el servidor).
  const byPerson = visible.reduce((acc, r) => { (acc.get(r.userId) ?? acc.set(r.userId, []).get(r.userId)!).push(r); return acc; }, new Map<string, Request[]>());

  async function send(key: string, path: string, data: unknown, ok: string, method: "post" | "put" = "post") {
    setBusy(key); setError("");
    try {
      await api.request({ url: `/incidents/logistics${path}`, method, data });
      await Promise.all([client.invalidateQueries({ queryKey: ["driver-requests"] }), client.invalidateQueries({ queryKey: ["mission-options"] })]);
      toast.success(ok); return true;
    } catch (err) { setError(getErrorMessage(err, "No se pudo guardar la decisión.")); return false; }
    finally { setBusy(""); }
  }
  const keyOf = (r: Request) => `${r.assetId}:${r.userId}`;
  const approve = (r: Request) => send(keyOf(r), "/authorizations/decide", { assetId: r.assetId, userId: r.userId, revision: r.revision, decision: "APPROVE" }, `Autorizado a manejar el móvil ${r.vehicle.unitNumber}`);
  async function approveAll(list: Request[]) { for (const r of list.filter((x) => x.status === "PENDING" && x.covered)) if (!await approve(r)) break; }
  async function reject(event: FormEvent<HTMLFormElement>, r: Request) {
    event.preventDefault();
    const note = String(new FormData(event.currentTarget).get("note") || "");
    if (await send(keyOf(r), "/authorizations/decide", { assetId: r.assetId, userId: r.userId, revision: r.revision, decision: "REJECT", note }, "Habilitación rechazada")) setRejecting("");
  }
  async function revoke(event: FormEvent<HTMLFormElement>, r: Request) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("reason") || "");
    if (await send(keyOf(r), "/authorizations/revoke", { assetId: r.assetId, userId: r.userId, revision: r.revision, reason }, "Habilitación revocada")) setRejecting("");
  }
  async function manual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, data = Object.fromEntries(new FormData(form));
    const existing = options.data?.authorizations.find((a) => a.assetId === data.assetId && a.userId === data.userId);
    if (await send("manual", "/authorizations", { ...data, revision: existing?.revision ?? 0 }, "Habilitación guardada", "put")) form.reset();
  }

  return (
    <ProtectedLayout>
      <main className="screen-body">
        <Link href="/incidents" className="text-sm underline">Volver a intervenciones</Link>
        <h1 className="my-3 text-2xl font-bold">Habilitaciones de conductores</h1>
        <p className="mb-4 text-sm text-[var(--mut)]">Para manejar un móvil hacen falta las licencias vigentes que exige y la autorización de jefatura para ese móvil. Cuando alguien carga una licencia que cubre un móvil, el pedido aparece acá.</p>
        {!canEdit ? <ErrorNotice>Las habilitaciones las decide jefatura (oficial o administrador).</ErrorNotice> : <>
          {(error || requests.isError) && <ErrorNotice>{error || "No se pudieron consultar los pedidos."}</ErrorNotice>}
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Estado">
            {(["PENDING", "APPROVED", "REJECTED", "REVOKED", "ALL"] as const).map((s) => <button key={s} type="button" role="tab" aria-selected={filter === s} onClick={() => setFilter(s)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${filter === s ? "border-red-500 bg-red-500/10" : "border-[var(--bord)]"}`}>
              {s === "ALL" ? "Todos" : STATUS[s].label}{s !== "ALL" && counts[s] ? ` (${counts[s]})` : ""}
            </button>)}
          </div>
          {requests.isLoading && <ListSkeleton label="Cargando pedidos" />}
          {requests.data && visible.length === 0 && <p className="py-4 text-sm text-[var(--mut)]">{filter === "PENDING" ? "No hay pedidos pendientes." : "Sin registros en este estado."}</p>}
          <div className="space-y-4">
            {[...byPerson.entries()].map(([userId, list]) => {
              const person = list[0]!.user, pendingOk = list.filter((r) => r.status === "PENDING" && r.covered);
              return <section key={userId} className="card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><h2 className="font-bold">{personName(person)}</h2><p className="text-sm text-[var(--mut)]">{person.profile?.rank}</p></div>
                  {pendingOk.length > 1 && <button type="button" className="app-button app-button-red w-auto" disabled={Boolean(busy)} onClick={() => void approveAll(list)}>Autorizar los {pendingOk.length} móviles</button>}
                </div>
                <details className="mt-2 text-sm"><summary className="cursor-pointer font-semibold text-[var(--mut)]">Licencias presentadas ({list[0]!.licenses.length})</summary>
                  <ul className="mt-2 space-y-1">{list[0]!.licenses.map((l) => <li key={l.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--bord)] pb-1"><span><strong>{l.classes.join(", ")}</strong> · N° {l.number || "—"}</span><span className={l.current ? "text-[var(--ok-text)]" : "text-red-400"}>{l.current ? `Vigente hasta ${day(l.expiresOn)}` : "No vigente"}</span></li>)}</ul>
                </details>
                <ul className="mt-3 space-y-2">
                  {list.map((r) => { const s = STATUS[r.status], k = keyOf(r); return <li key={k} className="rounded-xl border border-[var(--bord)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">Móvil {r.vehicle.unitNumber} <span className="font-normal text-[var(--mut)]">· {r.vehicle.name}</span></p>
                      <span className={`badge ${s.className} inline-flex items-center gap-1`}><s.Icon className="h-3.5 w-3.5" aria-hidden />{s.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--mut)]">Exige {r.vehicle.required.length ? r.vehicle.required.join(" + ") : r.requiredClass} · {r.covered ? <span className="text-[var(--ok-text)]">sus licencias lo cubren</span> : <span className="text-red-400">le falta {r.missing.join(" y ") || "la licencia"}</span>}</p>
                    {r.status !== "PENDING" && <p className="mt-1 text-xs text-[var(--mut)]">{s.label} {day(r.decidedAt)}{r.decidedBy ? ` por ${r.decidedBy}` : ""}{r.decisionNote ? ` · ${r.decisionNote}` : ""}</p>}
                    {r.status === "PENDING" && <p className="mt-1 text-xs text-[var(--mut)]">Pedido del {day(r.requestedAt)}</p>}
                    {r.userId !== user?.id && <div className="mt-2 flex flex-wrap gap-2">
                      {(r.status === "PENDING" || r.status === "REJECTED" || r.status === "REVOKED") && <button type="button" className="app-button app-button-green w-auto" disabled={Boolean(busy) || !r.covered} title={r.covered ? undefined : "Su licencia no cubre este móvil"} onClick={() => void approve(r)}>{busy === k ? "Guardando…" : "Autorizar"}</button>}
                      {r.status === "PENDING" && rejecting !== k && <button type="button" className="app-button app-button-outline w-auto" disabled={Boolean(busy)} onClick={() => setRejecting(k)}>Rechazar</button>}
                      {r.status === "APPROVED" && rejecting !== k && <button type="button" className="app-button app-button-outline w-auto" disabled={Boolean(busy)} onClick={() => setRejecting(k)}>Revocar</button>}
                    </div>}
                    {rejecting === k && <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => void (r.status === "APPROVED" ? revoke(e, r) : reject(e, r))}>
                      <input name={r.status === "APPROVED" ? "reason" : "note"} required minLength={r.status === "APPROVED" ? 10 : 5} maxLength={1000} autoFocus className="app-input min-w-0 flex-1" placeholder={r.status === "APPROVED" ? "Motivo de la revocación" : "Motivo del rechazo (ej. falta práctica de manejo)"} aria-label="Motivo" />
                      <button className="app-button w-auto" disabled={Boolean(busy)}>{r.status === "APPROVED" ? "Revocar" : "Rechazar"}</button>
                      <button type="button" className="app-button app-button-outline w-auto" onClick={() => setRejecting("")}>Cancelar</button>
                    </form>}
                  </li>; })}
                </ul>
              </section>;
            })}
          </div>
          {options.data && <details className="card mt-6">
            <summary className="cursor-pointer font-bold">Habilitación manual (móviles sin licencia configurada)</summary>
            <p className="my-2 text-sm text-[var(--mut)]">Para un móvil sin categoría de licencia, indicá la clase que exige. La persona debe tener esa licencia vigente.</p>
            <form onSubmit={manual}><fieldset disabled={Boolean(busy)} className="grid gap-3 sm:grid-cols-2">
              <Field label="Móvil"><select name="assetId" required className="app-input">{options.data.assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
              <Field label="Conductor"><select name="userId" required className="app-input">{options.data.people.filter((p) => p.id !== user?.id).map((p) => <option key={p.id} value={p.id}>{personName(p)}</option>)}</select></Field>
              <Field label="Clase de licencia exigida"><input name="requiredClass" required maxLength={12} className="app-input" placeholder="Ej. C.1" /></Field>
              <Field label="Motivo y verificación realizada"><textarea name="reason" minLength={10} maxLength={1000} required className="app-input" /></Field>
              <button className="app-button self-end">Guardar habilitación</button>
            </fieldset></form>
          </details>}
        </>}
      </main>
    </ProtectedLayout>
  );
}
