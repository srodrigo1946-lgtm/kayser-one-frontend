"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Ranking = {
  mes: string;
  ano: string;
  linhas: { userId: string; nome: string; mes: number; ano: number; manha: number; tarde: number; noite: number }[];
  porMes: number[];
  corretores: { hoje: number; mes: number; ano: number };
  turnosHoje: { manha: number; tarde: number; noite: number };
};

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const COR = { manha: "#f59e0b", tarde: "#3b82f6", noite: "#8b5cf6" };

/**
 * Ranking de check-in no plantão (só Diretor). Conta 1 dia por corretor por dia; os turnos
 * (manhã/tarde/noite) aparecem numa barrinha por corretor.
 */
export function RankingCheckin() {
  const { data: r } = useQuery({
    queryKey: ["plantao", "ranking"],
    refetchInterval: 120_000,
    queryFn: async () => (await api.get<Ranking>("/plantao/ranking")).data,
  });
  if (!r) return null;
  const m = Number(r.mes.slice(5, 7)) - 1;
  const max = Math.max(1, ...r.porMes);
  const maxTurnos = Math.max(1, ...r.linhas.map((l) => l.manha + l.tarde + l.noite));
  const muted = { color: "var(--muted-foreground)" };

  const cartao = (titulo: string, n: number, rodape?: React.ReactNode) => (
    <div className="rounded-xl p-3" style={{ background: "var(--secondary)" }}>
      <div className="text-xs" style={muted}>{titulo}</div>
      <div className="text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>{n}</div>
      <div className="text-[11px]" style={muted}>{rodape ?? "corretores com check-in"}</div>
    </div>
  );
  const ponto = (cor: string) => <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: cor }} />;

  return (
    <div className="rounded-2xl border p-4 mt-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="mb-3">
        <div className="font-semibold" style={{ color: "var(--foreground)" }}>🏆 Ranking de check-in no plantão</div>
        <div className="text-xs" style={muted}>Cada dia com check-in conta 1 dia de plantão, mesmo que o corretor tenha feito manhã, tarde e noite.</div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {cartao(
              "Hoje",
              r.corretores.hoje,
              <span>
                {ponto(COR.manha)}{r.turnosHoje.manha} {ponto(COR.tarde)}{r.turnosHoje.tarde} {ponto(COR.noite)}{r.turnosHoje.noite}
              </span>
            )}
            {cartao(`Em ${MESES_LONGOS[m]}`, r.corretores.mes)}
            {cartao(`Em ${r.ano}`, r.corretores.ano)}
          </div>
          <div>
            <div className="text-xs mb-1.5" style={muted}>Dias de plantão por mês em {r.ano} (somando os corretores)</div>
            <div className="flex items-end gap-1 h-24">
              {r.porMes.map((n, i) => (
                <div key={i} title={`${MESES_LONGOS[i]}: ${n} dia(s) de plantão`} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <span className="text-[10px]" style={muted}>{n || ""}</span>
                  <div className="w-full rounded-t-md" style={{ height: `${(n / max) * 100}%`, minHeight: n ? 4 : 1, background: i === m ? "var(--primary)" : "#3b82f6aa" }} />
                  <span className="text-[10px]" style={{ color: i === m ? "var(--foreground)" : "var(--muted-foreground)" }}>{MESES[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-end gap-3 text-[11px] mb-1" style={muted}>
            <span>Turnos em {MESES_LONGOS[m]}:</span>
            <span>{ponto(COR.manha)}manhã</span>
            <span>{ponto(COR.tarde)}tarde</span>
            <span>{ponto(COR.noite)}noite</span>
          </div>
          {r.linhas.length === 0 ? (
            <p className="text-sm" style={muted}>Nenhum check-in neste ano.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0" style={{ background: "var(--card)" }}>
                  <tr className="text-xs text-left" style={muted}>
                    <th className="py-1.5 pr-2 w-8">#</th>
                    <th className="py-1.5 pr-2">Corretor</th>
                    <th className="py-1.5 pr-3 text-right whitespace-nowrap">Dias em {MESES[m].toLowerCase()}.</th>
                    <th className="py-1.5 pr-3 w-[34%]">Turnos</th>
                    <th className="py-1.5 text-right whitespace-nowrap">Dias em {r.ano}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.linhas.map((l, i) => {
                    const total = l.manha + l.tarde + l.noite;
                    return (
                      <tr key={l.userId} className="border-t" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                        <td className="py-2 pr-2 font-semibold">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`}</td>
                        <td className="py-2 pr-2 truncate max-w-[14rem]">{l.nome}</td>
                        <td className="py-2 pr-3 text-right text-base font-bold">{l.mes}</td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-2.5 rounded-full overflow-hidden" style={{ width: `${(total / maxTurnos) * 100}%`, minWidth: total ? 6 : 0, background: "var(--secondary)" }}>
                              {(["manha", "tarde", "noite"] as const).map((k) =>
                                l[k] ? <div key={k} style={{ width: `${(l[k] / total) * 100}%`, background: COR[k] }} title={`${k === "manha" ? "Manhã" : k === "tarde" ? "Tarde" : "Noite"}: ${l[k]}`} /> : null
                              )}
                            </div>
                            <span className="text-[11px] whitespace-nowrap" style={muted}>
                              {l.manha} · {l.tarde} · {l.noite}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 text-right" style={muted}>{l.ano}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
