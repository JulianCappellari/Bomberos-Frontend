"use client";
import Link from "next/link";
import {useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {useAuth} from "@/features/auth/auth-context";
import {api} from "@/lib/api-client";
import {UserRosterItem} from "@/types/user";
import {getErrorMessage} from "@/lib/get-error-message";
export const availabilityLabels={PRESENT:"En el cuartel",AVAILABLE:"Disponible fuera de base",UNAVAILABLE:"No disponible",DEPLOYED:"En intervención",UNKNOWN:"Sin confirmar"};
const labels=availabilityLabels;
type Status=keyof typeof labels;
export function QuickAvailability(){
 const {user}=useAuth(),client=useQueryClient(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const enabled=Boolean(user&&!user.mustChangePassword&&user.profile?.rank?.toLowerCase()!=="administrador");
 const query=useQuery({queryKey:["emergency-availability",user?.id],enabled,queryFn:async()=>(await api.get<{status:Status;presentByQr:boolean;deployed:boolean}>("/members/availability")).data,refetchInterval:15000});
 async function change(available:boolean){setBusy(true);setError("");try{await api.post("/members/availability"+(available?"/available-now":""),available?{}:{startsAt:new Date().toISOString(),endsAt:null});await client.invalidateQueries({queryKey:["emergency-availability"]});await client.invalidateQueries({queryKey:["operational-availability"]});}catch(err){setError(getErrorMessage(err,"No se pudo cambiar la disponibilidad"));}finally{setBusy(false);}}
 if(!enabled)return null;
 const automatic=query.data?.presentByQr||query.data?.deployed;
 const status=query.data?.status;
 const hint=query.data?.deployed?"Estás en una intervención: la disponibilidad se toma automáticamente.":query.data?.presentByQr?"Estás en el cuartel: figurás disponible mientras dure tu permanencia.":status==="AVAILABLE"?"Recibís las convocatorias de emergencia.":status==="UNAVAILABLE"?"No recibís convocatorias de emergencia.":"Todavía no lo indicaste: no recibís convocatorias.";
 const option=(available:boolean)=>`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${(available?status==="AVAILABLE":status==="UNAVAILABLE")?(available?"bg-emerald-700 text-white":"bg-white/15 text-white"):"text-white/70 hover:bg-white/[0.06]"}`;
 return <section aria-label="Mi disponibilidad" className="rounded-2xl border border-white/[0.08] bg-[var(--card)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-white/55">Disponibilidad para emergencias</p><p role="status" className="mt-1 font-bold text-white">{query.data?labels[query.data.status]:query.isError?"Sin información actualizada":"Consultando…"}</p></div><Link className="shrink-0 text-xs text-red-300 underline-offset-4 hover:underline" href="/me?tab=availability">Programar ausencia</Link></div><p className="mt-1 text-xs text-white/60">{query.data?hint:""}</p><div role="group" aria-label="Cambiar disponibilidad" className="mt-3 flex gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1"><button type="button" className={option(true)} aria-pressed={status==="AVAILABLE"} disabled={busy||!query.data||Boolean(automatic)} onClick={()=>change(true)}>Disponible</button><button type="button" className={option(false)} aria-pressed={status==="UNAVAILABLE"} disabled={busy||!query.data||Boolean(automatic)} onClick={()=>change(false)}>No disponible</button></div>{error&&<p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}</section>;
}
export function OperationalAvailability(){
 const {user}=useAuth();
 const [selected,setSelected]=useState<Status>("AVAILABLE");
 const query=useQuery({queryKey:["operational-availability",user?.id],enabled:Boolean(user&&!user.mustChangePassword),queryFn:async()=>(await api.get<{generatedAt:string;people:Array<UserRosterItem&{status:Status}>}>("/members/operational-availability")).data,refetchInterval:10000});
 return <section className="my-5 border-t border-[var(--bord)] pt-4"><h2 className="text-lg font-bold">Disponibilidad de la dotación</h2>{query.isError&&<p role="alert">No se pudo actualizar la dotación. <button className="underline" onClick={()=>query.refetch()}>Reintentar</button></p>}{query.isLoading&&<p>Cargando dotación...</p>}
 {query.data&&<><div className="my-3 flex flex-wrap gap-2" role="group" aria-label="Estado operativo del personal">{(Object.keys(labels) as Status[]).map(status=><button key={status} aria-pressed={status===selected} className={"app-button w-auto "+(status===selected?"app-button-red":"app-button-outline")} onClick={()=>setSelected(status)}>{labels[status]} · {query.data.people.filter(p=>p.status===status).length}</button>)}</div><ul className="grid gap-2 sm:grid-cols-2">{query.data.people.filter(p=>p.status===selected).map(p=><li key={p.id} className="border-b border-[var(--bord)] py-2"><span className="font-semibold">{p.profile?.fullName||p.username}</span><span className="ml-2 text-sm text-[var(--mut)]">{p.profile?.rank}</span></li>)}</ul>{!query.data.people.some(p=>p.status===selected)&&<p className="text-sm text-[var(--mut)]">No hay integrantes en este estado.</p>}<p className="mt-3 text-xs text-[var(--mut)]">La disponibilidad fuera de base requiere una confirmación del integrante. No equivale a presencia física ni a tiempo de llegada.</p></>}
 </section>;
}
