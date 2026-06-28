"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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
          <option>2025</option>
          <option>2024</option>
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

export function ConversionChart() {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="mb-6">
        <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
          Funil de Conversão
        </h3>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Por etapa do Kanban
        </p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={[
            { stage: "Leads", value: 324 },
            { stage: "Contato", value: 287 },
            { stage: "Visita", value: 145 },
            { stage: "Simulação", value: 89 },
            { stage: "Pasta", value: 52 },
            { stage: "Venda", value: 18 },
          ]}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="stage" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--foreground)",
            }}
          />
          <Bar dataKey="value" name="Quantidade" fill="#3b82f6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
