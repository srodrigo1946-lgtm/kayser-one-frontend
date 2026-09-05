"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface QueueSettings {
  id: string;
  enabled: boolean;
  slaMinutes: number;
  memberIds: string[];
  pointer: number;
}

export interface QueueBoard {
  recebidos: number;
  atendidos: number;
  expirados: number;
  porCargo: Record<string, number>;
}

export function useQueueSettings() {
  return useQuery({
    queryKey: ["lead-queue"],
    queryFn: async () => (await api.get<QueueSettings>("/lead-queue/settings")).data,
  });
}

export function useUpdateQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<Pick<QueueSettings, "enabled" | "slaMinutes" | "memberIds">>) =>
      (await api.put<QueueSettings>("/lead-queue/settings", dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-queue"] }),
  });
}

export interface DistribuirResult {
  status: "distribuido" | "aguardando" | "ja_na_fila" | "sem_telefone" | "fila_desligada";
  assignedToId?: string;
}

// Joga um lead manual no rodízio de plantão (só Diretor).
export function useDistribuirLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) =>
      (await api.post<DistribuirResult>(`/lead-queue/distribuir/${leadId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-queue", "board"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// Atribuições pendentes (leadId + prazo) para o relógio de contagem no card do Kanban.
export function usePendentes() {
  return useQuery({
    queryKey: ["lead-queue", "pendentes"],
    refetchInterval: 30_000,
    queryFn: async () => (await api.get<{ leadId: string; dueAt: string }[]>("/lead-queue/pendentes")).data,
  });
}

export function useQueueBoard(enabled = true) {
  return useQuery({
    queryKey: ["lead-queue", "board"],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => (await api.get<QueueBoard>("/lead-queue/board")).data,
  });
}
