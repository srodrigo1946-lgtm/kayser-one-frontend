"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Lead, User } from "@/types";

/** Formata uma data para o padrão do Google Calendar (UTC: YYYYMMDDTHHMMSSZ). */
function toGoogleDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

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

/** Link para adicionar o compromisso ao Google Calendar. */
export function googleCalendarUrl(a: Appointment): string {
  const start = new Date(a.scheduledAt);
  const end = new Date(start.getTime() + (a.durationMin || 60) * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: a.title,
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
    details: a.notes || "",
    location: a.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Link para adicionar o compromisso ao Outlook. */
export function outlookCalendarUrl(a: Appointment): string {
  const start = new Date(a.scheduledAt);
  const end = new Date(start.getTime() + (a.durationMin || 60) * 60000);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: a.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: a.notes || "",
    location: a.location || "",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Baixa o arquivo .ics do compromisso (via backend, com autenticação). */
export async function downloadIcs(id: string) {
  const response = await api.get(`/appointments/${id}/ics`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `compromisso-${id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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
