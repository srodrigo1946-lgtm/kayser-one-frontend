"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead } from "@/types";

export interface ConversationItem {
  id: string;
  channel: string;
  remoteJid?: string;
  leadId?: string;
  lead?: Lead | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; role?: string; avatar?: string | null } | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  content: string;
  direction: "in" | "out";
  isAI: boolean;
  createdAt: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get<ConversationItem[]>("/conversations");
      return data;
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["conversations", conversationId, "messages"],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data } = await api.get<{ conversation: ConversationItem; messages: ChatMessageItem[] }>(
        `/conversations/${conversationId}/messages`
      );
      return data;
    },
  });
}

export function useSendWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ to, text }: { to: string; text: string }) => {
      const { data } = await api.post("/whatsapp/send", { to, text });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useAssignConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string | null }) => {
      const { data } = await api.patch(`/conversations/${conversationId}/assign`, { userId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
