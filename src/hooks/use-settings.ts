"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AppSettings {
  id: string;
  aiProvider: "anthropic" | "openai" | "gemini";
  aiModel?: string;
  masterPrompt?: string;
  followupEnabled: boolean;
  followupDays: number;
  followupSources?: string[];
  followupMsgManha?: string;
  followupMsgTarde?: string;
  followupMsgNoite?: string;
  aiAutoReply: boolean;
  aiReplyGroups: boolean;
  hasApiKey: boolean;
  /** Tem chave da OpenAI pra transcrever áudio? (a chave nunca volta pro front) */
  hasAudioKey?: boolean;
  hasDirecionalImage: boolean;
  hasMetaToken: boolean;
  hasMetaVerify: boolean;
  direcionalUrl?: string;
  tabelaRivaUrl?: string;
  custoLeadVisivel?: boolean;
  leadOrigens?: string[];
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get<AppSettings>("/settings");
      return data;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AppSettings> & { aiApiKey?: string; audioApiKey?: string }) => {
      const { data } = await api.put("/settings", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
