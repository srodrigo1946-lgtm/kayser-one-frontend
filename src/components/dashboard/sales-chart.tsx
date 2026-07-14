"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SaleData } from "@/types";

export function SalesChart({ data = [] }: { data?: SaleData[] }) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
            Evolução Mensal
          </h3>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Leads, visitas e vendas
          </p>
        </div>
        <select
          className="text-sm px-3 py-1.5 rounded-lg border outline-none"
          style={{
            background: "var(--secondary)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          {/* Anos dinâmicos: do ano atual até 2 anos atrás (o corrente vem primeiro). */}
          {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="leads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="vendas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--foreground)",
            }}
          />
          <Legend />
          <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fill="url(#leads)" strokeWidth={2} />
          <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#8b5cf6" fill="url(#vendas)" strokeWidth={2} />
          <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#10b981" fill="url(#vendas)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

const FUNNEL_PALETTE = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#eab308", "#06b6d4"];

export function ConversionChart({ data }: { data?: FunnelStage[] }) {
  const base: FunnelStage[] =
    data && data.length
      ? data
      : [
          { label: "Leads", value: 324 },
          { label: "Contato", value: 287 },
          { label: "Visita", value: 145 },
          { label: "Simulação", value: 89 },
          { label: "Subida de Pasta", value: 52 },
          { label: "Venda", value: 18 },
        ];

  const stages = base.map((s, i) => ({ ...s, color: s.color ?? FUNNEL_PALETTE[i % FUNNEL_PALETTE.length] }));
  const topValue = stages[0]?.value || 1;
  const max = Math.max(...stages.map((s) => s.value), 1);
  const minW = 24; // largura mínima (%) para caber o texto no funil
  const widthOf = (v: number) => minW + (v / max) * (100 - minW);

  return (
    <div className="rounded-2xl p-5 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="mb-5">
        <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
          Funil de Vendas
        </h3>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Etapas do funil comercial
        </p>
      </div>

      <div className="space-y-1.5">
        {stages.map((s, i) => {
          const topW = widthOf(s.value);
          const botW = widthOf(stages[i + 1]?.value ?? s.value * 0.5);
          const lt = (100 - topW) / 2;
          const rt = (100 + topW) / 2;
          const lb = (100 - botW) / 2;
          const rb = (100 + botW) / 2;
          const pct = Math.round((s.value / topValue) * 100);
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-24 text-right text-xs font-medium flex-shrink-0 truncate" style={{ color: "var(--muted-foreground)" }}>
                {s.label}
              </div>
              <div className="flex-1" style={{ height: 46 }}>
                <div
                  className="h-full w-full flex items-center justify-center text-white"
                  style={{
                    clipPath: `polygon(${lt}% 0, ${rt}% 0, ${rb}% 100%, ${lb}% 100%)`,
                    background: `linear-gradient(180deg, rgba(255,255,255,0.40), rgba(255,255,255,0) 45%, rgba(0,0,0,0.20)), ${s.color}`,
                  }}
                >
                  <span className="text-sm font-bold drop-shadow-sm">
                    {s.value}
                    <span className="text-xs font-medium opacity-90"> · {pct}%</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
