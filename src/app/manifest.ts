import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { apiDoHost } from "@/lib/api";

/**
 * App instalável (PWA): ícone na tela inicial do celular, abre em tela cheia.
 * Marca própria: nome e logo vêm da imobiliária do subdomínio (padrão Kayser One).
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let nome = "Kayser One";
  let logo: string | null = null;
  try {
    const api = apiDoHost((await headers()).get("host"));
    const r = await fetch(`${api}/marca`, { next: { revalidate: 300 } });
    if (r.ok) {
      const m = await r.json();
      nome = m.nome || nome;
      if (m.temLogo) logo = `${api}/marca/logo?v=${m.versao}`;
    }
  } catch {}
  const icones: MetadataRoute.Manifest["icons"] = logo
    ? [{ src: logo, sizes: "any", purpose: "any" }]
    : [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ];
  const atalho = [{ src: logo || "/icons/icon-192.png", sizes: logo ? "any" : "192x192" }];
  return {
    name: nome,
    short_name: nome,
    description: "CRM imobiliário com IA — leads, WhatsApp, fila e agenda",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "pt-BR",
    icons: icones,
    shortcuts: [
      { name: "Conversas ao vivo", url: "/whatsapp", icons: atalho },
      { name: "Kanban", url: "/kanban", icons: atalho },
      { name: "Agenda", url: "/agenda", icons: atalho },
    ],
  };
}
