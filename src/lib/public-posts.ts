// Novedades publicas: se leen sin sesion (comunidad y medios).
export type PublicPostKind = "INCIDENT" | "TRAINING" | "NEWS";
export type PublicPost = { id: string; kind: PublicPostKind; title: string; summary: string; body: string; happenedOn: string | null; publishedAt: string | null; units?: string[]; peopleCount?: number | null; agencies?: string[]; photos: Array<{ id: string }> };
export const POST_KIND_LABEL: Record<PublicPostKind, string> = { INCIDENT: "Intervención", TRAINING: "Capacitación", NEWS: "Novedad" };
const base = () => (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
export const publicPhotoUrl = (postId: string, photoId: string) => `${base()}/public/posts/${postId}/photos/${photoId}`;
export async function fetchPublicPosts(kind?: PublicPostKind, page = 1) {
  const url = new URL(`${base()}/public/posts`, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (kind) url.searchParams.set("kind", kind);
  url.searchParams.set("page", String(page));
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudieron cargar las novedades");
  return (await res.json()) as { items: PublicPost[]; total: number; page: number; pageSize: number };
}
export async function fetchPublicPost(id: string) {
  const res = await fetch(`${base()}/public/posts/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo cargar la publicación");
  return (await res.json()) as PublicPost;
}
export const postDate = (p: PublicPost) => new Date(p.happenedOn ?? p.publishedAt ?? Date.now()).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: p.happenedOn ? "UTC" : "America/Argentina/Buenos_Aires" });
