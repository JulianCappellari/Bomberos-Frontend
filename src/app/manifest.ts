import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "Bomberos Voluntarios Sampacho", short_name: "Bomberos", lang: "es-AR", description: "Gestion interna del cuartel", start_url: "/dashboard", scope: "/", display: "standalone", background_color: "#101113", theme_color: "#b91c1c", icons: [{ src: "/app-icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }] };
}
