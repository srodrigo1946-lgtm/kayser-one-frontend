"use client";

import { Users, TrendingUp, Eye, ShoppingBag, Clock, AlertCircle, Bot } from "lucide-react";
import type { DashboardMetrics } from "@/types";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  danger?: boolean;
}

function StatCard({ title, value, subtitle, icon, trend, color, danger }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 border relative overflow-hidden"
      style={{
        // sheen no topo (dá o brilho 3D do vidro) sobre a cor do card
        background: "linear-gradient(157deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 42%), var(--card)",
        borderColor: "var(--border)",
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
  followupsSemana,
  followupsHoje,
}: {
  metrics: DashboardMetrics;
  followupsSemana?: number;
  followupsHoje?: number;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Leads Hoje"
        value={metrics.leadsHoje}
        subtitle={`${metrics.leadsSemana} esta semana`}
        icon={<Users size={20} />}
        trend={12}
        color="#3b82f6"
      />
      <StatCard
        title="Leads no Mês"
        value={metrics.leadsMes}
        subtitle="Total acumulado"
        icon={<TrendingUp size={20} />}
        trend={8}
        color="#8b5cf6"
      />
      <StatCard
        title="Visitas"
        value={metrics.visitas}
        subtitle="Realizadas no mês"
        icon={<Eye size={20} />}
        trend={5}
        color="#10b981"
      />
      <StatCard
        title="Vendas"
        value={metrics.vendas}
        subtitle={`${metrics.conversao.toFixed(1)}% de conversão`}
        icon={<ShoppingBag size={20} />}
        trend={15}
        color="#f59e0b"
      />
      <StatCard
        title="Tempo Médio"
        value={`${metrics.tempoMedioAtendimento}h`}
        subtitle="Para primeiro contato"
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
      />
      <StatCard
        title="Sem Contato"
        value={metrics.clientesSemContato}
        subtitle="+3 dias sem retorno"
        icon={<AlertCircle size={20} />}
        color="#f97316"
        danger
      />
      <StatCard
        title="Follow-ups IA"
        value={followupsSemana ?? 0}
        subtitle={`${followupsHoje ?? 0} hoje · últimos 7 dias`}
        icon={<Bot size={20} />}
        color="#a855f7"
      />
    </div>
  );
}
