"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface EscalaTurno {
  id: string;
  diaSemana: number; // 0=Dom ... 6=Sáb
  turno: number; // 0,1,2
  horaInicio: string;
  horaFim: string;
  atendenteIds: string[];
}

export function useEscala() {
  return useQuery({
    queryKey: ["escala"],
    queryFn: async () => {
      const { data } = await api.get<EscalaTurno[]>("/escala");
      return data;
    },
  });
}

export function useSetTurno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, atendenteIds }: { id: string; atendenteIds: string[] }) => {
      const { data } = await api.put(`/escala/${id}`, { atendenteIds });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escala"] }),
  });
}
