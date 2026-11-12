import type { NextConfig } from "next";

// Vitrine pública (Rodrigo 12/11): imoveis.kayserone.com.br mostra o site estático de
// public/vitrine (fonte: C:\Apps\vitrine-kayser). Nenhuma tela do K1 muda.
// Subdomínio chega pelo repassador do Cloudflare com o endereço original em `x-kayser-host`.
const VITRINE_HOSTS = [
  [{ type: "header" as const, key: "x-kayser-host", value: "imoveis\\.kayserone\\.com\\.br" }],
  [{ type: "host" as const, value: "imoveis.kayserone.com.br" }],
];
const vitrine = VITRINE_HOSTS.flatMap((has) => [
  { source: "/", has, destination: "/vitrine/index.html" },
  { source: "/privacidade", has, destination: "/vitrine/privacidade.html" },
  { source: "/:arq+", has, destination: "/vitrine/:arq+" },
]);

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: vitrine,
      afterFiles: [],
      fallback: [],
    };
  },
  // Cabeçalhos de segurança: o Kayser não pode ser aberto escondido dentro de outro site
  // (clickjacking), o navegador não "adivinha" tipo de arquivo e o endereço completo da
  // página não vaza pra outros sites.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
