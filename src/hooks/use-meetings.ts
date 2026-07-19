"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Meeting {
  id: string;
  title: string;
  roomName: string;
  scheduledAt: string;
  durationMin: number;
  notes?: string | null;
  status: string;
  hostId: string;
  participantIds?: string[] | null;
  appointmentId?: string | null;
  link: string;
  createdAt?: string;
}

export function useMeetings() {
  return useQuery({
    queryKey: ["meetings"],
    queryFn: async () => (await api.get<Meeting[]>("/meetings")).data,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      scheduledAt: string;
      durationMin?: number;
      participantIds?: string[];
    }) => (await api.post<Meeting>("/meetings", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/meetings/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useSaveMeetingNotes() {
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) =>
      (await api.put(`/meetings/${id}/notes`, { notes })).data,
  });
}
