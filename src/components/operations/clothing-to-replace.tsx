"use client";
import { useQuery } from "@tanstack/react-query";
import { Shirt } from "lucide-react";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { api } from "@/lib/api-client";

type Row = { id: string; title: string; clothingBrand: string | null; clothingModel: string | null; clothingSize: string | null; clothingCondition: "WORN" | "REVIEW" | "OUT"; clothingNovelties: string | null; updatedAt: string; person: { id: string; name: string; rank: string | null } };
const STATE = { OUT: ["Fuera de servicio", "badge-red"], REVIEW: ["Requiere revisión", "badge-yellow"], WORN: ["Gastada, se sigue usando", "badge-yellow"] } as const;

// Encargado de indumentaria: prendas declaradas por el personal que no estan al 100%, para reemplazarlas apenas se pueda.
export function ClothingToReplace() {
  const query = useQuery({ queryKey: ["supplies", "clothing-to-replace"], queryFn: async () => (await api.get<Row[]>("/supplies/clothing-to-replace")).data });
  const worn = query.data?.filter((r) => r.clothingCondition === "WORN").length ?? 0;
  return <section className="mt-4 space-y-3" aria-label="Prendas para reemplazar">
    <p className="text-sm text-[var(--mut)]">Prendas que cada bombero declaró en su perfil y no están al 100%. Las gastadas se siguen usando: reemplazalas apenas se pueda.{query.data?.length ? ` ${query.data.length} en total, ${worn} gastadas.` : ""}</p>
    {query.isLoading && <ListSkeleton label="Cargando prendas" />}
    {query.isError && <p role="alert" className="text-sm">No se pudo cargar el listado.</p>}
    {query.data?.length === 0 && <p className="card text-center text-sm text-[var(--mut)]">Todas las prendas declaradas están en condiciones.</p>}
    <ul className="space-y-2">{query.data?.map((r) => <li key={r.id} className="card flex gap-3">
      <Shirt className="mt-0.5 h-5 w-5 shrink-0 text-[var(--mut)]" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{r.title}{r.clothingSize ? ` · Talle ${r.clothingSize}` : ""}</p><span className={`badge ${STATE[r.clothingCondition][1]}`}>{STATE[r.clothingCondition][0]}</span></div>
        <p className="text-sm">{r.person.name}{r.person.rank ? <span className="text-[var(--mut)]"> · {r.person.rank}</span> : null}</p>
        {(r.clothingBrand || r.clothingModel) && <p className="text-xs text-[var(--mut)]">{[r.clothingBrand, r.clothingModel].filter(Boolean).join(" · ")}</p>}
        {r.clothingNovelties && <p className="mt-1 break-words text-sm">{r.clothingNovelties}</p>}
        <p className="mt-1 text-xs text-[var(--mut)]">Actualizado {new Date(r.updatedAt).toLocaleDateString("es-AR")}</p>
      </div>
    </li>)}</ul>
  </section>;
}
