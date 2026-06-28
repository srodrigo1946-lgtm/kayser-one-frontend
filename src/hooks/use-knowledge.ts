"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: string;
  active: boolean;
  updatedAt: string;
}

export function useKnowledge() {
  return useQuery({
    queryKey: ["knowledge"],
    queryFn: async () => {
      const { data } = await api.get<KnowledgeItem[]>("/knowledge");
      return data;
    },
  });
}

export function useCreateKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; content: string; type?: string }) => {
      const { data } = await api.post("/knowledge", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}

export function useUploadKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/knowledge/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}

export function useDeleteKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/knowledge/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }),
  });
}
