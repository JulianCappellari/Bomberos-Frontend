import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query";
import { AuthProvider } from "@/features/auth/auth-context";
import { AppLifecycle } from "@/components/operations/app-lifecycle";
import { AppearanceProvider } from "@/components/operations/appearance-settings";

export const metadata: Metadata = {
  title: "Bomberos Voluntarios Sampacho",
  description:
    "Sistema operativo para Bomberos Voluntarios del Cuartel Sampacho, Córdoba.",
  applicationName: "BomberosApp",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: true,
  themeColor: "#e63c3c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ReactQueryProvider>
          <AuthProvider><AppearanceProvider><AppLifecycle>{children}</AppLifecycle></AppearanceProvider></AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
