import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Papas Doradas",
  description: "Papas doradas por bolsa (150 g) y por kilo (1000 g)",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Papas Doradas",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-maskable.svg",
  },
};

// Controla cómo se ve la app instalada: color de la barra del sistema y que
// el contenido pueda extenderse detrás del notch/home indicator en iOS.
export const viewport: Viewport = {
  themeColor: "#C6401B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body min-h-screen overscroll-none">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
