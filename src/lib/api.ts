import axios from "axios";

const API_PADRAO = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/** Só aceita backend nosso (Railway ou domínio Kayser) vindo do repassador. */
export function apiConfiavel(u?: string | null): string | null {
  return u && /^https:\/\/[a-z0-9.-]+\.(up\.railway\.app|kayserone\.com\.br)\/api\/v1$/.test(u) ? u : null;
}

/**
 * Marca própria (Fase 1 = uma instalação por imobiliária): cada subdomínio
 * (imobx.kayserone.com.br) aponta pro backend daquela imobiliária. A lista de clientes
 * fica no REPASSADOR do Cloudflare (Worker "kayser-subdominios"), que injeta o endereço
 * na página (window.__KAYSER_API__) e no header x-kayser-api. Sem isso = backend da Kayser.
 * (Fallback antigo: env NEXT_PUBLIC_CLIENTES do Vercel.)
 */
export function apiDoHost(host?: string | null, apiRepassada?: string | null): string {
  const doRepassador = apiConfiavel(apiRepassada);
  if (doRepassador) return doRepassador;
  let mapa: Record<string, string> = {};
  try {
    mapa = JSON.parse(process.env.NEXT_PUBLIC_CLIENTES || "{}");
  } catch {}
  const sub = (host || "").toLowerCase().split(":")[0].match(/^([a-z0-9-]+)\.kayserone\.com\.br$/)?.[1];
  return (sub && sub !== "www" && mapa[sub]) || API_PADRAO;
}

export const API_URL =
  typeof window !== "undefined"
    ? apiDoHost(window.location.hostname, (window as unknown as { __KAYSER_API__?: string }).__KAYSER_API__)
    : API_PADRAO;

export const TOKEN_KEY = "kayser-token";
export const USER_KEY = "kayser-user";

export const api = axios.create({
  baseURL: API_URL,
});

// Injeta o token JWT em toda requisição
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Em 401, limpa a sessão e manda para o login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      !window.location.pathname.startsWith("/login")
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = "Algo deu errado."): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") return msg;
  }
  return fallback;
}
