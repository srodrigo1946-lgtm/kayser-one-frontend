"use client";

import { useMutation } from "@tanstack/react-query";
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
