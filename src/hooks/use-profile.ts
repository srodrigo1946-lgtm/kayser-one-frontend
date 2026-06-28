"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, USER_KEY } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type { User } from "@/types";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; phone?: string; whatsapp?: string; avatar?: string }) => {
      const { data } = await api.put<User>("/users/me", payload);
      return data;
    },
    onSuccess: (user) => {
      // Mantém o usuário em cache (localStorage) sincronizado para a sidebar/header.
      const current = getStoredUser();
      localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...user }));
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
