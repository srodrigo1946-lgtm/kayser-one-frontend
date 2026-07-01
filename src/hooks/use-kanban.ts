"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { KanbanColumn } from "@/types";

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
      status: string;
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

/* ---------------- Edição de colunas (Diretor) ---------------- */

export function useCreateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { title: string; emoji?: string; color?: string }) => {
      const { data } = await api.post("/kanban/columns", body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban"] }),
  });
}

export function useUpdateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      emoji?: string;
      color?: string;
    }) => {
      const { data } = await api.patch(`/kanban/columns/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban"] }),
  });
}

export function useReorderColumns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await api.patch("/kanban/columns/reorder", { ids });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban"] }),
  });
}

export function useDeleteColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/kanban/columns/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban"] }),
  });
}
