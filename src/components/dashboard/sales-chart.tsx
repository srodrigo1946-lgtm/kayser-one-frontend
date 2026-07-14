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
import { useState } from "react";
import { Trophy } from "lucide-react";
import { useMonthlyData, useChampion } from "@/hooks/use-dashboard";
import { avatarUrl } from "@/hooks/use-profile";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function SalesChart() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(0); // 0 = ano todo
  const { data = [] } = useMonthlyData(year);
  const { data: champion } = useChampion(year, month || undefined);
  const periodo = month ? MESES[month - 1] : `${year}`;

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
            Evolução Mensal
          </h3>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Leads, visitas e vendas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-sm px-3 py-1.5 rounded-lg border outline-none"
            style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <option value={0}>Ano todo</option>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          {/* Anos dinâmicos: do ano atual até 2 anos atrás (o corrente vem primeiro). */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm px-3 py-1.5 rounded-lg border outline-none"
            style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            {Array.from({ length: 3 }, (_, i) => currentYear - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Campeão do período (maior VGV) */}
      <div
        className="flex items-center gap-3 mb-5 p-3 rounded-xl border"
        style={{ background: "var(--secondary)", borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
          style={{ background: "rgba(234,179,8,0.15)" }}
        >
          <Trophy size={18} style={{ color: "#eab308" }} />
        </div>
        {champion ? (
          <>
            {champion.hasAvatar ? (
              <img
                src={avatarUrl(champion.responsavelId)}
                alt={champion.nome}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "var(--primary)", color: "white" }}
              >
                {(champion.nome || "?").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Campeão · {periodo}
              </div>
              <div className="font-semibold truncate" style={{ color: "var(--foreground)" }}>
                {champion.nome}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold" style={{ color: "#10b981" }}>{formatBRL(champion.vgv)}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {champion.vendas} {champion.vendas === 1 ? "venda" : "vendas"} · VGV
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Campeão · {periodo}:{" "}
            <span style={{ color: "var(--foreground)" }}>sem vendas registradas no período.</span>
          </div>
        )}
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
