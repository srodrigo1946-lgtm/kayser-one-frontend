"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { KanbanColumn, LeadStatus } from "@/types";

export function useKanbanBoard() {
  return useQuery({
    queryKey: ["kanban", "board"],
    queryFn: async () => {
      const { data } = await api.get<KanbanColumn[]>("/kanban/board");
      return data;
    },
  });
}

export function useMoveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      status,
      order,
    }: {
      leadId: string;
      status: LeadStatus;
      order: number;
    }) => {
      const { data } = await api.put(`/kanban/move/${leadId}`, { status, order });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kanban"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
