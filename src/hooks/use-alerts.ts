"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead } from "@/types";

export interface AlertsResponse {
  semAtendimento: Lead[];
  semContato: Lead[];
  /** Clientes que responderam e ainda aguardam resposta do corretor (com o texto). */
  responderam?: { leadId: string; nome: string; mensagem: string; at: string }[];
}

export function useAlerts() {
  return useQuery({
    queryKey: ["dashboard", "alerts"],
    queryFn: async () => {
      const { data } = await api.get<AlertsResponse>("/dashboard/alerts");
      return data;
    },
    refetchInterval: 60_000, // atualiza a cada minuto
  });
}
