"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAiChat() {
  return useMutation({
    mutationFn: async (messages: AiChatMessage[]) => {
      const { data } = await api.post<{ content: string }>("/ai/chat", { messages });
      return data;
    },
  });
}

export interface MyAiConfig {
  aiProvider: string | null;
  aiModel: string | null;
  hasAiKey: boolean;
}

/** IA própria do usuário logado (provedor/modelo + se tem chave; nunca traz a chave). */
export function useMyAi() {
  return useQuery({
    queryKey: ["my-ai"],
    queryFn: async () => {
      const { data } = await api.get<MyAiConfig>("/users/me/ai");
      return data;
    },
  });
}

export function useUpdateMyAi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { aiProvider?: string; aiModel?: string; aiApiKey?: string }) => {
      const { data } = await api.put<MyAiConfig>("/users/me/ai", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-ai"] }),
  });
}
