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

export function useMonthlyData(year?: number) {
  return useQuery({
    queryKey: ["dashboard", "monthly", year ?? "current"],
    queryFn: async () => {
      const { data } = await api.get<SaleData[]>("/dashboard/chart/monthly", {
        params: year ? { year } : undefined,
      });
      return data;
    },
  });
}

export interface Champion {
  responsavelId: string;
  nome: string;
  hasAvatar: boolean;
  vgv: number;
  vendas: number;
}

// VGV total do período (soma valorVenda das vendas ganhas). Acompanha ano/mês.
export function useVgv(year: number, month?: number) {
  return useQuery({
    queryKey: ["dashboard", "vgv", year, month ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<{ total: number; vendas: number }>("/dashboard/vgv", {
        params: { year, ...(month ? { month } : {}) },
      });
      return data;
    },
  });
}

// year obrigatório; month opcional (undefined = ano todo).
export function useChampion(year: number, month?: number) {
  return useQuery({
    queryKey: ["dashboard", "champion", year, month ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<Champion | null>("/dashboard/champion", {
        params: { year, ...(month ? { month } : {}) },
      });
      return data;
    },
  });
}

export interface FollowupItem {
  id: string;
  leadId: string;
  nome: string;
  phone: string;
  at: string;
}

export interface FollowupsResponse {
  items: FollowupItem[];
  semana: number;
  hoje: number;
}

// Follow-ups automáticos que a IA disparou (nome/telefone/quando + clicar p/ conversa).
export function useFollowups() {
  return useQuery({
    queryKey: ["dashboard", "followups"],
    queryFn: async () => {
      const { data } = await api.get<FollowupsResponse>("/dashboard/followups");
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
