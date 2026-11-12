"use client";
import Link from "next/link";
import Image from "next/image";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Share2 } from "lucide-react";
import { fetchPublicPost, POST_KIND_LABEL, postDate, publicPhotoUrl } from "@/lib/public-posts";

// Publicacion publica: texto completo y fotos. Se puede compartir el enlace.
export default function PublicPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useQuery({ queryKey: ["public-post", id], queryFn: () => fetchPublicPost(id) });
  const post = query.data;
  async function share() {
    const url = window.location.href;
    try { if (navigator.share) await navigator.share({ title: post?.title, url }); else { await navigator.clipboard.writeText(url); alert("Enlace copiado"); } } catch { /* cancelado */ }
  }
  return <div className="min-h-dvh bg-[var(--bg)] text-[var(--txt)]">
    <header className="border-b border-[var(--bord)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/novedades" className="flex items-center gap-3"><Image src="/escudo-sampacho.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" /><span className="text-lg font-black leading-tight">Bomberos Voluntarios de Sampacho</span></Link>
      </div>
    </header>
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/novedades" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" aria-hidden /> Todas las novedades</Link>
      {query.isLoading && <p className="py-8 text-center text-sm text-[var(--mut)]">Cargando…</p>}
      {(query.isError || (query.data === null)) && <p className="py-8 text-center">Esta publicación no está disponible.</p>}
      {post && <article className="mt-2">
        <div className="flex flex-wrap items-center gap-2 text-sm"><span className="badge">{POST_KIND_LABEL[post.kind]}</span><span className="flex items-center gap-1 text-[var(--mut)]"><CalendarDays className="h-4 w-4" aria-hidden />{postDate(post)}</span></div>
        <h1 className="mt-3 text-3xl font-black leading-tight">{post.title}</h1>
        <p className="mt-3 text-lg text-[var(--mut)]">{post.summary}</p>
        {(post.units?.length || post.peopleCount || post.agencies?.length) ? <dl className="mt-5 grid gap-3 rounded-2xl border border-[var(--bord)] bg-[var(--card)] p-4 sm:grid-cols-3">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--mut)]">{post.units?.length === 1 ? "Móvil que salió" : "Móviles que salieron"}</dt><dd className="mt-1 font-bold">{post.units?.length ? post.units.join(", ") : "—"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--mut)]">Personal en el lugar</dt><dd className="mt-1 font-bold">{post.peopleCount ? `${post.peopleCount} ${post.peopleCount === 1 ? "bombero" : "bomberos"}` : "—"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-[var(--mut)]">Otras instituciones</dt><dd className="mt-1">{post.agencies?.length ? <ul className="space-y-1">{post.agencies.map((a) => <li key={a} className="font-semibold">{a}</li>)}</ul> : <span className="font-semibold">No participaron</span>}</dd></div>
        </dl> : null}
        {post.photos.length > 0 && <div className={`mt-5 grid gap-2 ${post.photos.length > 1 ? "sm:grid-cols-2" : ""}`}>{post.photos.map((ph, i) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={ph.id} src={publicPhotoUrl(post.id, ph.id)} alt={`Foto ${i + 1} de la publicación`} className="w-full rounded-xl object-cover" loading={i ? "lazy" : "eager"} />)}</div>}
        <div className="mt-5 whitespace-pre-wrap break-words leading-relaxed">{post.body}</div>
        <button type="button" onClick={() => void share()} className="app-button mt-6 w-auto"><Share2 className="h-4 w-4" aria-hidden /> Compartir</button>
      </article>}
    </main>
  </div>;
}
