"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";

type Mes = { mes: number; ativos: number; novos: number; encerrados: number; receita: number; caixa: number; custo: number; lucro: number; futuro: boolean };
type Painel = {
  ano: number;
  meses: Mes[];
  total: { ativos: number; novos: number; encerrados: number; receita: number; caixa: number; custo: number; lucro: number };
  premissas: { servidorPorCliente: number; iaPorUsuario: number; ionePorUsuario: number; fixoMensal: number };
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n % 1 ? 2 : 0 });
const VERDE = "#22c55e";
const VERMELHO = "#ef4444";
const CINZA = "#71717a";

/**
 * Painel do Business K1 (venda do Kayser One): evolução de clientes, receita, caixa e lucro
 * mês a mês, consolidado no ano. Caixa = o que o Mercado Pago confirmou (líquido de taxa).
 */
export function PainelBusiness() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [p, setP] = useState<Painel | null>(null);

  useEffect(() => {
    setP(null);
    api.get<Painel>(`/clientes-saas/painel?ano=${ano}`).then((r) => setP(r.data)).catch(() => setP(null));
  }, [ano]);

  const fraco = { color: "var(--muted-foreground)" };
  const caixa = { background: "var(--card)", borderColor: "var(--border)" };
  const corLucro = (n: number) => (n > 0 ? VERDE : n < 0 ? VERMELHO : "var(--muted-foreground)");
  const dados = (p?.meses ?? []).map((m) => ({ ...m, nome: MESES[m.mes - 1] }));
  const passados = dados.filter((m) => !m.futuro);
  const atual = passados.at(-1);

  const numeros: { rotulo: string; valor: string; cor?: string; ajuda: string }[] = p
    ? [
        { rotulo: "Clientes ativos", valor: String(p.total.ativos), ajuda: `${p.total.novos} novos e ${p.total.encerrados} encerrados no ano` },
        { rotulo: "Receita mensal", valor: brl(atual?.receita ?? 0), ajuda: "contratada no mês atual" },
        { rotulo: "Caixa no ano", valor: brl(p.total.caixa), ajuda: "o que entrou de verdade" },
        { rotulo: "Custo no ano", valor: brl(p.total.custo), ajuda: "servidores, IA e fixos" },
        { rotulo: "Lucro no ano", valor: brl(p.total.lucro), cor: corLucro(p.total.lucro), ajuda: "caixa menos custo" },
      ]
    : [];

  const dica = {
    contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 },
    labelStyle: { color: "var(--foreground)", fontWeight: 600 },
  };

  return (
    <section className="space-y-4" aria-label="Painel do Business K1">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Resultado de {ano}
        </h2>
        <div className="flex items-center gap-1 rounded-xl border px-1 py-1" style={caixa}>
          <button onClick={() => setAno(ano - 1)} aria-label="Ano anterior" className="p-1.5 rounded-lg hover:opacity-80" style={{ color: "var(--foreground)" }}>
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-sm font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>{ano}</span>
          <button onClick={() => setAno(ano + 1)} disabled={ano >= new Date().getFullYear()} aria-label="Próximo ano" className="p-1.5 rounded-lg hover:opacity-80 disabled:opacity-30" style={{ color: "var(--foreground)" }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!p ? (
        <div className="rounded-2xl border p-8 text-sm text-center" style={{ ...caixa, ...fraco }}>Carregando o painel…</div>
      ) : (
        <>
          {/* Números do ano: uma faixa só, separada por divisórias. */}
          <div className="rounded-2xl border grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x" style={{ ...caixa, ["--tw-divide-opacity" as any]: 1 }}>
            {numeros.map((n) => (
              <div key={n.rotulo} className="px-5 py-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs" style={fraco}>{n.rotulo}</div>
                <div className="text-2xl font-bold tabular-nums mt-1" style={{ color: n.cor ?? "var(--foreground)" }}>{n.valor}</div>
                <div className="text-[11px] mt-0.5" style={fraco}>{n.ajuda}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-2xl border p-4 lg:col-span-3" style={caixa}>
              <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Caixa, custo e lucro por mês</div>
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="nome" tick={{ fontSize: 11, fill: CINZA }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: CINZA }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => brl(v)} />
                    <Tooltip {...dica} formatter={(v: number, nome: string) => [brl(v), nome]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="caixa" name="Caixa" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="custo" name="Custo" fill={CINZA} radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Line dataKey="lucro" name="Lucro" stroke={VERDE} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border p-4 lg:col-span-2" style={caixa}>
              <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Clientes por mês</div>
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="nome" tick={{ fontSize: 11, fill: CINZA }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CINZA }} axisLine={false} tickLine={false} />
                    <Tooltip {...dica} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="ativos" name="Ativos" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="novos" name="Novos" fill={VERDE} radius={[4, 4, 0, 0]} maxBarSize={10} />
                    <Bar dataKey="encerrados" name="Encerrados" fill={VERMELHO} radius={[4, 4, 0, 0]} maxBarSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Consolidado: os meses e o total do ano. */}
          <div className="rounded-2xl border overflow-x-auto" style={caixa}>
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-xs text-right" style={fraco}>
                  <th className="text-left font-medium px-4 py-3">Mês</th>
                  <th className="font-medium px-3">Ativos</th>
                  <th className="font-medium px-3">Novos</th>
                  <th className="font-medium px-3">Encerrados</th>
                  <th className="font-medium px-3">Receita</th>
                  <th className="font-medium px-3">Caixa</th>
                  <th className="font-medium px-3">Custo</th>
                  <th className="font-medium px-4">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {passados.map((m) => (
                  <tr key={m.mes} className="border-t text-right" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                    <td className="text-left px-4 py-2.5 capitalize">{m.nome}</td>
                    <td className="px-3">{m.ativos}</td>
                    <td className="px-3" style={{ color: m.novos ? VERDE : undefined }}>{m.novos || "–"}</td>
                    <td className="px-3" style={{ color: m.encerrados ? VERMELHO : undefined }}>{m.encerrados || "–"}</td>
                    <td className="px-3">{brl(m.receita)}</td>
                    <td className="px-3">{brl(m.caixa)}</td>
                    <td className="px-3" style={fraco}>{brl(m.custo)}</td>
                    <td className="px-4 font-semibold" style={{ color: corLucro(m.lucro) }}>{brl(m.lucro)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 text-right font-bold" style={{ borderColor: "var(--primary)", color: "var(--foreground)" }}>
                  <td className="text-left px-4 py-3">Ano {p.ano}</td>
                  <td className="px-3">{p.total.ativos}</td>
                  <td className="px-3">{p.total.novos}</td>
                  <td className="px-3">{p.total.encerrados}</td>
                  <td className="px-3">{brl(p.total.receita)}</td>
                  <td className="px-3">{brl(p.total.caixa)}</td>
                  <td className="px-3">{brl(p.total.custo)}</td>
                  <td className="px-4" style={{ color: corLucro(p.total.lucro) }}>{brl(p.total.lucro)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs" style={fraco}>
            Caixa: pagamentos confirmados pelo Mercado Pago, já sem a taxa. Custo estimado (planilha do John): servidor de {brl(p.premissas.servidorPorCliente)} por cliente, IA de{" "}
            {brl(p.premissas.iaPorUsuario)} por usuário quando ligada e {brl(p.premissas.fixoMensal)} fixos por mês.
          </p>
        </>
      )}
    </section>
  );
}
