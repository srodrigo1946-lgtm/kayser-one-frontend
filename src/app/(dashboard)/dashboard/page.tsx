"use client";

import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesChart, ConversionChart } from "@/components/dashboard/sales-chart";
import {
  useDashboardMetrics,
  useMonthlyData,
  useRanking,
} from "@/hooks/use-dashboard";
import { useKanbanBoard } from "@/hooks/use-kanban";
import type { DashboardMetrics } from "@/types";

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const { data: metrics } = useDashboardMetrics();
  const { data: monthly } = useMonthlyData();
  const { data: ranking } = useRanking();
  const { data: board } = useKanbanBoard();

  // Funil segue as colunas do Kanban (contagem real de leads por etapa)
  const funnel = (board ?? []).map((col) => ({
    label: col.title,
    value: col.leads?.length ?? 0,
    color: col.color,
  }));

  // Adapta a resposta do backend para o formato esperado pelos StatsCards
  const statsMetrics: DashboardMetrics = {
    leadsHoje: metrics?.leadsHoje ?? 0,
    leadsSemana: metrics?.leadsSemana ?? 0,
    leadsMes: metrics?.leadsMes ?? 0,
    visitas: metrics?.visitas ?? 0,
    vendas: metrics?.vendas ?? 0,
    conversao: metrics?.conversao ?? 0,
    tempoMedioAtendimento: 0,
    leadsSemAtendimento: metrics?.semAtendimento ?? 0,
    clientesSemContato: metrics?.semContato ?? 0,
  };

  return (
    <div>
      <Header title="Dashboard" subtitle={`Hoje é ${today}`} />

      <div className="p-6 space-y-6">
        <StatsCards metrics={statsMetrics} />

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SalesChart data={monthly ?? []} />
          </div>
          <ConversionChart data={funnel} />
        </div>

        {/* Ranking */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            🏆 Ranking de Corretores
          </h3>
          <div className="space-y-3">
            {(ranking ?? []).map((c, i) => {
              const vendas = Number(c.vendas) || 0;
              const leads = Number(c.leads) || 0;
              const pct = leads > 0 ? Math.min((vendas / leads) * 100, 100) : 0;
              return (
                <div key={c.responsavelId ?? i} className="flex items-center gap-4">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#cd7c3f",
                      color: "white",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {c.nome || "Sem responsável"}
                      </span>
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {vendas} venda(s) / {leads} lead(s)
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: i === 0 ? "#f59e0b" : "var(--primary)" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {(ranking ?? []).length === 0 && (
              <div className="py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                Sem dados de ranking ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
