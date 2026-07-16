"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import { Bot, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesChart, ConversionChart } from "@/components/dashboard/sales-chart";
import {
  useDashboardMetrics,
  useRanking,
  useFollowups,
} from "@/hooks/use-dashboard";
import { useKanbanBoard } from "@/hooks/use-kanban";
import type { DashboardMetrics } from "@/types";

const roleLabels: Record<string, string> = {
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
  diretor: "Diretor",
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function DashboardPage() {
  const router = useRouter();
  // Empresa parceira não tem dashboard — mandamos direto para a área de análise.
  useEffect(() => {
    if ((getStoredUser() as any)?.empresaId) router.replace("/pastas");
  }, [router]);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const currentYear = new Date().getFullYear();
  const [fuYear, setFuYear] = useState(currentYear);
  const [fuMonth, setFuMonth] = useState(0); // 0 = ano todo consolidado

  const { data: metrics } = useDashboardMetrics();
  const { data: ranking } = useRanking();
  const { data: followups } = useFollowups(fuYear, fuMonth || undefined);
  const { data: board } = useKanbanBoard();

  const fuPeriodo = fuMonth ? MESES[fuMonth - 1] : `${fuYear}`;

  const abrirConversa = (f: { leadId: string; phone: string }) => {
    const params = new URLSearchParams();
    if (f.leadId) params.set("lead", f.leadId);
    if (f.phone) params.set("phone", f.phone);
    router.push(`/whatsapp?${params.toString()}`);
  };

  const quando = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;
    const dias = Math.floor(h / 24);
    if (dias === 1) return "ontem";
    if (dias < 7) return `há ${dias} dias`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

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
        <StatsCards
          metrics={statsMetrics}
          followupsTotal={followups?.total}
          followupsPeriodo={fuPeriodo}
        />

        {/* Follow-ups automáticos da IA — clique para abrir a conversa */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Bot size={18} style={{ color: "#a855f7" }} /> Follow-ups automáticos da IA
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {followups?.total ?? 0} no período · clique para abrir a conversa
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={fuMonth}
                onChange={(e) => setFuMonth(Number(e.target.value))}
                className="text-sm px-3 py-1.5 rounded-lg border outline-none"
                style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value={0}>Ano todo</option>
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={fuYear}
                onChange={(e) => setFuYear(Number(e.target.value))}
                className="text-sm px-3 py-1.5 rounded-lg border outline-none"
                style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                {Array.from({ length: 3 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            {(followups?.items ?? []).map((f) => (
              <button
                key={f.id}
                onClick={() => abrirConversa(f)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors hover:opacity-90"
                style={{ background: "var(--secondary)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#a855f722", color: "#a855f7" }}
                >
                  <Bot size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                    {f.nome || "Lead sem nome"}
                  </div>
                  <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                    {f.phone || "sem telefone"}
                  </div>
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                  {quando(f.at)}
                </span>
                <MessageCircle size={16} style={{ color: "#25d366" }} />
              </button>
            ))}
            {(followups?.items ?? []).length === 0 && (
              <div className="py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                Nenhum follow-up da IA em {fuPeriodo}.
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          <ConversionChart data={funnel} />
        </div>

        {/* Ranking */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
              🏆 Ranking de Corretores
            </h3>
            <a href="/ranking" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
              Ver pódio →
            </a>
          </div>
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
                      <span className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                        {c.nome || "Sem responsável"}
                        {c.role && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
                          >
                            {roleLabels[c.role] || c.role}
                          </span>
                        )}
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
