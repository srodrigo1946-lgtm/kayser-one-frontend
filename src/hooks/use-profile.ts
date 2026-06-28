"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_URL, USER_KEY } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type { User } from "@/types";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; phone?: string; whatsapp?: string }) => {
      const { data } = await api.put<User>("/users/me", payload);
      return data;
    },
    onSuccess: (user) => {
      const current = getStoredUser();
      localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...user }));
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<User>("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (user) => {
      const current = getStoredUser();
      // marca que há avatar para a sidebar/perfil exibirem a imagem
      localStorage.setItem(USER_KEY, JSON.stringify({ ...current, avatar: (user as any).avatar }));
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/** URL pública da foto de perfil (com cache-bust opcional). */
export function avatarUrl(userId?: string, version?: string | number) {
  if (!userId) return "";
  const v = version ? `?v=${encodeURIComponent(String(version))}` : "";
  return `${API_URL}/users/${userId}/avatar${v}`;
}
