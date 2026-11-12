"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { fetchPublicPosts, POST_KIND_LABEL, postDate, PublicPostKind, publicPhotoUrl } from "@/lib/public-posts";

// Pagina publica (sin iniciar sesion): informacion para la comunidad y los medios.
export default function PublicNewsPage() {
  const [kind, setKind] = useState<PublicPostKind | "">(""), [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["public-posts", kind, page], queryFn: () => fetchPublicPosts(kind || undefined, page) });
  const pages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.pageSize)) : 1;
  return <div className="min-h-dvh bg-[var(--bg)] text-[var(--txt)]">
    <header className="border-b border-[var(--bord)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/novedades" className="flex items-center gap-3"><Image src="/escudo-sampacho.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" /><span><span className="block text-lg font-black leading-tight">Bomberos Voluntarios de Sampacho</span><span className="text-xs text-[var(--mut)]">Novedades para la comunidad</span></span></Link>
        <Link href="/login" className="shrink-0 text-sm font-semibold underline">Ingresar</Link>
      </div>
    </header>
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold">Novedades</h1>
      <p className="mt-1 text-sm text-[var(--mut)]">Informes de intervenciones finalizadas, capacitaciones y noticias del cuartel.</p>
      <div className="my-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar">
        {([["", "Todas"], ["INCIDENT", "Intervenciones"], ["TRAINING", "Capacitaciones"], ["NEWS", "Noticias"]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={kind === v} onClick={() => { setKind(v); setPage(1); }} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${kind === v ? "border-red-500 bg-red-500/10" : "border-[var(--bord)]"}`}>{l}</button>)}
      </div>
      {query.isLoading && <p className="py-8 text-center text-sm text-[var(--mut)]">Cargando novedades…</p>}
      {query.isError && <p role="alert" className="py-8 text-center text-sm">No se pudieron cargar las novedades. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></p>}
      {query.data?.items.length === 0 && <p className="py-8 text-center text-sm text-[var(--mut)]">Todavía no hay publicaciones.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {query.data?.items.map((p) => <Link key={p.id} href={`/novedades/${p.id}`} className="overflow-hidden rounded-2xl border border-[var(--bord)] bg-[var(--card)] transition hover:border-red-500/50">
          {p.photos[0] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={publicPhotoUrl(p.id, p.photos[0].id)} alt="" loading="lazy" className="aspect-video w-full object-cover" />}
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs"><span className="badge">{POST_KIND_LABEL[p.kind]}</span><span className="flex items-center gap-1 text-[var(--mut)]"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{postDate(p)}</span></div>
            <h2 className="mt-2 text-lg font-bold leading-snug">{p.title}</h2>
            <p className="mt-1 text-sm text-[var(--mut)]">{p.summary}</p>
            {p.kind === "INCIDENT" && (p.units?.length || p.peopleCount) ? <p className="mt-2 text-xs font-semibold">{[p.units?.length ? `Móviles ${p.units.join(", ")}` : "", p.peopleCount ? `${p.peopleCount} bomberos` : "", p.agencies?.length ? `${p.agencies.length} ${p.agencies.length === 1 ? "institución más" : "instituciones más"}` : ""].filter(Boolean).join(" · ")}</p> : null}
          </div>
        </Link>)}
      </div>
      {pages > 1 && <div className="mt-6 flex items-center justify-center gap-3"><button className="app-button w-auto" disabled={page === 1} onClick={() => setPage(page - 1)}>Anteriores</button><span className="text-sm">{page} de {pages}</span><button className="app-button w-auto" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguientes</button></div>}
    </main>
  </div>;
}
