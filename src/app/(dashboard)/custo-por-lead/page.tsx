"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { DollarSign, Users, Target, ShoppingBag, TrendingUp, Wallet, Download } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { useBreakdown, useDaily } from "@/hooks/use-dashboard";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useInvestimento, useSetInvestimento } from "@/hooks/use-investimento";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const ROLE_LABEL: Record<string, string> = {
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
};

export default function CustoPorLeadPage() {
  const isDiretor = getStoredUser()?.role === "diretor";
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // abre no mês vigente

  const { data: invest } = useInvestimento(year, month || undefined);
  const setInvest = useSetInvestimento();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  // Detalhamento por cargo (JÁ só leads PAGOS — anúncio/formulário; oferta do corretor não conta).
  const { data: breakdown = [] } = useBreakdown(year, month || undefined);

  const [valorInput, setValorInput] = useState("");
  const [feedback, setFeedback] = useState("");
  useEffect(() => setValorInput(invest?.valor ? String(invest.valor) : ""), [invest?.valor, month, year]);

  const periodo = month ? MESES[month - 1] : `${year}`;

  const investimento = invest?.valor ?? 0;
  // Totais vêm do breakdown = SÓ leads pagos. Custo por lead usa esses.
  const leads = breakdown.reduce((a, b: any) => a + b.leads, 0);
  const vendas = breakdown.reduce((a, b: any) => a + b.vendas, 0);
  const vgvTotal = breakdown.reduce((a, b: any) => a + (b.vgv ?? 0), 0);

  // Série diária (01..fim do mês): leads pagos por dia + gasto médio diário + custo por lead do dia.
  const { data: daily = [] } = useDaily(year, month);
  const diasNoMes = month ? new Date(year, month, 0).getDate() : 0;
  const gastoDia = diasNoMes > 0 ? investimento / diasNoMes : 0;
  const leadsPorDia = new Map(daily.map((d) => [d.dia, d.leads]));
  const serieDiaria = Array.from({ length: diasNoMes }, (_, i) => {
    const dia = i + 1;
    const leadsDia = leadsPorDia.get(dia) ?? 0;
    return {
      dia: String(dia).padStart(2, "0"),
      leads: leadsDia,
      gasto: Math.round(gastoDia),
      custo: leadsDia > 0 ? Math.round(gastoDia / leadsDia) : null,
    };
  });

  const custoLead = leads > 0 ? investimento / leads : 0;
  const custoVenda = vendas > 0 ? investimento / vendas : 0;
  const ticket = vendas > 0 ? vgvTotal / vendas : 0;
  const roi = investimento > 0 ? ((vgvTotal - investimento) / investimento) * 100 : null;

  const linhas = breakdown
    .map((b) => ({
      ...b,
      conversao: b.leads > 0 ? (b.vendas / b.leads) * 100 : 0,
      custo: custoLead * b.leads, // custo por lead global × leads dele
    }))
    .sort((a, b) => b.leads - a.leads);

  const exportarExcel = () => {
    const sep = ";";
    const cab = ["Nome", "Cargo", "Leads recebidos", "Vendas", "Conversao (%)", "Custo dos leads (R$)"];
    const linhasCsv = linhas.map((l) =>
      [l.nome, ROLE_LABEL[l.role] ?? l.role, l.leads, l.vendas, l.conversao.toFixed(1).replace(".", ","), l.custo.toFixed(2).replace(".", ",")].join(sep)
    );
    const resumo = [
      "",
      ["TOTAL", "", leads, vendas, (leads > 0 ? (vendas / leads) * 100 : 0).toFixed(1).replace(".", ","), investimento.toFixed(2).replace(".", ",")].join(sep),
      ["Investimento", brl(investimento)].join(sep),
      ["Custo por lead", leads > 0 ? brl(custoLead) : "-"].join(sep),
    ];
    const csv = "﻿" + [cab.join(sep), ...linhasCsv, ...resumo].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `custo-por-lead-${periodo}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const salvar = async () => {
    if (!month) return;
    setFeedback("");
    try {
      await setInvest.mutateAsync({ ano: year, mes: month, valor: Number(valorInput) || 0 });
      setFeedback("Investimento salvo.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao salvar. Apenas o Diretor pode alterar."));
    }
  };

  const Card = ({ icon, titulo, valor, sub, cor }: any) => (
    <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: `${cor}22`, color: cor }}>
        {icon}
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{valor}</div>
      <div className="text-sm mt-0.5" style={{ color: "var(--foreground)" }}>{titulo}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <Header title="Custo por Lead" subtitle="Investimento em anúncio × resultados" />
      <div className="p-6 space-y-6">
        {/* Período + liberar para o time (Diretor) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {isDiretor ? (
            <button
              onClick={() => updateSettings.mutate({ custoLeadVisivel: !settings?.custoLeadVisivel } as any)}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--card)" }}
            >
              <span
                className="w-9 h-5 rounded-full flex items-center transition-colors px-0.5"
                style={{ background: settings?.custoLeadVisivel ? "var(--primary)" : "var(--border)" }}
              >
                <span className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: settings?.custoLeadVisivel ? "translateX(16px)" : "translateX(0)" }} />
              </span>
              {settings?.custoLeadVisivel ? "Visível para o time" : "Mostrar para o time"}
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
          <span className="text-sm mr-1" style={{ color: "var(--muted-foreground)" }}>Período:</span>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="text-sm px-3 py-1.5 rounded-lg border outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
            <option value={0}>Ano todo</option>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-sm px-3 py-1.5 rounded-lg border outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
            {Array.from({ length: 3 }, (_, i) => currentYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          </div>
        </div>

        {/* Entrada do investimento (Diretor) */}
        <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-semibold text-lg mb-1" style={{ color: "var(--foreground)" }}>Investimento em anúncio · {periodo}</div>
          {month ? (
            <>
              <div className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
                {isDiretor ? "Digite o valor gasto no Facebook Ads neste mês." : "Definido pela direção."}
              </div>
              {isDiretor ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ color: "var(--muted-foreground)" }}>R$</span>
                  <input
                    type="number" value={valorInput} onChange={(e) => setValorInput(e.target.value)}
                    placeholder="0" className="px-3 py-2 rounded-xl border text-sm outline-none w-40"
                    style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                  <button onClick={salvar} disabled={setInvest.isPending} className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: "var(--primary)", color: "white" }}>
                    {setInvest.isPending ? "Salvando…" : "Salvar"}
                  </button>
                  {feedback && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{feedback}</span>}
                </div>
              ) : (
                <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{brl(investimento)}</div>
              )}
            </>
          ) : (
            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Total do ano: <strong style={{ color: "var(--foreground)" }}>{brl(investimento)}</strong>. Escolha um mês para editar.
            </div>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card icon={<Wallet size={20} />} titulo="Investimento" valor={brl(investimento)} sub={periodo} cor="#f59e0b" />
          <Card icon={<Users size={20} />} titulo="Leads" valor={leads} sub="anúncio/formulário" cor="#3b82f6" />
          <Card icon={<Target size={20} />} titulo="Custo por Lead" valor={leads > 0 ? brl(custoLead) : "—"} sub={leads > 0 ? `${leads} leads` : "sem leads no período"} cor="#8b5cf6" />
          <Card icon={<ShoppingBag size={20} />} titulo="Vendas" valor={vendas} sub="fechadas no período" cor="#10b981" />
          <Card icon={<Target size={20} />} titulo="Custo por Venda" valor={vendas > 0 ? brl(custoVenda) : "—"} sub={vendas > 0 ? `${vendas} venda(s)` : "sem vendas no período"} cor="#ef4444" />
          <Card icon={<DollarSign size={20} />} titulo="VGV" valor={brl(vgvTotal)} sub={vendas > 0 ? `ticket ${brl(ticket)}` : "no período"} cor="#22c55e" />
        </div>

        {/* ROI */}
        <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#22c55e22", color: "#22c55e" }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: roi !== null && roi < 0 ? "#ef4444" : "var(--foreground)" }}>
              {roi === null ? "—" : `${roi.toFixed(0)}%`}
            </div>
            <div className="text-sm" style={{ color: "var(--foreground)" }}>Retorno sobre o investimento (ROI)</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {roi === null ? "Informe o investimento para calcular." : `VGV ${brl(vgvTotal)} sobre ${brl(investimento)} investidos`}
            </div>
          </div>
        </div>

        {/* Gráfico diário (01..fim do mês) — gasto × custo por lead */}
        {month ? (
          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="mb-1 font-semibold text-lg" style={{ color: "var(--foreground)" }}>
              Custo por lead — dia a dia · {periodo}
            </div>
            <div className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
              Barras = leads pagos do dia · Linha = custo por lead do dia. Dia com poucos leads = custo alto → hora de ajustar ou pausar o anúncio.
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={serieDiaria} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dia" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis yAxisId="l" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => brl(v)} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--foreground)" }}
                  formatter={(value: any, name: any) =>
                    name === "Leads" ? [value, name] : [value == null ? "—" : brl(Number(value)), name]
                  }
                  labelFormatter={(l) => `Dia ${l}`}
                />
                <Legend />
                <Bar yAxisId="l" dataKey="leads" name="Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Line yAxisId="r" type="monotone" dataKey="custo" name="Custo por lead" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                <Line yAxisId="r" type="monotone" dataKey="gasto" name="Gasto/dia" stroke="#10b981" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs mt-3" style={{ color: "var(--muted-foreground)" }}>
              Gasto médio diário: <strong style={{ color: "var(--foreground)" }}>{brl(gastoDia)}</strong> (investimento do mês ÷ {diasNoMes} dias). Quando o gasto real por dia vier do Facebook (FiqOn), o custo por dia fica exato.
            </p>
          </div>
        ) : null}

        {/* Detalhamento por cargo */}
        <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <div className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Detalhamento por cargo</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Quem recebeu os leads e converteu · {periodo}</div>
            </div>
            <button
              onClick={exportarExcel}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--secondary)" }}
            >
              <Download size={15} /> Exportar Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 640, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--muted-foreground)" }}>
                  <th className="text-left font-medium pb-2 pr-3">Nome</th>
                  <th className="text-left font-medium pb-2 pr-3">Cargo</th>
                  <th className="text-right font-medium pb-2 pr-3">Leads</th>
                  <th className="text-right font-medium pb-2 pr-3">Vendas</th>
                  <th className="text-left font-medium pb-2 pr-3 w-40">Conversão</th>
                  <th className="text-right font-medium pb-2">Custo dos leads</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.responsavelId} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="py-2.5 pr-3" style={{ color: "var(--foreground)" }}>{l.nome}</td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                        {ROLE_LABEL[l.role] ?? l.role}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums" style={{ color: "var(--foreground)" }}>{l.leads}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums" style={{ color: "var(--foreground)" }}>{l.vendas}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(l.conversao, 100)}%`, background: l.conversao > 0 ? "#22c55e" : "transparent" }} />
                        </div>
                        <span className="text-xs tabular-nums w-10 text-right" style={{ color: "var(--muted-foreground)" }}>{l.conversao.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--muted-foreground)" }}>{l.leads > 0 ? brl(l.custo) : "—"}</td>
                  </tr>
                ))}
                {linhas.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center" style={{ color: "var(--muted-foreground)" }}>Sem dados no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--muted-foreground)" }}>
            "Custo dos leads" = custo por lead do período × leads que a pessoa recebeu. Conversão = vendas ÷ leads.
          </p>
        </div>
      </div>
    </div>
  );
}
