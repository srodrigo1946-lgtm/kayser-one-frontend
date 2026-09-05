"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Investimento do período (mês específico, ou soma do ano quando month é undefined).
export function useInvestimento(year: number, month?: number) {
  return useQuery({
    queryKey: ["investimento", year, month ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<{ valor: number }>("/investimento", {
        params: { year, ...(month ? { month } : {}) },
      });
      return data;
    },
  });
}

export function useSetInvestimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ano, mes, valor }: { ano: number; mes: number; valor: number }) => {
      const { data } = await api.put("/investimento", { ano, mes, valor });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investimento"] }),
  });
}

export interface DiaValor {
  dia: number;
  valor: number;
  fonte?: string;
}

// Gasto por dia do mês (para o editor manual e o gráfico diário).
export function useInvestDays(year: number, month: number) {
  return useQuery({
    queryKey: ["investimento", "dias", year, month],
    enabled: month > 0,
    queryFn: async () => {
      const { data } = await api.get<DiaValor[]>("/investimento/dias", {
        params: { year, month },
      });
      return data;
    },
  });
}

export function useSetInvestDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ano, mes, dias }: { ano: number; mes: number; dias: { dia: number; valor: number }[] }) => {
      const { data } = await api.put("/investimento/dias", { ano, mes, dias });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investimento"] }),
  });
}

// Apaga o gasto por dia do mês (volta ao valor único mensal).
export function useClearInvestDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ano, mes }: { ano: number; mes: number }) => {
      const { data } = await api.delete("/investimento/dias", { params: { year: ano, month: mes } });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investimento"] }),
  });
}
