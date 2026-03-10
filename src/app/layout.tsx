import type { Metadata, Viewport } from "next";
import { ReactQueryProvider } from "@/lib/react-query";
import { AuthProvider } from "@/features/auth/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "BomberosApp · Cuartel Sampacho",
  description: "Sistema operativo para Bomberos Voluntarios del Cuartel Sampacho, Córdoba.",
  applicationName: "BomberosApp",
  authors: [{ name: "Cuartel Sampacho" }],
  keywords: ["bomberos", "sampacho", "voluntarios", "emergencias", "córdoba"],
  robots: "noindex, nofollow", // sistema interno — no indexar
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ReactQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}