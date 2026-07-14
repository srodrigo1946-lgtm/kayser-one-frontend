"use client";

import { Header } from "@/components/layout/header";
import { SalesChart, ConversionChart } from "@/components/dashboard/sales-chart";
import { TrendingUp, Download } from "lucide-react";
import {
  useDashboardMetrics,
  useRanking,
} from "@/hooks/use-dashboard";
import { useKanbanBoard } from "@/hooks/use-kanban";

const roleLabels: Record<string, string> = {
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
  diretor: "Diretor",
};

export default function RelatoriosPage() {
  const { data: metrics } = useDashboardMetrics();
  const { data: ranking } = useRanking();
  const { data: board } = useKanbanBoard();

  // Funil segue as colunas do Kanban (contagem real de leads por etapa)
  const funnel = (board ?? []).map((col) => ({
    label: col.title,
    value: col.leads?.length ?? 0,
    color: col.color,
  }));

  const cards = [
    { label: "Leads no Mês", value: metrics?.leadsMes ?? 0, color: "#3b82f6" },
    { label: "Visitas", value: metrics?.visitas ?? 0, color: "#10b981" },
    { label: "Vendas", value: metrics?.vendas ?? 0, color: "#f59e0b" },
    { label: "Conversão", value: `${(metrics?.conversao ?? 0).toFixed(1)}%`, color: "#8b5cf6" },
  ];

  return (
    <div>
      <Header title="Relatórios" subtitle="Análise completa do desempenho comercial" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
        <div className="grid lg:grid-cols-4 gap-4">
          {cards.map((m) => (
            <div key={m.label} className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="text-2xl font-bold mb-1" style={{ color: m.color }}>{m.value}</div>
              <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <SalesChart />
          <ConversionChart data={funnel} />
        </div>

        <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Desempenho por Corretor</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Corretor", "Leads", "Vendas", "Conversão"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(ranking ?? []).map((r, i) => {
                  const vendas = Number(r.vendas) || 0;
                  const leads = Number(r.leads) || 0;
                  const conv = leads > 0 ? ((vendas / leads) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={r.responsavelId ?? i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {r.nome || "Sem responsável"}
                        {r.role && (
                          <span className="ml-2 text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>
                            · {roleLabels[r.role] || r.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{leads}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{vendas}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#22c55e" }}>
                        <TrendingUp size={11} className="inline mr-1" />{conv}%
                      </td>
                    </tr>
                  );
                })}
                {(ranking ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Sem dados ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
