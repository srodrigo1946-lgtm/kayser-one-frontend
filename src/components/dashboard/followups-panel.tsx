"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, MessageCircle } from "lucide-react";
import { useFollowups } from "@/hooks/use-dashboard";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Painel dos follow-ups automáticos da IA (nome + telefone + quando), com filtro
 *  mês/ano e clique para abrir a conversa. Autocontido — usa o próprio estado. */
export function FollowupsPanel() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(0); // 0 = ano todo
  const { data } = useFollowups(year, month || undefined);
  const periodo = month ? MESES[month - 1] : `${year}`;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const abrirConversa = (f: { leadId: string; phone: string }) => {
    const params = new URLSearchParams();
    if (f.leadId) params.set("lead", f.leadId);
    if (f.phone) params.set("phone", f.phone);
    router.push(`/whatsapp?${params.toString()}`);
  };

  const quando = (iso: string) => {
    const d = new Date(iso);
    const min = Math.floor((Date.now() - d.getTime()) / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;
    const dias = Math.floor(h / 24);
    if (dias === 1) return "ontem";
    if (dias < 7) return `há ${dias} dias`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Bot size={18} style={{ color: "#a855f7" }} /> Follow-ups automáticos da IA
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {total} no período · clique para abrir a conversa
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
      <div className="space-y-1">
        {items.map((f) => (
          <button
            key={f.id}
            onClick={() => abrirConversa(f)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors hover:opacity-90"
            style={{ background: "var(--secondary)" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#a855f722", color: "#a855f7" }}>
              <Bot size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{f.nome || "Lead sem nome"}</div>
              <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{f.phone || "sem telefone"}</div>
            </div>
            <span className="text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{quando(f.at)}</span>
            <MessageCircle size={16} style={{ color: "#25d366" }} />
          </button>
        ))}
        {items.length === 0 && (
          <div className="py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            Nenhum follow-up da IA em {periodo}.
          </div>
        )}
      </div>
    </div>
  );
}
