"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Quantos leads estão no Bolsão agora (barra lateral e página usam a mesma chave). */
export function useQtdBolsao() {
  return useQuery({
    queryKey: ["bolsao"],
    refetchInterval: 30_000,
    queryFn: async () => (await api.get<{ leads: unknown[] }>("/bolsao")).data,
    select: (d) => d?.leads?.length ?? 0,
  });
}

/**
 * Ícone da barra lateral: sacola vermelha que brilha; com lead no Bolsão o brilho pulsa
 * e aparece o número (Rodrigo 22/11).
 */
export function BolsaoIcone({ size = 18, className }: { size?: number; className?: string }) {
  const { data: qtd = 0 } = useQtdBolsao();
  return (
    <span className={`k1-bolsao-ic ${qtd ? "tem" : ""} ${className ?? ""}`} style={{ position: "relative", width: size, height: size, display: "inline-flex" }}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
        <path d="M8 7c0-2.2 1.8-4 4-4s4 1.8 4 4" fill="none" stroke="#facc15" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4.5 8.5h15l-1.3 11.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8z" fill="#ef4444" />
        <path d="M8.5 13h7" stroke="#7f1d1d" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {!!qtd && (
        <span
          className="k1-bolsao-num"
          style={{ position: "absolute", top: -7, right: -9, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 999, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #0a0a0a" }}
        >
          {qtd > 99 ? "99+" : qtd}
        </span>
      )}
      <style>{`
        .k1-bolsao-ic svg { filter: drop-shadow(0 0 3px #ef4444aa); }
        .k1-bolsao-ic.tem svg { animation: k1BolsaoBrilho 1.6s ease-in-out infinite; }
        @keyframes k1BolsaoBrilho {
          0%, 100% { filter: drop-shadow(0 0 2px #ef444499); transform: scale(1); }
          50% { filter: drop-shadow(0 0 7px #ff3b3b) drop-shadow(0 0 12px #ef444488); transform: scale(1.12); }
        }
        @media (prefers-reduced-motion: reduce) { .k1-bolsao-ic.tem svg { animation: none; filter: drop-shadow(0 0 6px #ff3b3b); } }
      `}</style>
    </span>
  );
}
