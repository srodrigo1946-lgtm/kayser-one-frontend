import { Header } from "@/components/layout/header";
import { SalesChart, ConversionChart } from "@/components/dashboard/sales-chart";
import { BarChart3, TrendingUp, Download } from "lucide-react";

export default function RelatoriosPage() {
  return (
    <div>
      <Header title="Relatórios" subtitle="Análise completa do desempenho comercial" />
      <div className="p-6 space-y-6">
        <div className="flex gap-3 flex-wrap">
          {["Mensal", "Trimestral", "Anual", "Personalizado"].map((p) => (
            <button
              key={p}
              className="px-4 py-2 rounded-xl border text-sm font-medium"
              style={{
                background: p === "Mensal" ? "var(--primary)" : "var(--card)",
                borderColor: p === "Mensal" ? "var(--primary)" : "var(--border)",
                color: p === "Mensal" ? "white" : "var(--foreground)",
              }}
            >
              {p}
            </button>
          ))}
          <button
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <Download size={16} />
            Exportar PDF
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {[
            { label: "Total de Leads", value: "1.284", change: "+18%", color: "#3b82f6" },
            { label: "Visitas Realizadas", value: "247", change: "+12%", color: "#10b981" },
            { label: "Vendas Fechadas", value: "68", change: "+24%", color: "#f59e0b" },
            { label: "Receita Gerada", value: "R$ 4.2M", change: "+31%", color: "#8b5cf6" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border p-5"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: m.color }}>{m.value}</div>
              <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{m.label}</div>
              <div className="text-xs mt-1 font-medium" style={{ color: "#22c55e" }}>
                <TrendingUp size={11} className="inline mr-1" />{m.change} vs mês anterior
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <SalesChart />
          <ConversionChart />
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            Desempenho por Corretor — Junho 2025
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Corretor", "Leads", "Visitas", "Vendas", "Conversão", "Meta"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Carlos Silva", leads: 89, visitas: 18, vendas: 7, meta: 10 },
                  { name: "Marina Costa", leads: 76, visitas: 15, vendas: 6, meta: 10 },
                  { name: "Patricia Souza", leads: 64, visitas: 12, vendas: 5, meta: 10 },
                ].map((r) => (
                  <tr key={r.name} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{r.leads}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{r.visitas}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{r.vendas}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#22c55e" }}>
                      {((r.vendas / r.leads) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full" style={{ background: "var(--secondary)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(r.vendas / r.meta) * 100}%`, background: "var(--primary)" }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {r.vendas}/{r.meta}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
