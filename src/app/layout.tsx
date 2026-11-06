import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegistrarSW } from "@/components/pwa/registrar-sw";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "triple-play",
    template: "%s · triple-play",
  },
  description:
    "PWA móvil para administrar micro-negocios informales en México: inventario, ventas y personal por niveles.",
  applicationName: "triple-play",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "triple-play",
  },
  icons: {
    icon: [{ url: "/iconos/icono.svg", type: "image/svg+xml" }],
    apple: [{ url: "/iconos/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" />
        <RegistrarSW />
      </body>
    </html>
  );
}
