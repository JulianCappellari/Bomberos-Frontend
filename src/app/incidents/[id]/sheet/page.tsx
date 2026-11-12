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
import {toast} from "@/lib/toast";

type Material={name:string;quantity:number;notes:string};
type Person={userId:string;user:UserRosterItem};
type Named={username:string;profile:{fullName:string|null}|null}|null|undefined;
type Movement={id:string;assetId:string;returnWithoutArrivalReason:string|null;dispatchExceptionReason:string|null;asset:{name:string;status:string;vehicle?:{unitNumber:string}|null};driverUserId:string;leaderUserId:string;driver?:Named;leader?:Named;departedAt:string;arrivedAt:string|null;returnedAt:string|null;crew:Person[]};
type Response={amendments?:SheetAmendment[];notebookEntries:NotebookEntry[];canAddAnnex:boolean;canWrite:boolean;sheet:null|{revision:number;author:{username:string;profile?:{fullName:string|null}|null};callerName:string;callerPhone:string;addressNumber?:string;receivedBy?:string;firefightersOnScene?:string;classifications?:string[];classificationDetail?:string;notes:string;materials:Material[];baseUserIds:string[];evidenceUrls:string[];finalizedAt:string|null};context:{incident:{id:string;agencies?:Array<{agencyType:string;name:string;unit:string;inCharge:string}>;requestNumber?:number|null;requestYear?:number|null;title:string;voidedAt?:string|null;replacesIncidentId?:string|null;description:string;type:string;location:string;occurredAt:string;status:string;alert:null|{createdBy:{username:string;profile:{fullName:string|null}|null};contactPhone:string|null;originNotice:null|{source:string;phone:string|null}};movements:Movement[]};baseCandidates:Array<{id:string;name:string;segments?:Array<{from:string;to:string}>;respondedOnly?:boolean;departures?:Array<{unit:string;departedAt:string;returnedAt:string|null}>}>;notCredited?:string[]}};
const types:Record<string,string>={FIRE:"Incendio",RESCUE:"Rescate",ACCIDENT:"Accidente",CHEMICAL:"Riesgo químico",MEDICAL:"Emergencia médica",FLOOD:"Inundación",OTHER:"Otro"};
// Clasificacion igual a la constancia en papel.
const classifications:Array<[string,string]>=[["INCENDIO_VEHICULAR","Incendio vehicular"],["INCENDIO_ESTRUCTURAL","Incendio estructural"],["INCENDIO_FORESTAL","Incendio forestal"],["INCENDIO_INDUSTRIAL","Incendio industrial"],["INUNDACION","Inundación"],["RESCATE_PERSONA","Rescate de persona"],["PREVENCION","Prevención"],["COOPERACIONES_VARIAS","Cooperaciones varias"],["ACCIDENTE_VEHICULAR","Accidente vehicular"],["PERDIDA_GAS","Pérdida de gas"],["RESCATE_ANIMAL","Rescate de animal"],["FALSA_ALARMA","Falsa alarma"],["OTROS","Otros"]];
const nameOf=(u:Named)=>u?u.profile?.fullName||u.username:"—";
const hour=(date:string|null)=>date?new Date(date).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Argentina/Buenos_Aires"}):"—";
// "En base 12:34–12:50 · salió en M-5 12:50": la base y las salidas de la misma persona no se superponen.
const baseTimeline=(p:{segments?:Array<{from:string;to:string}>;respondedOnly?:boolean;departures?:Array<{unit:string;departedAt:string;returnedAt:string|null}>})=>{
 const base=p.respondedOnly?"Respondió “Voy”, sin fichar en el cuartel":p.segments?.length?`En base ${p.segments.map(seg=>`${hour(seg.from)}–${hour(seg.to)}`).join(", ")}`:"En base";
 const out=(p.departures||[]).map(d=>`salió en ${d.unit} ${hour(d.departedAt)}${d.returnedAt?`, volvió ${hour(d.returnedAt)}`:""}`);
 return [base,...out].join(" · ");
};
// "M-14: Ana (conductor), Juan (a cargo), Pedro": quien salio en cada movil.
const unitCrews=(movements:Movement[])=>movements.map(m=>({id:m.id,unit:`Móvil ${m.asset.vehicle?.unitNumber||m.asset.name}`,people:m.crew.map(c=>`${c.user.profile?.fullName||c.user.username}${c.userId===m.driverUserId?" (conductor)":c.userId===m.leaderUserId?" (a cargo)":""}`).join(", ")}));
const agencyLabel=(a:{name:string;unit:string;inCharge:string})=>[a.name,a.unit&&`unidad ${a.unit}`,a.inCharge&&`a cargo de ${a.inCharge}`].filter(Boolean).join(", ");
const requestLabel=(i:{requestNumber?:number|null;requestYear?:number|null})=>i.requestNumber?`${i.requestNumber}/${i.requestYear}`:"Sin número";
const time=(date:string|null)=>date?new Date(date).toLocaleString("es-AR",{timeZone:"America/Argentina/Buenos_Aires"}):"Pendiente";
// Paso numerado de la planilla: ordena el flujo de carga de arriba hacia abajo.
function Step({n,title,children,hint}:{n:number;title:string;hint?:string;children:React.ReactNode}){return <section className="mt-6 rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4"><h3 className="flex items-center gap-2 text-base font-bold text-white"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs">{n}</span>{title}</h3>{hint&&<p className="mt-1 text-sm text-[var(--mut)]">{hint}</p>}<div className="mt-3">{children}</div></section>;}
function Sheet({id,data,saved}:{id:string;data:Response;saved:()=>Promise<unknown>}){
 const {user}=useAuth();
 const {sheet,context:{incident,baseCandidates}}=data;
 const [materials,setMaterials]=useState<Material[]>(sheet?.materials||[]),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [closing,setClosing]=useState(false),[closeError,setCloseError]=useState(""),[closingReport,setClosingReport]=useState("");
 const command=["ADMIN","OPERATOR","GUARD"].includes(user?.role||"");
 // Personal actuante: toda la dotacion de las salidas (sin repetir).
 const actingCrew=[...new Map(incident.movements.flatMap(m=>m.crew.map(c=>[c.userId,c.user.profile?.fullName||c.user.username] as const))).values()];
 const crewByUnit=unitCrews(incident.movements);
 const away=incident.movements.filter(m=>!m.returnedAt).length,returned=incident.movements.length-away;
 const callerName=sheet?(sheet.callerName||"Sin registrar"):(incident.alert?.originNotice?.source||"Sin registrar");
 const callerPhone=sheet?(sheet.callerPhone||"Sin registrar"):(incident.alert?.originNotice?.phone||incident.alert?.contactPhone||"Sin registrar");
 const incidentOpen=incident.status==="OPEN"&&!sheet?.finalizedAt;
 const locked=!data.canWrite||!incidentOpen;
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError("");
 try{await api.put(`/incidents/${id}/sheet`,{revision:sheet?.revision||0,callerName:form.get("callerName"),callerPhone:form.get("callerPhone"),addressNumber:form.get("addressNumber"),receivedBy:form.get("receivedBy"),firefightersOnScene:sheet?.firefightersOnScene||"",classifications:form.getAll("classification"),classificationDetail:form.get("classificationDetail"),notes:form.get("notes"),materials,baseUserIds:form.getAll("base"),evidenceUrls:String(form.get("urls")||"").split("\n").map(s=>s.trim()).filter(Boolean)});await saved();}catch(err){setError(getErrorMessage(err,"No se pudo guardar la planilla"));}finally{setBusy(false);}}
 async function close(e:FormEvent<HTMLFormElement>){e.preventDefault();if(closingReport.trim().length<10)return;setClosing(true);setCloseError("");try{await api.patch(`/incidents/${id}/close`,{closingReport:closingReport.trim()});await saved();}catch(err){setCloseError(getErrorMessage(err,"No se pudo cerrar la intervención. Verifique que todos los móviles hayan regresado."));}finally{setClosing(false);}}
 const finalized=Boolean(sheet?.finalizedAt)||incident.status==="CLOSED";
 const commandRole=user?.role==="ADMIN"||user?.role==="OPERATOR";
 const receivedDefault=sheet?(sheet.receivedBy||""):(incident.alert?.createdBy.profile?.fullName||incident.alert?.createdBy.username||"");
 async function changeNumber(){
  const current=incident.requestNumber?String(incident.requestNumber):"";
  const value=window.prompt("Número de pedido de auxilio (para que coincida con el libro):",current);if(!value)return;
  const n=Number(value);if(!Number.isInteger(n)||n<1){toast.error("Ingresá un número válido");return;}
  const reason=window.prompt("Motivo de la corrección:","Empalmar con la numeración del libro");if(!reason||reason.trim().length<5)return;
  try{await api.patch(`/incidents/${id}/sheet/request-number`,{requestNumber:n,requestYear:incident.requestYear||new Date().getFullYear(),reason:reason.trim()});toast.success(`Pedido de auxilio N° ${n}/${incident.requestYear}`);await saved();}catch(err){toast.error(getErrorMessage(err,"No se pudo cambiar el número"));}
 }
 return <>
 <header className="mt-4"><div className="flex flex-wrap items-center gap-2"><span className={`badge ${finalized?"badge-green":"badge-red"}`}>{finalized?"Cerrada":"En curso"}</span><span className="badge badge-gray">{types[incident.type]||incident.type}</span></div>
 <p className="mt-2 text-sm font-semibold text-[var(--mut)]">Pedido de auxilio N° <span className="font-mono text-white">{requestLabel(incident)}</span>{commandRole&&!incident.voidedAt&&<button type="button" className="ml-2 text-xs underline" onClick={()=>void changeNumber()}>Corregir</button>}</p>
 <h1 className="mt-1 text-2xl font-bold text-white">{incident.title}</h1>
 <p className="mt-1 text-sm text-[var(--mut)]">{incident.location} · Inicio {time(incident.occurredAt)}</p><div className="mt-3 flex flex-wrap gap-2"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(incident.location)}`} target="_blank" rel="noopener noreferrer" className="app-button app-button-outline w-auto">Ver en mapa</a><Link href={`/notebook?incident=${id}`} className="app-button app-button-outline w-auto">Libreta del siniestro</Link>{callerPhone!=="Sin registrar"&&<a href={`tel:${callerPhone.replace(/[^\d+]/g,"")}`} className="app-button app-button-outline w-auto">Llamar a quien avisó</a>}{incidentOpen&&<ReinforcementRequest incidentId={id}/>}</div></header>
 <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
  {[["Móviles fuera",away,away>0],["Móviles retornados",returned,false],["Personal en base",sheet?.baseUserIds.length??0,false],["Planilla",sheet?`Guardada (rev. ${sheet.revision})`:"Sin guardar",!sheet&&!finalized]].map(([label,value,warn])=><div key={String(label)} className={`rounded-xl border p-3 ${warn?"border-amber-500/40 bg-amber-500/10":"border-[var(--bord)] bg-[var(--card)]"}`}><dt className="text-xs text-[var(--mut)]">{label}</dt><dd className="mt-1 font-bold text-white">{value}</dd></div>)}
 </dl>
 <p className="mt-3 text-sm text-[var(--mut)]">Despachó la alerta: <span className="text-white">{incident.alert?.createdBy.profile?.fullName||incident.alert?.createdBy.username||"Sin alerta"}</span> · Llamó: <span className="text-white">{callerName}</span> · Tel.: <span className="text-white">{callerPhone}</span>{sheet&&<> · Completó: <span className="text-white">{sheet.author.username}</span></>}</p>
 {incidentOpen&&!data.canWrite&&<div role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"><p className="min-w-0 flex-1 text-sm text-amber-100">Podés consultar esta planilla. Para editarla necesitás presencia activa por QR en el cuartel. La guardia de turno, administración y oficiales están exceptuados.</p><Link href="/attendance" className="app-button w-auto">Registrar ingreso</Link></div>}
 {incident.replacesIncidentId&&<p className="mt-4 rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-sm">Esta intervención rehace una anulada. Cargá las salidas con sus horarios reales y completá la planilla.</p>}
 <IncidentRedo incidentId={id} closed={finalized} voided={Boolean(incident.voidedAt)}/>

 <Step n={1} title="Salidas de móviles" hint="Registrá cada móvil al salir, al llegar y al regresar. La intervención no se cierra mientras haya móviles fuera.">
  <IncidentMovements historical={Boolean(incident.replacesIncidentId)} incidentId={id} incidentOpen={incidentOpen} canWrite={data.canWrite} movements={incident.movements} saved={saved}/>
 </Step>

 <form onSubmit={submit}><fieldset disabled={locked||busy}>
 <Step n={2} title="Pedido de auxilio y personal" hint="Los mismos datos de la constancia en papel.">
  <div className="grid gap-3 sm:grid-cols-2"><Field label="Solicitado por (quién llamó)"><input className="app-input" name="callerName" maxLength={120} defaultValue={sheet?sheet.callerName:incident.alert?.originNotice?.source||""}/></Field><Field label="Teléfono de quien llamó"><input className="app-input" type="tel" name="callerPhone" maxLength={40} defaultValue={sheet?sheet.callerPhone:incident.alert?.originNotice?.phone||incident.alert?.contactPhone||""}/></Field>
   <Field label="Domicilio del siniestro"><input className="app-input" value={incident.location} readOnly aria-readonly title="Se toma de la alerta"/></Field>
   <Field label="N° / KM"><input className="app-input" name="addressNumber" maxLength={40} defaultValue={sheet?.addressNumber||""} placeholder="Ej. 1062 o km 600"/></Field>
   <Field label="Pedido de emergencia recibido por"><input className="app-input" name="receivedBy" maxLength={120} defaultValue={receivedDefault}/></Field>
   <Field label="Confección de planilla"><input className="app-input" readOnly aria-readonly value={sheet?(sheet.author.profile?.fullName||sheet.author.username):(user?.profile?.fullName||user?.username||"")}/></Field></div>
  <div className="mt-3 rounded-lg border border-[var(--bord)] p-3 text-sm"><p className="font-semibold text-white">Personal actuante</p>{crewByUnit.length?<ul className="mt-1 space-y-1">{crewByUnit.map(u=><li key={u.id} className="text-[var(--mut)]"><strong className="text-[var(--txt)]">{u.unit}:</strong> {u.people}</li>)}</ul>:<p className="mt-1 text-[var(--mut)]">Se completa solo con la dotación de cada salida (paso 1).</p>}</div>
  <fieldset className="mt-3"><legend className="text-sm font-semibold text-white">Personal en la base</legend><p className="mb-2 text-xs text-[var(--mut)]">Aparecen quienes tuvieron presencia QR durante la emergencia o respondieron “Voy”. Quien integra una salida (personal actuante) no aparece; si se corrige la dotación y deja de integrarla, vuelve a aparecer.</p>{baseCandidates.length===0&&<p className="text-sm text-[var(--mut)]">Nadie cumple esas condiciones todavía.</p>}<div className="grid gap-1 sm:grid-cols-2">{baseCandidates.map(p=><label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--bord)] px-3 text-sm" key={p.id}><input name="base" value={p.id} type="checkbox" className="h-4 w-4" defaultChecked={sheet?.baseUserIds.includes(p.id)}/><span className="min-w-0 py-2"><span className="block">{p.name}</span><span className="block text-xs text-[var(--mut)]">{baseTimeline(p)}</span></span></label>)}</div></fieldset>
  <p className="mt-3 text-xs text-[var(--mut)]">Los otros cuarteles y las instituciones presentes se cargan en «Instituciones que participaron», al final de la planilla.</p>
 </Step>
 <Step n={3} title="Clasificación, actuación y material empleado">
  <fieldset><legend className="text-sm font-semibold text-white">Clasificación (marcá lo que corresponda)</legend>
   <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{classifications.map(([value,label])=><label key={value} className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--bord)] px-3 text-sm"><input type="checkbox" name="classification" value={value} className="h-4 w-4" defaultChecked={sheet?.classifications?.includes(value)}/>{label}</label>)}</div>
   <div className="mt-2"><Field label="Detalle (si es necesario)"><input className="app-input" name="classificationDetail" maxLength={300} defaultValue={sheet?.classificationDetail||""} placeholder="Ej. Garrafa"/></Field></div>
  </fieldset>
  <div className="mt-4"/>
  <Field label="Actuación y novedades"><textarea required name="notes" minLength={10} maxLength={4000} className="app-input min-h-28" defaultValue={sheet?.notes||""} placeholder="Qué se encontró, qué se hizo y cómo quedó el lugar"/></Field>
  <h4 className="mt-4 text-sm font-semibold text-white">Material empleado en la intervención</h4>
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
 <Constancia incident={incident} sheet={sheet} actingCrew={actingCrew} base={baseCandidates.filter(p=>sheet?.baseUserIds.includes(p.id)).map(p=>p.segments?.length?`${p.name} (${p.segments.map(seg=>`${hour(seg.from)}–${hour(seg.to)}`).join(", ")})`:p.name)}/>
 {sheet?.finalizedAt&&<SheetAmendments id={id} revision={sheet.revision} allowed={user?.role==="ADMIN"||user?.role==="OPERATOR"} items={data.amendments||[]} saved={saved}/>}</>;
}
export default function IncidentSheetPage(){
 const {id}=useParams<{id:string}>(),{user}=useAuth();
 const query=useQuery({queryKey:["incident-sheet",id,user?.id],enabled:Boolean(user),queryFn:async()=>(await api.get<Response>(`/incidents/${id}/sheet`)).data});
 return <ProtectedLayout><main className="screen-body"><Link href="/incidents" className="text-sm text-red-300 underline-offset-4 hover:underline">← Intervenciones</Link>{query.isLoading&&<p role="status" className="mt-4">Cargando planilla…</p>}{query.isError&&<ErrorNotice>{getErrorMessage(query.error,"No se pudo consultar la planilla")}</ErrorNotice>}{query.data&&<Sheet key={query.data.sheet?.revision||0} id={id} data={query.data} saved={query.refetch}/>}</main></ProtectedLayout>;
}

// Vista con el mismo orden que la constancia en papel, lista para imprimir y archivar en el libro.
function Constancia({incident,sheet,actingCrew,base}:{incident:Response["context"]["incident"];sheet:Response["sheet"];actingCrew:string[];base:string[]}){
 const marked=new Set(sheet?.classifications||[]);
 const row=(label:string,value:React.ReactNode)=><div className="grid grid-cols-[minmax(0,190px)_1fr] gap-2 border-b border-[var(--bord)] py-1.5"><dt className="text-[var(--mut)]">{label}</dt><dd className="break-words">{value||"—"}</dd></div>;
 const materials=(sheet?.materials||[]).map(m=>`${m.name}${m.quantity>1?` ×${m.quantity}`:""}${m.notes?` (${m.notes})`:""}`).join(" · ");
 return <section id="constancia" className="mt-6 rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4 text-sm">
  <style>{`@media print{body *{visibility:hidden!important}#constancia,#constancia *{visibility:visible!important;color:#000!important;background:#fff!important;border-color:#999!important}#constancia{position:absolute;inset:0 auto auto 0;width:100%}#constancia .no-print{display:none}}`}</style>
  <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs uppercase tracking-wide text-[var(--mut)]">Sociedad de Bomberos Voluntarios de Sampacho</p><h2 className="text-lg font-bold">Constancia de intervención</h2></div><div className="text-right"><p className="text-xs text-[var(--mut)]">Pedido de auxilio N°</p><p className="font-mono text-lg font-bold">{requestLabel(incident)}</p></div></div>
  <dl className="mt-3">
   {row("Solicitado por",`${sheet?.callerName||"—"}${sheet?.callerPhone?` · Tel. ${sheet.callerPhone}`:""}`)}
   {row("Domicilio del siniestro",`${incident.location}${sheet?.addressNumber?` · N°/KM ${sheet.addressNumber}`:""}`)}
   {row("Pedido recibido por",sheet?.receivedBy)}
   {row("Confección de planilla",sheet?(sheet.author.profile?.fullName||sheet.author.username):"")}
   {row("Personal actuante",unitCrews(incident.movements).length?<ul className="space-y-0.5">{unitCrews(incident.movements).map(u=><li key={u.id}><strong>{u.unit}:</strong> {u.people}</li>)}</ul>:actingCrew.join(" · "))}
   {row("Personal en la base",base.join(" · "))}
   {row("Bomberos presentes en el lugar",(incident.agencies||[]).filter(a=>a.agencyType==="FIRE_STATION").map(agencyLabel).join(" · ")||sheet?.firefightersOnScene)}
   {(incident.agencies||[]).some(a=>a.agencyType!=="FIRE_STATION")&&row("Otras instituciones",(incident.agencies||[]).filter(a=>a.agencyType!=="FIRE_STATION").map(agencyLabel).join(" · "))}
   {row("Material empleado",materials)}
   {row("Clasificación",classifications.filter(([v])=>marked.has(v)).map(([,l])=>l).join(" · ")+(sheet?.classificationDetail?` — ${sheet.classificationDetail}`:""))}
  </dl>
  <h3 className="mt-4 font-semibold">Unidad asignada y horarios</h3>
  <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[520px] border-collapse text-left">
   <thead><tr className="border-b border-[var(--bord)] text-xs text-[var(--mut)]">{["Unidad N°","Salida","Llegada al lugar","Entrada","Chofer","Encargado"].map(h=><th key={h} className="py-1.5 pr-2 font-semibold">{h}</th>)}</tr></thead>
   <tbody>{incident.movements.length?incident.movements.map(m=><tr key={m.id} className="border-b border-[var(--bord)]"><td className="py-1.5 pr-2 font-semibold">{m.asset.vehicle?.unitNumber||m.asset.name}</td><td className="pr-2 font-mono">{hour(m.departedAt)}</td><td className="pr-2 font-mono">{hour(m.arrivedAt)}</td><td className="pr-2 font-mono">{hour(m.returnedAt)}</td><td className="pr-2">{nameOf(m.driver)}</td><td>{nameOf(m.leader)}</td></tr>):<tr><td colSpan={6} className="py-2 text-[var(--mut)]">Sin salidas registradas.</td></tr>}</tbody>
  </table></div>
  <button type="button" className="no-print app-button app-button-outline mt-4 w-auto" onClick={()=>window.print()}>Imprimir constancia</button>
 </section>;
}
