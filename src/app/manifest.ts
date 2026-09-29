import type { MetadataRoute } from "next";

/** App instalável (PWA): ícone na tela inicial do celular, abre em tela cheia. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kayser One",
    short_name: "Kayser One",
    description: "CRM imobiliário com IA — leads, WhatsApp, fila e agenda",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Conversas ao vivo", url: "/whatsapp", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Kanban", url: "/kanban", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Agenda", url: "/agenda", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
