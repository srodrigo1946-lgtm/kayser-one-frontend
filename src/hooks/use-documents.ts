"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DocRequestSummary {
  id: string;
  token: string;
  fase: string;
  total: number;
  recebidos: number;
  concluido: boolean;
  createdAt: string;
}

export function useConversationDocs(conversationId: string | null) {
  return useQuery({
    queryKey: ["documents", "conversation", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data } = await api.get<DocRequestSummary[]>(`/documents/conversation/${conversationId}`);
      return data;
    },
  });
}

export function useCreateDocRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      conversationId?: string;
      leadId?: string;
      clientName: string;
      clientPhone?: string;
      fase: string;
      perfil: string;
      estadoCivil: string;
      declaraIR: boolean;
    }) => {
      const { data } = await api.post<{ token: string; link: string }>("/documents/request", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
