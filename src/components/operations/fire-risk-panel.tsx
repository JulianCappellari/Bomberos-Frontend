"use client";
import {useState} from "react";
import {Flame,ExternalLink} from "lucide-react";
export function FireRiskPanel(){
 const [open,setOpen]=useState(false),[failed,setFailed]=useState(false);
 return <section className="my-4 border-y border-[var(--bord)] py-4"><h2 className="flex items-center gap-2 font-bold"><Flame size={18} className="text-red-300"/> Peligro meteorológico de incendio</h2>
 <p className="mt-2 text-sm text-[var(--mut)]">El FWI describe el peligro potencial del comportamiento del fuego si se produce un incendio; no confirma que haya uno. La clasificación provincial utiliza cinco niveles: bajo, moderado, alto, muy alto y extremo.</p>
 <div className="mt-3 flex flex-wrap gap-2"><button className="app-button w-auto" aria-expanded={open} aria-controls="official-fwi" onClick={()=>{setOpen(!open);setFailed(false);}}>{open?"Cerrar mapa":"Consultar mapa FWI"}</button><a className="app-button app-button-outline w-auto" target="_blank" rel="noopener noreferrer" href="https://mapascordoba.gob.ar/viewer/mapa/442">Abrir fuente oficial <ExternalLink size={14}/></a></div>
 {open&&<div id="official-fwi" className="mt-4 min-w-0"><p className="mb-3 text-sm">Revisá la fecha y la capa seleccionada: el visor también muestra pronóstico para el día siguiente. Los datos y su vigencia los publica IDECOR; la app no calcula ni certifica un nivel para el cuartel.</p>{failed?<p role="alert">No se pudo abrir el mapa. Consultá la fuente oficial en una pestaña nueva.</p>:<iframe title="Mapa oficial del índice meteorológico de peligro de incendios de Córdoba" src="https://mapascordoba.gob.ar/viewer/embed/mapa/442" className="h-[500px] w-full rounded-lg border border-[var(--bord)] sm:h-[600px]" loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups" onError={()=>setFailed(true)}/>}<p className="mt-2 text-xs text-[var(--mut)]">Fuente: <a href="https://www.idecor.gob.ar/nueva-version-del-mapa-diario-de-indice-de-riesgo-de-incendio/" target="_blank" rel="noopener noreferrer" className="underline">IDECOR, alcance y validez del índice</a>. La consulta requiere conexión.</p></div>}
 </section>;
}
