"use client";

import { useEffect } from "react";
import { useMarca, corDoTexto } from "@/hooks/use-marca";

/**
 * Aplica a marca própria no site inteiro: título da aba e a cor principal (por cima do
 * tema). Sem marca configurada, nada muda (fica o Kayser One amarelo e preto).
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
    if (m.nome && m.nome !== "Kayser One") document.title = document.title.replace(/Kayser One/g, m.nome);
  }, [m.cor, m.nome]);
  return null;
}
