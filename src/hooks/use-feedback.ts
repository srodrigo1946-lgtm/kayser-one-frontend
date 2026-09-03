"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface FeedbackNote {
  id: string;
  alvoTipo: "user" | "time";
  alvoId: string;
  autorId: string;
  autorNome: string;
  texto: string;
  createdAt: string;
}

export function useFeedback(alvoTipo: "user" | "time", alvoId: string | null) {
  return useQuery({
    queryKey: ["feedback", alvoTipo, alvoId],
    enabled: !!alvoId,
    queryFn: async () => {
      const { data } = await api.get<FeedbackNote[]>("/feedback", { params: { alvoTipo, alvoId } });
      return data;
    },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { alvoTipo: "user" | "time"; alvoId: string; texto: string }) => {
      const { data } = await api.post("/feedback", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/feedback/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });
}
