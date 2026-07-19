"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const CHAVE_SOM = "kayser:som-lead";

export function somLigado() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(CHAVE_SOM) !== "off";
}

export function setSomLigado(ligado: boolean) {
  localStorage.setItem(CHAVE_SOM, ligado ? "on" : "off");
}

/**
 * Bip curto de 2 tons gerado na hora (Web Audio) — sem arquivo de áudio pra baixar.
 * O navegador só deixa tocar depois que o usuário interagiu com a página (clique);
 * como a pessoa está usando o sistema, na prática sempre toca.
 */
export function tocarBip() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const tom = (freq: number, inicio: number, dur: number) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + inicio;
      vol.gain.setValueAtTime(0.0001, t);
      vol.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(vol).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    };
    tom(880, 0, 0.18); // lá
    tom(1320, 0.2, 0.22); // mi (mais agudo — chama atenção)
    setTimeout(() => ctx.close(), 1000);
  } catch {
    /* navegador bloqueou o áudio — ignora silenciosamente */
  }
}

/**
 * Toca um bip quando chega LEAD NOVO. Consulta o lead mais recente a cada 25s
 * (a rota /leads já é escopada por hierarquia, então cada um só é avisado dos
 * leads que são dele/da equipe dele). Não toca na primeira carga.
 */
export function useNewLeadAlert(ativo = true) {
  const ultimoId = useRef<string | null>(null);

  const { data } = useQuery({
    queryKey: ["leads-alerta"],
    enabled: ativo,
    refetchInterval: 25000,
    queryFn: async () =>
      (await api.get<{ data: { id: string; name: string }[] }>("/leads", {
        params: { page: 1, limit: 1 },
      })).data,
  });

  useEffect(() => {
    const novo = data?.data?.[0];
    if (!novo) return;
    // Primeira leitura: só memoriza (senão tocaria ao abrir o sistema).
    if (ultimoId.current === null) {
      ultimoId.current = novo.id;
      return;
    }
    if (novo.id !== ultimoId.current) {
      ultimoId.current = novo.id;
      if (somLigado()) tocarBip();
    }
  }, [data]);
}
