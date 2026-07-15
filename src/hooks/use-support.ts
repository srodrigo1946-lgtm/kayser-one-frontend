"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SupportMessage {
  id: string;
  name?: string;
  email?: string;
  type: string; // suporte | reclamacao
  message: string;
  read: boolean;
  createdAt: string;
}

// Público — enviar da caixinha da tela de login (sem token).
export async function sendSupportMessage(payload: {
  name?: string;
  email?: string;
  type?: string;
  message: string;
}) {
  const { data } = await api.post("/support", payload);
  return data;
}

// ---- Diretor (painel dentro do CRM) ----
export function useSupportMessages() {
  return useQuery({
    queryKey: ["support"],
    queryFn: async () => (await api.get<SupportMessage[]>("/support")).data,
  });
}

export function useSupportUnread(enabled = true) {
  return useQuery({
    queryKey: ["support-unread"],
    enabled,
    refetchInterval: 60_000,
    queryFn: async () => (await api.get<{ count: number }>("/support/unread/count")).data,
  });
}

export function useMarkSupportRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch(`/support/${id}/read`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support"] });
      qc.invalidateQueries({ queryKey: ["support-unread"] });
    },
  });
}

export function useDeleteSupport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/support/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support"] });
      qc.invalidateQueries({ queryKey: ["support-unread"] });
    },
  });
}
