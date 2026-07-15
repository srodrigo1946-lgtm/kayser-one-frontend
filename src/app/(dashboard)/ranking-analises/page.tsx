"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Download, Trophy, Percent } from "lucide-react";
import { useAnalysesRanking, downloadAnalysesExcel, type AnaliseRankRow } from "@/hooks/use-pastas";
import { getStoredUser } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { avatarUrl } from "@/hooks/use-profile";

const VIEWERS = ["diretor", "superintendente", "gerente_geral"];
const roleLabels: Record<string, string> = {
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
};
const MONTHS = ["Todos os meses", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const brl = (v?: number) =>
  v != null ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "R$ 0";

export default function RankingAnalisesPage() {
  const router = useRouter();
  const user = getStoredUser() as any;
  const isDiretor = user?.role === "diretor";

  // Só Gerente Geral pra cima acessam.
  useEffect(() => {
    if (user && !VIEWERS.includes(user.role)) router.replace("/pastas");
  }, [router, user]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(0); // 0 = todos os meses
  const [baixando, setBaixando] = useState(false);

  const { data: rows = [], isLoading } = useAnalysesRanking(year, month || undefined);
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const baixarExcel = async () => {
    setBaixando(true);
    try {
      await downloadAnalysesExcel(year, month || undefined);
    } finally {
      setBaixando(false);
    }
  };

  const selCls = "text-sm px-3 py-2 rounded-lg border outline-none";
  const selStyle = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };

  return (
    <div>
      <Header title="Ranking de Análises" subtitle="Volume de análises, conversão em vendas e VGV por responsável" />
      <div className="p-6 space-y-4">
        {/* Controles */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selCls} style={selStyle}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selCls} style={selStyle}>
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          {isDiretor && (
            <button
              onClick={baixarExcel}
              disabled={baixando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <Download size={16} /> {baixando ? "Baixando…" : "Baixar Excel"}
            </button>
          )}
        </div>

        {/* Ranking */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {isLoading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando…</div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Nenhuma análise no período.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {rows.map((r, i) => (
                <RankRow key={r.id} row={r} pos={i + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RankRow({ row, pos }: { row: AnaliseRankRow; pos: number }) {
  const medal = pos === 1 ? "#f5c518" : pos === 2 ? "#c0c0c0" : pos === 3 ? "#cd7f32" : "var(--muted-foreground)";
  return (
    <div className="p-4 flex items-center gap-3">
      <div className="w-7 text-center font-bold flex-shrink-0" style={{ color: medal }}>
        {pos <= 3 ? <Trophy size={16} className="inline" /> : pos}
      </div>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden" style={{ background: "var(--primary)", color: "white" }}>
        {row.hasAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl(row.id)} alt="" className="w-full h-full object-cover" />
        ) : (
          getInitials(row.name)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{row.name}</div>
        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{roleLabels[row.role] ?? row.role}</div>
      </div>
      {/* Métricas */}
      <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
        <Metric label="Análises" value={String(row.analises)} />
        <Metric label="Vendas" value={String(row.vendas)} color="#10b981" />
        <div className="text-center min-w-[70px]">
          <div className="text-sm font-bold flex items-center justify-center gap-0.5" style={{ color: "#3b82f6" }}>
            {row.conversao}<Percent size={12} />
          </div>
          <div className="mt-1 h-1.5 w-16 rounded-full overflow-hidden mx-auto" style={{ background: "var(--secondary)" }}>
            <div className="h-full rounded-full" style={{ width: `${row.conversao}%`, background: "#3b82f6" }} />
          </div>
        </div>
        <div className="hidden sm:block text-right min-w-[90px]">
          <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{brl(row.vgv)}</div>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>VGV</div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center min-w-[54px]">
      <div className="text-sm font-bold" style={{ color: color ?? "var(--foreground)" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</div>
    </div>
  );
}
