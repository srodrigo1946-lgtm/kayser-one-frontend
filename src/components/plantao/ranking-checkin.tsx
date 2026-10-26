"use client";

import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

type Dia = { data: string; per: "manha" | "tarde" | "noite"; turno: string | null; stand: string | null; hora: string; saiu: boolean };
const NOME_TURNO = { manha: "Manhã", tarde: "Tarde", noite: "Noite" } as const;
const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * Presença do corretor no mês: cada dia tem 3 faixas (manhã, tarde, noite) que acendem na
 * cor do turno em que ele fez check-in. Passar o mouse no dia mostra stand e hora.
 */
function DiasDoCorretor({ userId, nome, ano, mesInicial }: { userId: string; nome: string; ano: string; mesInicial: number }) {
  const [mes, setMes] = useState(mesInicial);
  const { data: dias, isLoading } = useQuery({
    queryKey: ["plantao", "dias", userId, ano],
    queryFn: async () => (await api.get<Dia[]>(`/plantao/ranking/${userId}/dias`, { params: { ano } })).data,
  });
  const doMes = (dias ?? []).filter((d) => Number(d.data.slice(5, 7)) - 1 === mes);
  const porDia = new Map<number, Dia[]>();
  doMes.forEach((d) => porDia.set(Number(d.data.slice(8, 10)), [...(porDia.get(Number(d.data.slice(8, 10))) ?? []), d]));
  const primeiro = new Date(Number(ano), mes, 1).getDay();
  const total = new Date(Number(ano), mes + 1, 0).getDate();
  const celulas = Array.from({ length: primeiro + total }, (_, i) => (i < primeiro ? null : i - primeiro + 1));
  const ultimo = doMes[doMes.length - 1];

  return (
    <div className="py-3 px-1">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="text-sm" style={{ color: "var(--foreground)" }}>
          <b>{porDia.size}</b> dia(s) de plantão em {MESES_LONGOS[mes]}
          {ultimo && (
            <span style={{ color: "var(--muted-foreground)" }}>
              {" "}— último em {ultimo.data.slice(8, 10)}/{ultimo.data.slice(5, 7)} às {ultimo.hora}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button aria-label="Mês anterior" disabled={mes === 0} onClick={() => setMes(mes - 1)} className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs w-20 text-center capitalize" style={{ color: "var(--foreground)" }}>{MESES_LONGOS[mes]}</span>
          <button aria-label="Próximo mês" disabled={mes === 11} onClick={() => setMes(mes + 1)} className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Carregando os dias de {nome}…</p>
      ) : (
        <div className="grid grid-cols-7 gap-1 max-w-md">
          {SEMANA.map((s, i) => (
            <div key={i} className="text-[10px] text-center" style={{ color: "var(--muted-foreground)" }}>{s}</div>
          ))}
          {celulas.map((dia, i) => {
            const cks = dia ? porDia.get(dia) ?? [] : [];
            const tem = (p: Dia["per"]) => cks.some((c) => c.per === p);
            return (
              <div
                key={i}
                tabIndex={cks.length ? 0 : -1}
                className={`group relative rounded-md p-1 outline-none ${dia ? "" : "invisible"}`}
                style={{ background: cks.length ? "var(--secondary)" : "transparent", border: "1px solid var(--border)" }}
              >
                <div className="text-[10px] leading-none mb-1" style={{ color: cks.length ? "var(--foreground)" : "var(--muted-foreground)" }}>{dia}</div>
                <div className="flex flex-col gap-[2px]">
                  {(["manha", "tarde", "noite"] as const).map((p) => (
                    <div key={p} className="h-1.5 rounded-full" style={{ background: tem(p) ? COR[p] : "var(--border)", opacity: tem(p) ? 1 : 0.35 }} />
                  ))}
                </div>
                {cks.length > 0 && (
                  <div
                    className="hidden group-hover:block group-focus:block absolute z-30 left-1/2 -translate-x-1/2 top-full mt-1 w-56 p-2 rounded-xl border shadow-xl text-left"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <div className="text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                      {String(dia).padStart(2, "0")}/{String(mes + 1).padStart(2, "0")}/{ano}
                    </div>
                    {cks.map((c, j) => (
                      <div key={j} className="text-[11px] flex items-start gap-1.5 py-0.5" style={{ color: "var(--muted-foreground)" }}>
                        <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: COR[c.per] }} />
                        <span>
                          <b style={{ color: "var(--foreground)" }}>{NOME_TURNO[c.per]}{c.turno ? ` (${c.turno})` : ""}</b> — check-in às {c.hora}
                          {c.stand ? ` no ${c.stand}` : ""}
                          {c.saiu ? " · saiu do stand" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  const [aberto, setAberto] = useState<string | null>(null); // corretor com o calendário aberto
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
        <div className="text-xs" style={muted}>Cada dia com check-in conta 1 dia de plantão, mesmo que o corretor tenha feito manhã, tarde e noite. Clique no corretor para ver os dias.</div>
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
            <div className="max-h-[36rem] overflow-y-auto">
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
                    const abre = aberto === l.userId;
                    return (
                      <Fragment key={l.userId}>
                      <tr
                        className="border-t cursor-pointer transition-colors"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)", background: abre ? "var(--secondary)" : undefined }}
                        onClick={() => setAberto(abre ? null : l.userId)}
                      >
                        <td className="py-2 pr-2 font-semibold">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`}</td>
                        <td className="py-2 pr-2 truncate max-w-[14rem]">
                          <button
                            aria-expanded={abre}
                            className="text-left hover:underline underline-offset-2"
                            title="Ver os dias de check-in"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAberto(abre ? null : l.userId);
                            }}
                          >
                            {l.nome} <span className="text-[10px]" style={muted}>{abre ? "▲" : "▼"}</span>
                          </button>
                        </td>
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
                      {abre && (
                        <tr style={{ background: "var(--secondary)" }}>
                          <td colSpan={5} className="px-2">
                            <DiasDoCorretor userId={l.userId} nome={l.nome} ano={r.ano} mesInicial={m} />
                          </td>
                        </tr>
                      )}
                      </Fragment>
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
