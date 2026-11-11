"use client";
import Link from "next/link";
import {useParams} from "next/navigation";
import {FormEvent,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {ProtectedLayout} from "@/components/layout/protected-layout";
import {ErrorNotice,Field} from "@/components/operations/operations-ui";
import {useAuth} from "@/features/auth/auth-context";
import {api} from "@/lib/api-client";
import {getErrorMessage} from "@/lib/get-error-message";
import {SheetAmendments,SheetAmendment} from "@/components/operations/sheet-amendments";
import {ReinforcementRequest} from "@/components/operations/reinforcement-request";
import {IncidentAgencies} from "@/components/operations/incident-agencies";
import {IncidentMovements} from "@/components/operations/incident-movements";
import {IncidentNotebook} from "@/components/operations/incident-notebook";
import {IncidentRedo} from "@/components/operations/incident-redo";
import {NotebookEntry} from "@/types/work";
import {UserRosterItem} from "@/types/user";

type Material={name:string;quantity:number;notes:string};
type Person={userId:string;user:UserRosterItem};
type Movement={id:string;returnWithoutArrivalReason:string|null;dispatchExceptionReason:string|null;asset:{name:string;status:string};driverUserId:string;leaderUserId:string;departedAt:string;arrivedAt:string|null;returnedAt:string|null;crew:Person[]};
type Response={amendments?:SheetAmendment[];notebookEntries:NotebookEntry[];canAddAnnex:boolean;canWrite:boolean;sheet:null|{revision:number;author:{username:string};callerName:string;callerPhone:string;notes:string;materials:Material[];baseUserIds:string[];evidenceUrls:string[];finalizedAt:string|null};context:{incident:{id:string;title:string;voidedAt?:string|null;replacesIncidentId?:string|null;description:string;type:string;location:string;occurredAt:string;status:string;alert:null|{createdBy:{username:string;profile:{fullName:string|null}|null};contactPhone:string|null;originNotice:null|{source:string;phone:string|null}};movements:Movement[]};baseCandidates:Array<{id:string;name:string}>;notCredited?:string[]}};
const types:Record<string,string>={FIRE:"Incendio",RESCUE:"Rescate",ACCIDENT:"Accidente",CHEMICAL:"Riesgo químico",MEDICAL:"Emergencia médica",FLOOD:"Inundación",OTHER:"Otro"};
const time=(date:string|null)=>date?new Date(date).toLocaleString("es-AR",{timeZone:"America/Argentina/Buenos_Aires"}):"Pendiente";
// Paso numerado de la planilla: ordena el flujo de carga de arriba hacia abajo.
function Step({n,title,children,hint}:{n:number;title:string;hint?:string;children:React.ReactNode}){return <section className="mt-6 rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4"><h3 className="flex items-center gap-2 text-base font-bold text-white"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs">{n}</span>{title}</h3>{hint&&<p className="mt-1 text-sm text-[var(--mut)]">{hint}</p>}<div className="mt-3">{children}</div></section>;}
function Sheet({id,data,saved}:{id:string;data:Response;saved:()=>Promise<unknown>}){
 const {user}=useAuth();
 const {sheet,context:{incident,baseCandidates}}=data;
 const [materials,setMaterials]=useState<Material[]>(sheet?.materials||[]),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [closing,setClosing]=useState(false),[closeError,setCloseError]=useState(""),[closingReport,setClosingReport]=useState("");
 const command=["ADMIN","OPERATOR","GUARD"].includes(user?.role||"");
 const away=incident.movements.filter(m=>!m.returnedAt).length,returned=incident.movements.length-away;
 const callerName=sheet?(sheet.callerName||"Sin registrar"):(incident.alert?.originNotice?.source||"Sin registrar");
 const callerPhone=sheet?(sheet.callerPhone||"Sin registrar"):(incident.alert?.originNotice?.phone||incident.alert?.contactPhone||"Sin registrar");
 const incidentOpen=incident.status==="OPEN"&&!sheet?.finalizedAt;
 const locked=!data.canWrite||!incidentOpen;
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError("");
 try{await api.put(`/incidents/${id}/sheet`,{revision:sheet?.revision||0,callerName:form.get("callerName"),callerPhone:form.get("callerPhone"),notes:form.get("notes"),materials,baseUserIds:form.getAll("base"),evidenceUrls:String(form.get("urls")||"").split("\n").map(s=>s.trim()).filter(Boolean)});await saved();}catch(err){setError(getErrorMessage(err,"No se pudo guardar la planilla"));}finally{setBusy(false);}}
 async function close(e:FormEvent<HTMLFormElement>){e.preventDefault();if(closingReport.trim().length<10)return;setClosing(true);setCloseError("");try{await api.patch(`/incidents/${id}/close`,{closingReport:closingReport.trim()});await saved();}catch(err){setCloseError(getErrorMessage(err,"No se pudo cerrar la intervención. Verifique que todos los móviles hayan regresado."));}finally{setClosing(false);}}
 const finalized=Boolean(sheet?.finalizedAt)||incident.status==="CLOSED";
 return <>
 <header className="mt-4"><div className="flex flex-wrap items-center gap-2"><span className={`badge ${finalized?"badge-green":"badge-red"}`}>{finalized?"Cerrada":"En curso"}</span><span className="badge badge-gray">{types[incident.type]||incident.type}</span></div>
 <h1 className="mt-2 text-2xl font-bold text-white">{incident.title}</h1>
 <p className="mt-1 text-sm text-[var(--mut)]">{incident.location} · Inicio {time(incident.occurredAt)}</p><div className="mt-3 flex flex-wrap gap-2"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(incident.location)}`} target="_blank" rel="noopener noreferrer" className="app-button app-button-outline w-auto">Ver en mapa</a><Link href={`/notebook?incident=${id}`} className="app-button app-button-outline w-auto">Libreta del siniestro</Link>{callerPhone!=="Sin registrar"&&<a href={`tel:${callerPhone.replace(/[^\d+]/g,"")}`} className="app-button app-button-outline w-auto">Llamar a quien avisó</a>}{incidentOpen&&<ReinforcementRequest incidentId={id}/>}</div></header>
 <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
  {[["Móviles fuera",away,away>0],["Móviles retornados",returned,false],["Personal en base",sheet?.baseUserIds.length??0,false],["Planilla",sheet?`Guardada (rev. ${sheet.revision})`:"Sin guardar",!sheet&&!finalized]].map(([label,value,warn])=><div key={String(label)} className={`rounded-xl border p-3 ${warn?"border-amber-500/40 bg-amber-500/10":"border-[var(--bord)] bg-[var(--card)]"}`}><dt className="text-xs text-[var(--mut)]">{label}</dt><dd className="mt-1 font-bold text-white">{value}</dd></div>)}
 </dl>
 <p className="mt-3 text-sm text-[var(--mut)]">Despachó la alerta: <span className="text-white">{incident.alert?.createdBy.profile?.fullName||incident.alert?.createdBy.username||"Sin alerta"}</span> · Llamó: <span className="text-white">{callerName}</span> · Tel.: <span className="text-white">{callerPhone}</span>{sheet&&<> · Completó: <span className="text-white">{sheet.author.username}</span></>}</p>
 {incidentOpen&&!data.canWrite&&<div role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"><p className="min-w-0 flex-1 text-sm text-amber-100">Podés consultar esta planilla. Para editarla necesitás presencia activa por QR en el cuartel. Administrador y oficial están exceptuados.</p><Link href="/attendance" className="app-button w-auto">Registrar ingreso</Link></div>}
 {incident.replacesIncidentId&&<p className="mt-4 rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-sm">Esta intervención rehace una anulada. Cargá las salidas con sus horarios reales y completá la planilla.</p>}
 <IncidentRedo incidentId={id} closed={finalized} voided={Boolean(incident.voidedAt)}/>

 <Step n={1} title="Salidas de móviles" hint="Registrá cada móvil al salir, al llegar y al regresar. La intervención no se cierra mientras haya móviles fuera.">
  <IncidentMovements historical={Boolean(incident.replacesIncidentId)} incidentId={id} incidentOpen={incidentOpen} canWrite={data.canWrite} movements={incident.movements} saved={saved}/>
 </Step>

 <form onSubmit={submit}><fieldset disabled={locked||busy}>
 <Step n={2} title="Llamada y personal en el cuartel">
  <div className="grid gap-3 sm:grid-cols-2"><Field label="Quién llamó al cuartel"><input className="app-input" name="callerName" maxLength={120} defaultValue={sheet?sheet.callerName:incident.alert?.originNotice?.source||""}/></Field><Field label="Teléfono de quien llamó"><input className="app-input" type="tel" name="callerPhone" maxLength={40} defaultValue={sheet?sheet.callerPhone:incident.alert?.originNotice?.phone||incident.alert?.contactPhone||""}/></Field></div>
  <fieldset className="mt-3"><legend className="text-sm font-semibold text-white">Personal que colaboró desde el cuartel</legend><p className="mb-2 text-xs text-[var(--mut)]">Aparecen quienes tuvieron presencia QR durante la emergencia o respondieron “Voy”.</p>{baseCandidates.length===0&&<p className="text-sm text-[var(--mut)]">Nadie cumple esas condiciones todavía.</p>}<div className="grid gap-1 sm:grid-cols-2">{baseCandidates.map(p=><label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--bord)] px-3 text-sm" key={p.id}><input name="base" value={p.id} type="checkbox" className="h-4 w-4" defaultChecked={sheet?.baseUserIds.includes(p.id)}/> {p.name}</label>)}</div></fieldset>
 </Step>
 <Step n={3} title="Actuación, materiales y evidencia">
  <Field label="Actuación y novedades"><textarea required name="notes" minLength={10} maxLength={4000} className="app-input min-h-28" defaultValue={sheet?.notes||""} placeholder="Qué se encontró, qué se hizo y cómo quedó el lugar"/></Field>
  <h4 className="mt-4 text-sm font-semibold text-white">Materiales utilizados</h4>
  {materials.length===0&&<p className="mt-1 text-sm text-[var(--mut)]">Sin materiales cargados.</p>}
  {materials.map((m,i)=><div key={i} className="mt-2 grid gap-2 rounded-lg border border-[var(--bord)] p-3 sm:grid-cols-[1fr_120px_1fr_auto]"><Field label="Material"><input className="app-input" required minLength={2} maxLength={140} value={m.name} onChange={e=>setMaterials(materials.map((v,j)=>i===j?{...v,name:e.target.value}:v))}/></Field><Field label="Cantidad"><input className="app-input" type="number" required min={1} max={100000} value={m.quantity} onChange={e=>setMaterials(materials.map((v,j)=>i===j?{...v,quantity:Number(e.target.value)}:v))}/></Field><Field label="Estado o novedad"><input className="app-input" maxLength={500} value={m.notes} onChange={e=>setMaterials(materials.map((v,j)=>i===j?{...v,notes:e.target.value}:v))}/></Field>{!locked&&<button type="button" className="app-button app-button-outline w-auto self-end" onClick={()=>setMaterials(materials.filter((_,j)=>j!==i))}>Quitar</button>}</div>)}
  {!locked&&<button type="button" className="app-button mt-2 w-auto" disabled={materials.length>=100} onClick={()=>setMaterials([...materials,{name:"",quantity:1,notes:""}])}>Agregar material</button>}
  <div className="mt-4"><Field label="Enlaces de evidencia (HTTPS, uno por línea, hasta cinco)"><textarea className="app-input" name="urls" defaultValue={sheet?.evidenceUrls.join("\n")||""}/></Field></div>
  {error&&<ErrorNotice>{error}</ErrorNotice>}
  {!locked&&<button className="app-button app-button-red mt-4 w-auto">{busy?"Guardando…":"Guardar planilla"}</button>}
 </Step>
 </fieldset></form>

 <Step n={4} title="Bitácora de la emergencia" hint="Novedades con hora real. Después del cierre se agregan como anexos.">
  <IncidentNotebook incidentId={id} entries={data.notebookEntries} incidentOpen={incidentOpen} canWrite={data.canWrite} canAddAnnex={data.canAddAnnex} saved={saved}/>
 </Step>

 {incidentOpen&&(data.canWrite||command)&&<Step n={5} title="Cerrar la intervención">
  <ul className="space-y-1 text-sm"><li className={away?"text-amber-200":"text-emerald-300"}>{away?`Falta registrar el retorno de ${away} ${away===1?"móvil":"móviles"}.`:"Todos los móviles regresaron."}</li><li className={sheet?"text-emerald-300":"text-amber-200"}>{sheet?"Planilla guardada.":"La planilla no está guardada: se cerrará con datos pendientes, que se completan después con anexos."}</li></ul>
  <form onSubmit={close} className="mt-3 space-y-3"><Field label="Informe de cierre"><textarea className="app-input min-h-24" required minLength={10} maxLength={4000} value={closingReport} onChange={e=>setClosingReport(e.target.value)} placeholder="Resumen final de la emergencia"/></Field>
  <button className="app-button app-button-red w-auto" disabled={closing||busy||away>0||closingReport.trim().length<10}>{closing?"Cerrando…":"Cerrar intervención"}</button>{closeError&&<p role="alert" className="text-sm text-red-300">{closeError}</p>}</form>
 </Step>}
 <IncidentAgencies incidentId={id}/>
 {sheet?.finalizedAt&&<SheetAmendments id={id} revision={sheet.revision} allowed={user?.role==="ADMIN"||user?.role==="OPERATOR"} items={data.amendments||[]} saved={saved}/>}</>;
}
export default function IncidentSheetPage(){
 const {id}=useParams<{id:string}>(),{user}=useAuth();
 const query=useQuery({queryKey:["incident-sheet",id,user?.id],enabled:Boolean(user),queryFn:async()=>(await api.get<Response>(`/incidents/${id}/sheet`)).data});
 return <ProtectedLayout><main className="screen-body"><Link href="/incidents" className="text-sm text-red-300 underline-offset-4 hover:underline">← Intervenciones</Link>{query.isLoading&&<p role="status" className="mt-4">Cargando planilla…</p>}{query.isError&&<ErrorNotice>{getErrorMessage(query.error,"No se pudo consultar la planilla")}</ErrorNotice>}{query.data&&<Sheet key={query.data.sheet?.revision||0} id={id} data={query.data} saved={query.refetch}/>}</main></ProtectedLayout>;
}
