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
  aiAutoReply: boolean;
  hasApiKey: boolean;
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
    mutationFn: async (payload: Partial<AppSettings> & { aiApiKey?: string }) => {
      const { data } = await api.put("/settings", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
