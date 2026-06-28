"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types";

export interface Goal {
  id: string;
  userId: string;
  user?: User;
  month: number;
  year: number;
  targetSales: number;
  targetVisits: number;
}

export interface GoalProgress {
  goal: Goal;
  achievedSales: number;
  achievedVisits: number;
  salesPct: number;
  visitsPct: number;
}

export function useGoalsProgress(month: number, year: number) {
  return useQuery({
    queryKey: ["goals", "progress", month, year],
    queryFn: async () => {
      const { data } = await api.get<GoalProgress[]>("/goals/progress", { params: { month, year } });
      return data;
    },
  });
}

export function useUpsertGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      month: number;
      year: number;
      targetSales?: number;
      targetVisits?: number;
    }) => {
      const { data } = await api.post("/goals", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
