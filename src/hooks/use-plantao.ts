import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PlantaoStatus {
  regraAtiva: boolean;
  turnoAtivo: boolean;
  turno?: { horaInicio: string; horaFim: string };
  naEscala: boolean;
  checkin: { stand: string; distancia: number; hora: string } | null;
}

export interface PlantaoPainel {
  raio: number;
  checkinObrigatorio: boolean;
  regraAtiva: boolean;
  turnoAtivo: { id: string; horaInicio: string; horaFim: string; atendentes: number } | null;
  stands: { propertyId: string; nome: string; endereco: string; localizado: boolean; lat: number | null; lng: number | null }[];
  checkinsHoje: { nome: string; stand: string; distancia: number; hora: string; doTurnoAtual: boolean }[];
}

/** Situação do meu plantão (escala + check-in) — atualiza a cada minuto. */
export function usePlantaoStatus(enabled = true) {
  return useQuery({
    queryKey: ["plantao", "status"],
    enabled,
    refetchInterval: 60_000,
    queryFn: async () => (await api.get<PlantaoStatus>("/plantao/status")).data,
  });
}

export function useCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { lat: number; lng: number; precisao?: number }) =>
      (await api.post<{ ok: boolean; stand: string; distancia: number; jaFeito?: boolean }>("/plantao/checkin", p)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plantao"] });
      qc.invalidateQueries({ queryKey: ["lead-queue"] });
    },
  });
}

export function usePlantaoPainel(enabled = true) {
  return useQuery({
    queryKey: ["plantao", "painel"],
    enabled,
    refetchInterval: 60_000,
    queryFn: async () => (await api.get<PlantaoPainel>("/plantao/painel")).data,
  });
}

/** Pega a localização do celular (GPS) — rejeita com mensagem amigável. */
export function pegarLocalizacao(): Promise<{ lat: number; lng: number; precisao: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Este aparelho não informa localização."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, precisao: p.coords.accuracy }),
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? "Permita a localização pro Kayser One (no aviso do navegador/celular) pra fazer o check-in."
              : "Não consegui pegar sua localização. Ligue o GPS e tente de novo."
          )
        ),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 30_000 }
    );
  });
}
