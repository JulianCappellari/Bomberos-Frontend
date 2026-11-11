import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query";
import { AuthProvider } from "@/features/auth/auth-context";
import { AppLifecycle } from "@/components/operations/app-lifecycle";
import { AppearanceProvider, appearanceBootScript } from "@/components/operations/appearance-settings";

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
    <html lang="es" data-theme="dark" data-accent="red" suppressHydrationWarning>
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
