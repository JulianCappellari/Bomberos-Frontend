"use client";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { OperationalDocument } from "@/types/operations";
import { getErrorMessage } from "@/lib/get-error-message";
export function DocumentRectification({document,onCreated}: {document:OperationalDocument; onCreated:(draft:OperationalDocument)=>void}) {
  const [open,setOpen]=useState(false),[reason,setReason]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function create() {
    setBusy(true);setError("");
    try { const result=await api.post<OperationalDocument>(`/operations/documents/${document.id}/rectify`,{revision:document.revision,reason});onCreated(result.data);setOpen(false); }
    catch(err){setError(getErrorMessage(err,"No se pudo iniciar la rectificación"));}finally{setBusy(false);}
  }
  return <div>{!open ? <button className="app-button app-button-outline w-auto" onClick={()=>setOpen(true)}>Rectificar documento</button> : <div className="space-y-2"><label className="block text-sm">Motivo de rectificación<textarea className="app-input mt-1" minLength={10} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)}/></label><div className="flex gap-2"><button className="app-button w-auto" disabled={busy||reason.trim().length<10} onClick={create}>Crear borrador vinculado</button><button className="app-button w-auto" disabled={busy} onClick={()=>setOpen(false)}>Cancelar</button></div>{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}</div>}</div>;
}
