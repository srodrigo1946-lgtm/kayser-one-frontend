"use client";

import { useEffect } from "react";
import { useMarca, corDoTexto } from "@/hooks/use-marca";

/**
 * Aplica a marca própria no site inteiro: título da aba e a cor principal (por cima do
 * tema). Sem marca configurada, nada muda (fica o K1 amarelo e preto).
 */
export function AplicarMarca() {
  const m = useMarca();
  useEffect(() => {
    const raiz = document.documentElement;
    if (m.cor) {
      raiz.style.setProperty("--primary", m.cor);
      raiz.style.setProperty("--primary-foreground", corDoTexto(m.cor));
    } else {
      raiz.style.removeProperty("--primary");
      raiz.style.removeProperty("--primary-foreground");
    }
    if (m.nome && m.nome !== "K1") document.title = document.title.replace(/K1/g, m.nome);
  }, [m.cor, m.nome]);
  return null;
}
