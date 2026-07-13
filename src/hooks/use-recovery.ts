"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Dados do usuário autenticado (inclui hasRecoveryCode). */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<{ role: string; hasRecoveryCode?: boolean }>("/auth/me");
      return data;
    },
  });
}

/** Diretor define/atualiza o código de recuperação. */
export function useSetRecoveryCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recoveryCode: string) => {
      const { data } = await api.put<{ message: string }>("/auth/recovery-code", { recoveryCode });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
