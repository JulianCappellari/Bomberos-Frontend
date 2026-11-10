"use client";
import {FormEvent,useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {api} from "@/lib/api-client";
import {getErrorMessage} from "@/lib/get-error-message";
import {useAuth} from "@/features/auth/auth-context";
export function GuardEligibility({id}:{id:string}){
 const {user}=useAuth(),client=useQueryClient(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const query=useQuery({queryKey:["guard-eligibility",id],enabled:user?.role==="ADMIN",queryFn:async()=>(await api.get<{guardEligible:boolean;updatedAt:string;profile:{rank:string}|null}>(`/users/${id}`)).data});
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");
  try{await api.put(`/users/${id}/guard-eligibility`,{enabled:!query.data!.guardEligible,revision:query.data!.updatedAt,reason:new FormData(e.currentTarget).get("reason")});await client.invalidateQueries({queryKey:["guard-eligibility",id]});await client.invalidateQueries({queryKey:["admin-profile-editor"]});await client.invalidateQueries({queryKey:["admin-staff"]});}
  catch(err){setError(getErrorMessage(err,"No se pudo cambiar la función"));}finally{setBusy(false);}
 }
 if(user?.role!=="ADMIN"||user.id===id)return null;
 return <section className="my-4 border-t border-[var(--bord)] pt-4"><h3 className="font-bold">Función adicional de guardia</h3>{query.data&&<form key={query.data.updatedAt} onSubmit={submit}><p className="my-2 text-sm">{query.data.guardEligible?"Habilitada":"No habilitada"} · El cargo institucional se conserva.</p><label className="block text-sm">Motivo administrativo<textarea name="reason" required minLength={10} maxLength={1000} className="app-input mt-1"/></label><button disabled={busy} className="app-button mt-2 w-auto">{query.data.guardEligible?"Revocar función de guardia":"Habilitar función de guardia"}</button></form>}{(error||query.isError)&&<p role="alert">{error||"No se pudo consultar la habilitación."}</p>}</section>;
}
