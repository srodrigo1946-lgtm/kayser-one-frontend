"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Ranking = {
  mes: string;
  ano: string;
  linhas: { userId: string; nome: string; mes: number; ano: number }[];
  porMes: number[];
  corretores: { hoje: number; mes: number; ano: number };
};

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Ranking de check-in no plantão (só Diretor): corretores com check-in hoje/mês/ano, gráfico e ranking. */
export function RankingCheckin() {
  const { data: r } = useQuery({
    queryKey: ["plantao", "ranking"],
    refetchInterval: 120_000,
    queryFn: async () => (await api.get<Ranking>("/plantao/ranking")).data,
  });
  if (!r) return null;
  const mesAtual = Number(r.mes.slice(5, 7)) - 1;
  const max = Math.max(1, ...r.porMes);
  const caixa = (n: number, rot: string) => (
    <div className="rounded-xl py-2 text-center" style={{ background: "var(--secondary)" }}>
      <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{n}</div>
      <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{rot}</div>
    </div>
  );
  return (
    <div className="rounded-2xl border p-4 mt-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>🏆 Ranking de check-in no plantão</div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <div className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Corretores que fizeram check-in</div>
            <div className="grid grid-cols-3 gap-2">
              {caixa(r.corretores.hoje, "hoje")}
              {caixa(r.corretores.mes, MESES[mesAtual])}
              {caixa(r.corretores.ano, `ano ${r.ano}`)}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Check-ins por mês ({r.ano})</div>
            <div className="flex items-end gap-1 h-28">
              {r.porMes.map((n, m) => (
                <div key={m} title={`${MESES[m]}: ${n} check-in(s)`} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{n || ""}</span>
                  <div className="w-full rounded-t-md" style={{ height: `${(n / max) * 100}%`, minHeight: n ? 4 : 1, background: m === mesAtual ? "var(--primary)" : "#3b82f6aa" }} />
                  <span className="text-[10px]" style={{ color: m === mesAtual ? "var(--foreground)" : "var(--muted-foreground)" }}>{MESES[m]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          {r.linhas.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum check-in neste ano.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-left" style={{ color: "var(--muted-foreground)" }}>
                  <th className="py-1.5 pr-2">#</th>
                  <th className="py-1.5 pr-2">Corretor</th>
                  <th className="py-1.5 pr-2 text-right">{MESES[mesAtual]}</th>
                  <th className="py-1.5 text-right">Ano</th>
                </tr>
              </thead>
              <tbody>
                {r.linhas.map((l, i) => (
                  <tr key={l.userId} className="border-t" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                    <td className="py-1.5 pr-2 font-semibold">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`}</td>
                    <td className="py-1.5 pr-2">{l.nome}</td>
                    <td className="py-1.5 pr-2 text-right font-semibold">{l.mes}</td>
                    <td className="py-1.5 text-right">{l.ano}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
