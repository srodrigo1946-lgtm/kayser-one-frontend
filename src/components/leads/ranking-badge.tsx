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
