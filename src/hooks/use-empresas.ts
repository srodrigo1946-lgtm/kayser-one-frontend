"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Empresa {
  id: string;
  cnpj: string;
  email: string;
  nome?: string;
  status: string; // pendente | aprovada | reprovada
  createdAt: string;
}

export function useEmpresas() {
  return useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data } = await api.get<Empresa[]>("/empresas");
      return data;
    },
  });
}

export function useCreateEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { cnpj: string; email: string; nome?: string }) => {
      const { data } = await api.post<Empresa>("/empresas", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["empresas"] }),
  });
}

export function useSetEmpresaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.put(`/empresas/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["empresas"] }),
  });
}
