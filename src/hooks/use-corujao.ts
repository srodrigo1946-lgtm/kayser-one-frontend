"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CorujaoLead {
  id: string;
  name: string;
  phone: string;
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
}

// Leads do repique (Diretor ou corretor ativado). 403 = não ativado.
export function useCorujaoPool() {
  return useQuery({
    queryKey: ["corujao", "pool"],
    refetchInterval: 20_000,
    retry: false,
    queryFn: async () => (await api.get<CorujaoLead[]>("/corujao/pool")).data,
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
    mutationFn: async (dto: Partial<Pick<CorujaoConfig, "enabled" | "hora" | "status" | "incluirDiretor">>) =>
      (await api.put<CorujaoConfig>("/corujao/config", dto)).data,
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
