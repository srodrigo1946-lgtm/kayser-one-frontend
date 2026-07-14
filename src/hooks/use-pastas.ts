"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Pasta {
  id: string;
  numero?: number;
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
  parecer?: string;
  docToken?: string;
  empresaId?: string;
  docsReleasedAt?: string | null;
  createdAt: string;
}

export interface PastaWindow {
  released: boolean;
  active: boolean;
  archived: boolean;
  remainingMs: number;
  releasedAt: string | null;
  expiresAt: string | null;
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

export interface PastaFile {
  id: string;
  tipo: string;
  filename: string;
  uploadedAt: string;
}
export interface PastaFilesResp {
  request: { clientName?: string };
  documents: PastaFile[];
  window?: PastaWindow;
}

// Lista os documentos recebidos da pasta (empresa parceira / gestor com acesso).
export function usePastaFiles(id: string | null) {
  return useQuery({
    queryKey: ["pasta-files", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<PastaFilesResp>(`/pastas/${id}/files`);
      return data;
    },
  });
}

// Baixa o arquivo autenticado (blob) e abre em nova aba (PDF/imagem renderizam inline).
export async function openPastaFile(pastaId: string, docId: string) {
  const { data } = await api.get(`/pastas/${pastaId}/files/${docId}`, { responseType: "blob" });
  const url = URL.createObjectURL(data as Blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Libera/reabre a janela de 40 min para a empresa (corretor/Diretor).
export function useReleasePastaDocs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<PastaWindow>(`/pastas/${id}/release`, {});
      return data;
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["pastas"] });
      qc.invalidateQueries({ queryKey: ["pasta-files", id] });
    },
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
