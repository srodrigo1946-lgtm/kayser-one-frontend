"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead, User } from "@/types";

export interface Appointment {
  id: string;
  title: string;
  type: "visita" | "reuniao" | "tarefa" | "lembrete";
  status: "agendado" | "realizado" | "cancelado";
  scheduledAt: string;
  durationMin: number;
  location?: string;
  notes?: string;
  leadId?: string;
  lead?: Lead | null;
  userId?: string;
  user?: User | null;
}

export function useAppointments(from?: string, to?: string) {
  return useQuery({
    queryKey: ["appointments", { from, to }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await api.get<Appointment[]>("/appointments", { params });
      return data;
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Appointment>) => {
      const { data } = await api.post("/appointments", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/appointments/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
