"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Pasta {
  id: string;
  leadId: string;
  clientName: string;
  clientCpf?: string;
  propertyId?: string;
  empreendimento?: string;
  construtora?: string;
  unidade?: string;
  bloco?: string;
  apartamento?: string;
  valorAvaliacao?: number;
  valorVendaFinal?: number;
  condicoesComerciais?: string;
  observacoes?: string;
  fase?: string;
  perfil?: string;
  status: string;
  docToken?: string;
  createdAt: string;
}

export function usePastas() {
  return useQuery({
    queryKey: ["pastas"],
    queryFn: async () => {
      const { data } = await api.get<Pasta[]>("/pastas");
      return data;
    },
  });
}

export function useCreatePasta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Pasta>) => {
      const { data } = await api.post<Pasta>("/pastas", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pastas"] }),
  });
}

export function useUpdatePasta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Pasta> & { id: string }) => {
      const { data } = await api.put<Pasta>(`/pastas/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pastas"] }),
  });
}

// Garante/retorna o token do ambiente de documentos da pasta.
export function useGeneratePastaDocs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ token: string }>(`/pastas/${id}/documents`, {});
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pastas"] }),
  });
}

export function useUpdatePastaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.put(`/pastas/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pastas"] }),
  });
}
