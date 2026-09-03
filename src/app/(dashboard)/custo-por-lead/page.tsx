"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { DollarSign, Users, Target, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { useMonthlyData, useVgv } from "@/hooks/use-dashboard";
import { useInvestimento, useSetInvestimento } from "@/hooks/use-investimento";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function CustoPorLeadPage() {
  const isDiretor = getStoredUser()?.role === "diretor";
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // abre no mês vigente

  const { data: monthly = [] } = useMonthlyData(year);
  const { data: vgv } = useVgv(year, month || undefined);
  const { data: invest } = useInvestimento(year, month || undefined);
  const setInvest = useSetInvestimento();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [valorInput, setValorInput] = useState("");
  const [feedback, setFeedback] = useState("");
  useEffect(() => setValorInput(invest?.valor ? String(invest.valor) : ""), [invest?.valor, month, year]);

  const periodo = month ? MESES[month - 1] : `${year}`;
  const soma = (campo: "leads" | "vendas") =>
    month ? ((monthly[month - 1] as any)?.[campo] ?? 0) : monthly.reduce((a, m: any) => a + (m[campo] ?? 0), 0);

  const investimento = invest?.valor ?? 0;
  const leads = soma("leads");
  const vendas = soma("vendas");
  const vgvTotal = vgv?.total ?? 0;

  const custoLead = leads > 0 ? investimento / leads : 0;
  const custoVenda = vendas > 0 ? investimento / vendas : 0;
  const ticket = vendas > 0 ? vgvTotal / vendas : 0;
  const roi = investimento > 0 ? ((vgvTotal - investimento) / investimento) * 100 : null;

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
          <Card icon={<Users size={20} />} titulo="Leads" valor={leads} sub="no período" cor="#3b82f6" />
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
      </div>
    </div>
  );
}
