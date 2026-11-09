"use client";

import { useRef } from "react";
import { Users, TrendingUp, Eye, ShoppingBag, Clock, AlertCircle, Bot } from "lucide-react";
import type { DashboardMetrics } from "@/types";

/**
 * Inclinação 3D que segue o mouse (só quando a pessoa passa o mouse; respeita
 * "reduzir movimento" do aparelho). Devolve a ref e os handlers pro elemento.
 */
export function useInclina(max = 7) {
  const ref = useRef<HTMLDivElement>(null);
  const reduz = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || reduz()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateY(-2px)`;
  };
  const onMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return { ref, onMouseMove, onMouseLeave };
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  danger?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, subtitle, icon, trend, color, danger, onClick }: StatCardProps) {
  const inclina = useInclina();
  return (
    <div
      {...inclina}
      // Card clicável: abre a lista que ele conta (09/11)
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={onClick ? "Clique para ver a lista" : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={`rounded-2xl p-5 border relative overflow-hidden transition-transform duration-200 ease-out will-change-transform${onClick ? " cursor-pointer" : ""}`}
      style={{
        // sheen no topo (dá o brilho 3D do vidro) sobre a cor do card
        background: "linear-gradient(157deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 42%), var(--card)",
        borderColor: "var(--border)",
        // espessura: borda de baixo na cor do card (peça com volume) + sombra no chão
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 5px 0 -1px ${color}66, 0 18px 28px -14px rgba(0,0,0,0.7)`,
      }}
    >
      {/* brilho colorido no canto — profundidade */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full"
        style={{ background: `radial-gradient(circle, ${color}40, transparent 70%)` }}
      />
      <div className="relative flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
          style={{
            // tile do ícone em gradiente + glow da cor + highlight interno
            background: `linear-gradient(135deg, ${color}, ${color}b0)`,
            boxShadow: `0 10px 22px -6px ${color}80, inset 0 1px 0 rgba(255,255,255,0.4)`,
          }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background: trend >= 0 ? "#16a34a22" : "#dc262622",
              color: trend >= 0 ? "#22c55e" : "#f87171",
            }}
          >
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
        {danger && (
          <AlertCircle size={16} style={{ color: "var(--danger)" }} />
        )}
      </div>
      <div className="relative text-3xl font-bold mb-1 tracking-tight" style={{ color: danger ? "var(--danger)" : "var(--foreground)" }}>
        {value}
      </div>
      <div className="relative text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {title}
      </div>
      {subtitle && (
        <div className="relative text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function StatsCards({
  metrics,
  followupsTotal,
  followupsPeriodo,
  periodo,
  leadsPeriodo,
  visitasPeriodo,
  vendasPeriodo,
  tendenciaHoje,
  tempoMedio,
  onAbrir,
}: {
  // Tendência real (hoje x ontem até a mesma hora); null = não mostra.
  tendenciaHoje?: number | null;
  // Tempo médio já formatado ("35 min", "2,5 h") ou "—" sem dados.
  tempoMedio?: string;
  // Clique num card: tipo da lista (hoje, periodo, visitas, vendas, semAtendimento, semContato, followups).
  onAbrir?: (tipo: string, titulo: string) => void;
  metrics: DashboardMetrics;
  followupsTotal?: number;
  followupsPeriodo?: string;
  // Período selecionado no topo. Se vier, os cards Leads/Visitas/Vendas seguem ele.
  periodo?: string;
  leadsPeriodo?: number;
  visitasPeriodo?: number;
  vendasPeriodo?: number;
}) {
  const rotulo = periodo ?? "no mês";
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Leads Hoje"
        value={metrics.leadsHoje}
        subtitle={`${metrics.leadsSemana} esta semana`}
        icon={<Users size={20} />}
        trend={tendenciaHoje ?? undefined}
        color="#3b82f6"
        onClick={onAbrir && (() => onAbrir("hoje", "Leads de hoje"))}
      />
      <StatCard
        title={`Leads · ${rotulo}`}
        value={leadsPeriodo ?? metrics.leadsMes}
        subtitle="Total do período"
        icon={<TrendingUp size={20} />}
        color="#8b5cf6"
        onClick={onAbrir && (() => onAbrir("periodo", `Leads · ${rotulo}`))}
      />
      <StatCard
        title={`Visitas · ${rotulo}`}
        value={visitasPeriodo ?? metrics.visitas}
        subtitle="Realizadas no período"
        icon={<Eye size={20} />}
        color="#10b981"
        onClick={onAbrir && (() => onAbrir("visitas", `Visitas · ${rotulo}`))}
      />
      <StatCard
        title={`Vendas · ${rotulo}`}
        value={vendasPeriodo ?? metrics.vendas}
        subtitle="Fechadas no período"
        icon={<ShoppingBag size={20} />}
        color="#f59e0b"
        onClick={onAbrir && (() => onAbrir("vendas", `Vendas · ${rotulo}`))}
      />
      <StatCard
        title="Tempo Médio"
        value={tempoMedio ?? "—"}
        subtitle="Até a 1ª resposta da equipe · mês"
        icon={<Clock size={20} />}
        color="#06b6d4"
      />
      <StatCard
        title="Sem Atendimento"
        value={metrics.leadsSemAtendimento}
        subtitle="Leads aguardando"
        icon={<AlertCircle size={20} />}
        color="#ef4444"
        danger
        onClick={onAbrir && (() => onAbrir("semAtendimento", "Sem atendimento"))}
      />
      <StatCard
        title="Sem Contato"
        value={metrics.clientesSemContato}
        subtitle="+3 dias sem retorno"
        icon={<AlertCircle size={20} />}
        color="#f97316"
        danger
        onClick={onAbrir && (() => onAbrir("semContato", "Sem contato há mais de 3 dias"))}
      />
      <StatCard
        title="Follow-ups IA"
        value={followupsTotal ?? 0}
        subtitle={followupsPeriodo ? `IA · ${followupsPeriodo}` : "IA enviou"}
        icon={<Bot size={20} />}
        color="#a855f7"
        onClick={onAbrir && (() => onAbrir("followups", "Follow-ups da IA"))}
      />
    </div>
  );
}
