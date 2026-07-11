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

export function useQueueBoard(enabled = true) {
  return useQuery({
    queryKey: ["lead-queue", "board"],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => (await api.get<QueueBoard>("/lead-queue/board")).data,
  });
}
