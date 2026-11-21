export const RANKINGS = ["Diamante💎", "Ouro🥇", "Prata🥈", "Bronze🥉", "Aço🔘", "Não elegível❌", "Informação não disponível⛔"];

/**
 * Score Serasa (0 a 1000) → ranking do K1. Faixas: 801+ Diamante, 701–800 Ouro,
 * 501–700 Prata, 301–500 Bronze, 0–300 Aço. Vazio/ inválido → "".
 */
export function rankingDoScore(score: string | number): string {
  const n = Number(String(score).replace(/\D/g, ""));
  if (!String(score).trim() || !isFinite(n) || n > 1000) return "";
  const r = n >= 801 ? "Diamante💎" : n >= 701 ? "Ouro🥇" : n >= 501 ? "Prata🥈" : n >= 301 ? "Bronze🥉" : "Aço🔘";
  return `${r} (Serasa ${n})`;
}

/** Copia o CPF e abre o site da Serasa Experian pra consultar. */
export function consultarSerasa(cpf: string) {
  const c = (cpf || "").replace(/\D/g, "");
  if (c && navigator.clipboard) navigator.clipboard.writeText(c).catch(() => {});
  window.open("https://www.serasaexperian.com.br/", "_blank", "noopener");
}

/** Selo do ranking do cliente (vem da planilha): Diamante 💎, Ouro 🥇, Prata 🥈, Bronze 🥉, Aço 🔘… */
export function RankingBadge({ ranking }: { ranking?: string | null }) {
  const r = (ranking || "").trim();
  if (!r) return null;
  const t = r.toLowerCase();
  const cor = t.includes("diamante")
    ? "#38bdf8"
    : t.includes("ouro")
      ? "#eab308"
      : t.includes("prata")
        ? "#94a3b8"
        : t.includes("bronze")
          ? "#c2410c"
          : t.includes("aço") || t.includes("aco")
            ? "#64748b"
            : "#ef4444";
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap" style={{ background: `${cor}22`, color: cor }} title="Ranking do cliente">
      {r}
    </span>
  );
}
