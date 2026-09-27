"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead } from "@/types";

export interface AlertsResponse {
  semAtendimento: Lead[];
  semContato: Lead[];
  /** Clientes que responderam e ainda aguardam resposta do corretor (com o texto). */
  responderam?: { leadId: string; nome: string; mensagem: string; at: string }[];
  /** Totais verdadeiros (as listas vêm limitadas). */
  responderamTotal?: number;
  semContatoTotal?: number;
  /** Visitas que a IA agendou fora do plantão (cartão: nome, telefone, data, corretor). */
  visitasIA?: { id: string; leadId: string; nome: string; phone: string; scheduledAt: string; local: string; corretor: string | null }[];
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
