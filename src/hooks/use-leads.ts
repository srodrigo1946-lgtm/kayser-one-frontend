"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead, LeadStatus } from "@/types";

export interface LeadsResponse {
  data: Lead[];
  total: number;
  page: number;
  pages: number;
}

export interface LeadsFilter {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useLeads(filter: LeadsFilter = {}) {
  const { status, search, page = 1, limit = 50 } = filter;
  return useQuery({
    queryKey: ["leads", { status, search, page, limit }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit };
      if (status && status !== "all") params.status = status;
      if (search) params.search = search;
      const { data } = await api.get<LeadsResponse>("/leads", { params });
      return data;
    },
  });
}

export interface LeadHistoryEntry {
  id: string;
  type: string;
  description: string;
  fromStatus?: string;
  toStatus?: string;
  createdAt: string;
}

export function useLeadHistory(leadId: string | null) {
  return useQuery({
    queryKey: ["leads", leadId, "history"],
    enabled: !!leadId,
    queryFn: async () => {
      const { data } = await api.get<LeadHistoryEntry[]>(`/leads/${leadId}/history`);
      return data;
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Lead>) => {
      const { data } = await api.post<Lead>("/leads", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Lead> & { id: string }) => {
      const { data } = await api.put<Lead>(`/leads/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["kanban"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["kanban"] }); // some o card na hora
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useImportLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<{ imported: number; duplicates: number; total: number }>(
        "/leads/import/excel",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export async function exportLeads() {
  const response = await api.get("/leads/export/excel", { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = "leads-kayser-one.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
