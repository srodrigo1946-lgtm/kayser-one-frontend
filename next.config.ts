import type { NextConfig } from "next";

// Vitrine pública (Rodrigo 12/11): imoveis.kayserone.com.br mostra o site estático de
// public/vitrine (fonte: C:\Apps\vitrine-kayser). Nenhuma tela do K1 muda.
const VITRINE = [{ type: "host" as const, value: "imoveis.kayserone.com.br" }];

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: VITRINE, destination: "/vitrine/index.html" },
        { source: "/privacidade", has: VITRINE, destination: "/vitrine/privacidade.html" },
        { source: "/:arq+", has: VITRINE, destination: "/vitrine/:arq+" },
      ],
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
