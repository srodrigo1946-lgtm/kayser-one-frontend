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

export interface KanbanColumnInfo {
  id: string;
  key: string;
  title: string;
  emoji: string;
  color: string;
  position: number;
}

// Só as colunas (ordenadas) — leve, p/ mover o lead pela esteira no drawer.
export function useKanbanColumns() {
  return useQuery({
    queryKey: ["kanban", "columns"],
    queryFn: async () => (await api.get<KanbanColumnInfo[]>("/kanban/columns")).data,
  });
}

/**
 * Pergunta o dia do agendamento (Kanban e janela do lead). Devolve a data em ISO,
 * ou null se cancelou/data inválida — aí o card NÃO muda de etapa.
 */
export function perguntarDataAgendamento(nome: string): string | null {
  const amanha = new Date(Date.now() + 86_400_000);
  const resp = window.prompt(`Qual é o dia do agendamento de ${nome}?\n(DD/MM/AAAA HH:MM)`, `${amanha.toLocaleDateString("pt-BR")} 10:00`);
  const m = resp?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  const quando = m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] ?? 10), +(m[5] ?? 0)) : null;
  if (!quando || isNaN(quando.getTime())) {
    if (resp != null) alert("Data inválida. Use DD/MM/AAAA HH:MM — ex.: 25/10/2026 14:30");
    return null;
  }
  return quando.toISOString();
}

export function useMoveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      status,
      order,
      dataAgendamento,
    }: {
      leadId: string;
      status: string;
      order: number;
      dataAgendamento?: string;
    }) => {
      const { data } = await api.put(`/kanban/move/${leadId}`, { status, order, dataAgendamento });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kanban"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
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
      somenteGestores?: boolean;
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
