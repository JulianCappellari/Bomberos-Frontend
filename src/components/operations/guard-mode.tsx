"use client";
import {useEffect,useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/auth-context";
import {AuthUser} from "@/types/auth";
import {api} from "@/lib/api-client";
import {getErrorMessage} from "@/lib/get-error-message";
export function GuardMode(){
 const {user,setUser}=useAuth(),client=useQueryClient(),router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const state=useQuery({queryKey:["session-access",user?.id],enabled:Boolean(user&&!user.mustChangePassword),queryFn:async()=>(await api.get<AuthUser>("/auth/me")).data,refetchInterval:30000,refetchOnWindowFocus:true});
 useEffect(()=>{
   const actual=state.data;
   if(actual&&user&&(actual.role!==user.role||actual.guardEligible!==user.guardEligible||actual.accessMode!==user.accessMode)){
     setUser(actual);client.clear();router.replace("/dashboard");
   }
 },[state.data,user,setUser,client,router]);
 async function toggle(){
  setBusy(true);setError("");
  try{
   await client.cancelQueries();
   const result=await api.post<AuthUser>("/auth/access-mode",{mode:user?.accessMode==="GUARD"?"PERSONAL":"GUARD"});
   client.clear();setUser(result.data);router.replace("/dashboard");
  }catch(err){setError(getErrorMessage(err,"No se pudo cambiar de función"));}finally{setBusy(false);}
 }
 if(!user?.guardEligible||user.mustChangePassword)return null;
 return <div className="flex flex-wrap items-center gap-3 border-b border-[var(--bord)] px-4 py-2 text-sm"><span>{user.accessMode==="GUARD"?"Función actual: Guardia":"Función actual: Personal"} · {user.profile?.rank}</span><button type="button" disabled={busy} className="app-button w-auto text-xs" onClick={toggle}>{busy?"Cambiando...":user.accessMode==="GUARD"?"Volver a personal":"Activar modo guardia"}</button>{error&&<p role="alert" className="text-xs text-red-300">{error}</p>}</div>;
}
