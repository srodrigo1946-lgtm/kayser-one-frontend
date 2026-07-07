"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead, SaleData } from "@/types";

export interface DashboardMetricsResponse {
  leadsHoje: number;
  leadsSemana: number;
  leadsMes: number;
  visitas: number;
  vendas: number;
  conversao: number;
  semAtendimento: number;
  semContato: number;
}

export interface RankingItem {
  responsavelId: string | null;
  nome: string | null;
  role?: string | null;
  hasAvatar?: boolean;
  meta?: number;
  vendas: string | number;
  leads: string | number;
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: async () => {
      const { data } = await api.get<DashboardMetricsResponse>("/dashboard/metrics");
      return data;
    },
  });
}

export function useMonthlyData() {
  return useQuery({
    queryKey: ["dashboard", "monthly"],
    queryFn: async () => {
      const { data } = await api.get<SaleData[]>("/dashboard/chart/monthly");
      return data;
    },
  });
}

export function useRanking() {
  return useQuery({
    queryKey: ["dashboard", "ranking"],
    queryFn: async () => {
      const { data } = await api.get<RankingItem[]>("/dashboard/ranking");
      return data;
    },
  });
}

export function useRecentLeads() {
  return useQuery({
    queryKey: ["dashboard", "recent-leads"],
    queryFn: async () => {
      const { data } = await api.get<{ data: Lead[] }>("/leads", {
        params: { page: 1, limit: 5 },
      });
      return data.data;
    },
  });
}
