import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { InstalarApp } from "@/components/pwa/instalar-app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kayser One | CRM Inteligente",
  description: "Plataforma SaaS de CRM com IA para gestão comercial imobiliária",
  applicationName: "Kayser One",
  // App no iPhone (Adicionar à Tela de Início): tela cheia, nome e ícone.
  appleWebApp: { capable: true, title: "Kayser One", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
        <InstalarApp />
      </body>
    </html>
  );
}
