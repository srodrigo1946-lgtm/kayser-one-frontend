"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead } from "@/types";

export interface AlertsResponse {
  semAtendimento: Lead[];
  semContato: Lead[];
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
