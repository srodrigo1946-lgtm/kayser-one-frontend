"use client";

import { Users, TrendingUp, Eye, ShoppingBag, Clock, AlertCircle } from "lucide-react";
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
      className="rounded-2xl p-5 border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              background: trend >= 0 ? "#16a34a18" : "#dc262618",
              color: trend >= 0 ? "#16a34a" : "#dc2626",
            }}
          >
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
        {danger && (
          <AlertCircle size={16} style={{ color: "var(--danger)" }} />
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: danger ? "var(--danger)" : "var(--foreground)" }}>
        {value}
      </div>
      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {title}
      </div>
      {subtitle && (
        <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function StatsCards({ metrics }: { metrics: DashboardMetrics }) {
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
    </div>
  );
}
