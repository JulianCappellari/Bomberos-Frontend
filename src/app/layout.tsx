import type { Metadata, Viewport } from "next";
import "./globals.css";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ReactQueryProvider } from "@/lib/react-query";
import { AuthProvider } from "@/features/auth/auth-context";
import { AppLifecycle } from "@/components/operations/app-lifecycle";
import { AppearanceProvider, appearanceBootScript } from "@/components/operations/appearance-settings";

// Tipografia institucional: IBM Plex Sans para todo el texto y Plex Mono para horas, codigos y cronometros.
// next/font las aloja en el propio sitio (sin pedirlas a Google en cada visita y sin saltos al cargar).
const plexSans = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-plex", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Bomberos Voluntarios Sampacho",
  description:
    "Sistema operativo para Bomberos Voluntarios del Cuartel Sampacho, Córdoba.",
  applicationName: "BomberosApp",
  icons: {
    icon: { url: "/app-icon-192.png", type: "image/png", sizes: "192x192" },
    apple: { url: "/app-icon-192.png", sizes: "192x192" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: true,
  themeColor: "#0d0f14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="dark" data-accent="red" className={`${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
      </head>
      <body>
        <ReactQueryProvider>
          <AuthProvider><AppearanceProvider><AppLifecycle>{children}</AppLifecycle></AppearanceProvider></AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
