"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead } from "@/types";

export interface ConversationItem {
  id: string;
  channel: string;
  remoteJid?: string;
  contactName?: string | null;
  contactAvatar?: string | null;
  leadId?: string;
  lead?: Lead | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; role?: string; avatar?: string | null } | null;
  etiquetas?: string[] | null;
  fromAd?: boolean;
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
  mediaType?: string | null;
  mediaMime?: string | null;
  hasMedia?: boolean;
  createdAt: string;
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    // Lista de conversas atualiza sozinha a cada 5s (mensagem/lead novo aparece rápido).
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
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
    // Conversa ABERTA atualiza a cada 2s — o chat parece tempo real. Só roda para
    // a conversa aberta (enabled), então não pesa.
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
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
    mutationFn: async ({ to, text }: { to: string; text: string; conversationId?: string }) => {
      const { data } = await api.post("/whatsapp/send", { to, text });
      return data;
    },
    // Eco imediato: a mensagem enviada aparece na hora, sem esperar o refetch.
    onMutate: async ({ text, conversationId }) => {
      if (!conversationId) return {};
      const key = ["conversations", conversationId, "messages"];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any>(key);
      const otimista: ChatMessageItem = {
        id: `temp-${Date.now()}`,
        conversationId,
        content: text,
        direction: "out",
        isAI: false,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<any>(key, (old: any) =>
        old ? { ...old, messages: [...(old.messages ?? []), otimista] } : old
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.prev && ctx?.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_d, _e, vars: any) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (vars?.conversationId)
        qc.invalidateQueries({ queryKey: ["conversations", vars.conversationId, "messages"] });
    },
  });
}

export function useSendWhatsappMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      to: string;
      base64: string;
      mimetype: string;
      fileName: string;
      caption?: string;
    }) => {
      const { data } = await api.post("/whatsapp/send-media", payload);
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

export function useSetEtiquetas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, etiquetas }: { conversationId: string; etiquetas: string[] }) => {
      const { data } = await api.patch(`/conversations/${conversationId}/etiquetas`, { etiquetas });
      return data;
    },
    onSuccess: () => {
      // A etiqueta pode mover o lead no Kanban e criar compromisso na Agenda.
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["kanban"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
