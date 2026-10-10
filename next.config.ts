import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
