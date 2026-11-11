"use client";
import {useEffect,useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/auth-context";
import {AuthUser} from "@/types/auth";
import {api} from "@/lib/api-client";
import {getErrorMessage} from "@/lib/get-error-message";
import {toast} from "@/lib/toast";
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
 // La guardia ahora es una cuenta propia (otro usuario y contrasena). Solo queda salir de un modo guardia
 // viejo que alguien tuviera abierto antes del cambio.
 async function leaveLegacyGuard(){
  setBusy(true);setError("");
  try{
   await client.cancelQueries();
   const result=await api.post<AuthUser>("/auth/access-mode",{mode:"PERSONAL"});
   client.clear();setUser(result.data);router.replace("/dashboard");
   toast.success("Volviste a tu cuenta personal","La guardia ahora se hace con una cuenta propia. Pedila a administración.");
  }catch(err){setError(getErrorMessage(err,"No se pudo cambiar de función"));}finally{setBusy(false);}
 }
 const legacyGuard=user?.accessMode==="GUARD"&&(user.profile?.rank??"").toLowerCase()!=="guardia";
 if(!legacyGuard||user?.mustChangePassword)return null;
 return <div className="flex flex-wrap items-center gap-3 border-b border-[var(--bord)] px-4 py-2 text-sm"><span>Estás en el modo guardia anterior. La guardia ahora usa una cuenta propia.</span><button type="button" disabled={busy} className="app-button w-auto text-xs" onClick={leaveLegacyGuard}>{busy?"Cambiando...":"Volver a personal"}</button>{error&&<p role="alert" className="text-xs text-red-300">{error}</p>}</div>;
}
