"use client";

import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesChart, ConversionChart } from "@/components/dashboard/sales-chart";
import { formatDate } from "@/lib/utils";
import {
  useDashboardMetrics,
  useMonthlyData,
  useRanking,
  useRecentLeads,
} from "@/hooks/use-dashboard";
import type { DashboardMetrics } from "@/types";

const statusLabels: Record<string, string> = {
  novo_lead: "Novo Lead",
  primeiro_contato: "Primeiro Contato",
  em_atendimento: "Em Atendimento",
  documentacao: "Documentação",
  agendamento: "Agendamento",
  visita_agendada: "Visita Agendada",
  visita_realizada: "Visita Realizada",
  simulacao: "Simulação",
  subida_pasta: "Subida de Pasta",
  assinatura: "Assinatura",
  venda_ganha: "Venda Ganha",
  venda_perdida: "Venda Perdida",
};

const statusColors: Record<string, string> = {
  novo_lead: "#6366f1",
  primeiro_contato: "#8b5cf6",
  em_atendimento: "#3b82f6",
  visita_agendada: "#f59e0b",
  simulacao: "#f97316",
  venda_ganha: "#22c55e",
  venda_perdida: "#ef4444",
};

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const { data: metrics } = useDashboardMetrics();
  const { data: monthly } = useMonthlyData();
  const { data: ranking } = useRanking();
  const { data: recentLeads } = useRecentLeads();

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
          <ConversionChart />
        </div>

        {/* Recent Leads */}
        <div
          className="rounded-2xl border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                Leads Recentes
              </h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Últimas captações do sistema
              </p>
            </div>
            <a href="/leads" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
              Ver todos →
            </a>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {(recentLeads ?? []).map((lead) => (
              <div key={lead.id} className="flex items-center gap-4 p-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: "var(--foreground)" }}>
                    {lead.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {lead.empreendimento || "—"} • {lead.responsavel?.name || "Sem responsável"}
                  </div>
                </div>
                <div className="hidden sm:block text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {formatDate(lead.createdAt)}
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                  style={{
                    background: `${statusColors[lead.status] || "#6366f1"}18`,
                    color: statusColors[lead.status] || "#6366f1",
                  }}
                >
                  {statusLabels[lead.status]}
                </span>
              </div>
            ))}
            {(recentLeads ?? []).length === 0 && (
              <div className="py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                Nenhum lead ainda. Importe uma planilha ou cadastre o primeiro lead.
              </div>
            )}
          </div>
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
