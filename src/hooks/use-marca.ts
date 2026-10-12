"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

export interface Marca {
  nome: string;
  cor: string | null;
  temLogo: boolean;
  versao: number;
  matriz?: boolean;
  limiteUsuarios?: number | null;
  // Serviços adicionais comprados: ia (IA de resposta), ione (IA One), meta (Anúncios Meta).
  adicionais?: string[];
  // Conta bloqueada/encerrada pela Kayser (a tela de login avisa).
  bloqueado?: boolean;
}

const PADRAO: Marca = { nome: "K1", cor: null, temLogo: false, versao: 0 };
const CHAVE = "kayser-marca";

/** Logo da marca própria (público) — muda de endereço quando o Diretor troca. */
export const logoDaMarca = (m: Marca) => (m.temLogo ? `${API_URL}/marca/logo?v=${m.versao}` : null);

/**
 * Marca própria (white-label): nome, cor e logo da imobiliária. Público (vale na tela
 * de login). Guarda no navegador pra pintar já na abertura, e atualiza em seguida.
 */
export function useMarca(): Marca {
  const [marca, setMarca] = useState<Marca>(PADRAO);
  useEffect(() => {
    let vivo = true;
    try {
      const salva = localStorage.getItem(CHAVE);
      if (salva) setMarca({ ...PADRAO, ...JSON.parse(salva) });
    } catch {}
    fetch(`${API_URL}/marca`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!vivo || !m) return;
        setMarca({ ...PADRAO, ...m });
        try {
          localStorage.setItem(CHAVE, JSON.stringify(m));
        } catch {}
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);
  return marca;
}

/** Texto preto ou branco, o que ler melhor em cima da cor da marca. */
export function corDoTexto(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#0a0a0a" : "#ffffff";
}
