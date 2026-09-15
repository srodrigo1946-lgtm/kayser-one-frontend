"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CorujaoLead {
  id: string;
  name?: string; // só vem para o Diretor; corretor/gerente veem "Lead disponível"
  phone?: string; // só vem para o Diretor (corretor/gerente não veem no pool)
  empreendimento: string;
  origem: string;
  status: string;
  responsavel?: string; // só vem para o Diretor
}

export interface CorujaoConfig {
  enabled: boolean;
  hora: string;
  status: string;
  incluirDiretor: boolean;
  colunas: { key: string; title: string }[];
  corretores: { id: string; name: string; corujao: boolean }[];
  poolCount: number;
  naoLiberados: number;
  autoQtd: number;
  agendadoPara?: string | null;
}

export interface CorujaoPool {
  podePegar: boolean; // só corretor ativado pode aceitar
  leads: CorujaoLead[];
}

// Leads do repique — todos os cargos VEEM; só corretor ativado PEGA.
export function useCorujaoPool() {
  return useQuery({
    queryKey: ["corujao", "pool"],
    refetchInterval: 20_000,
    queryFn: async () => (await api.get<CorujaoPool>("/corujao/pool")).data,
  });
}

export function useAceitarCorujao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => (await api.post(`/corujao/aceitar/${leadId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corujao"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["kanban"] });
    },
  });
}

export function useCorujaoConfig(enabled = true) {
  return useQuery({
    queryKey: ["corujao", "config"],
    enabled,
    queryFn: async () => (await api.get<CorujaoConfig>("/corujao/config")).data,
  });
}

export function useSetCorujaoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      dto: Partial<Pick<CorujaoConfig, "enabled" | "hora" | "status" | "incluirDiretor" | "autoQtd">> & {
        agendadoPara?: string;
      }
    ) => (await api.put<CorujaoConfig>("/corujao/config", dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["corujao"] }),
  });
}

// Diretor libera N leads da fila pro pool do repique.
export function useLiberarCorujao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (qtd: number) =>
      (await api.post<{ released: number; noPool: number; naoLiberados: number }>("/corujao/liberar", { qtd })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["corujao"] }),
  });
}

export function useAtivarCorretorCorujao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) =>
      (await api.put(`/corujao/corretor/${id}`, { ativo })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["corujao"] }),
  });
}

export function usePuxarCorujao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await api.post<{ leads: number; corretores: number; notificados: number }>("/corujao/puxar")).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["corujao"] }),
  });
}
