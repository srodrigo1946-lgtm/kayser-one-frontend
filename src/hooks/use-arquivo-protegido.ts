"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Baixa um arquivo protegido (mídia da conversa, imagem do grupo) com o token no
 * CABEÇALHO e devolve um endereço local (blob:) pra usar em <img>/<audio>/<video>.
 * Antes o token ia na URL (?token=) e ficava gravado nos logs do servidor.
 */
export function useArquivoProtegido(caminho: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!caminho) return;
    let vivo = true;
    let criado: string | null = null;
    api
      .get(caminho, { responseType: "blob" })
      .then((r) => {
        if (!vivo) return;
        criado = URL.createObjectURL(r.data);
        setUrl(criado);
      })
      .catch(() => {});
    return () => {
      vivo = false;
      if (criado) URL.revokeObjectURL(criado);
      setUrl(null);
    };
  }, [caminho]);
  return url;
}
