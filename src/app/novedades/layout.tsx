import type { Metadata } from "next";

// Pagina publica: titulo y descripcion para buscadores y al compartir el enlace.
export const metadata: Metadata = {
  title: "Novedades · Bomberos Voluntarios de Sampacho",
  description: "Informes de intervenciones, capacitaciones y noticias de Bomberos Voluntarios de Sampacho para la comunidad y los medios.",
  openGraph: { title: "Novedades · Bomberos Voluntarios de Sampacho", description: "Informes de intervenciones, capacitaciones y noticias del cuartel.", images: ["/escudo-sampacho.png"] },
};

export default function NovedadesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
