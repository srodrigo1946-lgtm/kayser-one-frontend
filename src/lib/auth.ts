"use client";

import { api, TOKEN_KEY, USER_KEY } from "./api";
import type { User } from "@/types";

interface LoginResponse {
  accessToken: string;
  user: User;
  firstLogin: boolean;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  managerId: string;
}

export interface RegisterResult {
  pending?: boolean;
  message?: string;
}

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  // O cadastro fica pendente de aprovação do gestor — não retorna token.
  const { data } = await api.post<RegisterResult>("/auth/register", payload);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.put("/auth/change-password", { currentPassword, newPassword });
  // Após trocar a senha, atualiza o usuário em cache (firstLogin = false)
  const user = getStoredUser();
  if (user) {
    user.firstLogin = false;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "/login";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
