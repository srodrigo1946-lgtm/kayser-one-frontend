"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Baixa um arquivo protegido (mídia da conversa, imagem do grupo) com o token no
 * CABEÇALHO e devolve um endereço local (blob:) pra usar em <img>/<audio>/<video>.
 * Antes o token ia na URL (?token=) e ficava gravado nos logs do servidor.
 */
/**
 * Arquivo que vem de fora (cliente, WhatsApp) pode ser HTML/SVG com script: aberto como
 * blob: ele rodaria DENTRO do K1 com o login do usuário. Só tipos que não executam
 * nada abrem; o resto vira download (auditoria 19/10).
 */
export function blobSeguro(b: Blob): Blob {
  const t = (b.type || "").toLowerCase();
  const ok = /^(image\/(png|jpe?g|gif|webp|bmp|heic|heif)|application\/pdf|audio\/|video\/)/.test(t);
  return ok ? b : new Blob([b], { type: "application/octet-stream" });
}

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
        criado = URL.createObjectURL(blobSeguro(r.data));
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
