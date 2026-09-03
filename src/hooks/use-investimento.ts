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
