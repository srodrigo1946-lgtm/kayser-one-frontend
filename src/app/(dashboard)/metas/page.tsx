"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ChevronLeft, ChevronRight, Target, Plus, Trash2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { useGoalsProgress, useUpsertGoal, useDeleteGoal } from "@/hooks/use-goals";
import { useUsers } from "@/hooks/use-users";

const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function MetasPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data: progress } = useGoalsProgress(month, year);
  const { data: users } = useUsers();
  const upsert = useUpsertGoal();
  const deleteGoal = useDeleteGoal();
  const [feedback, setFeedback] = useState("");

  const removeGoal = async (id: string, name?: string) => {
    if (!window.confirm(`Excluir a meta de ${name ?? "este usuário"} em ${months[month - 1]} ${year}?`)) return;
    setFeedback("");
    try {
      await deleteGoal.mutateAsync(id);
      setFeedback("Meta excluída.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao excluir meta."));
    }
  };

  const user = getStoredUser();
  const canManage = user && user.role !== "corretor";

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1);
  };

  const defineGoal = async () => {
    if (!users || users.length === 0) {
      setFeedback("Nenhum usuário disponível para definir meta.");
      return;
    }
    const list = users.map((u, i) => `${i + 1}. ${u.name}`).join("\n");
    const idx = Number(window.prompt(`Para qual usuário?\n${list}`, "1"));
    const target = users[idx - 1];
    if (!target) return;
    const targetSales = Number(window.prompt(`Meta de vendas de ${target.name} (${months[month - 1]}):`, "10"));
    if (isNaN(targetSales)) return;
    const targetVisits = Number(window.prompt(`Meta de visitas de ${target.name}:`, "20"));
    setFeedback("");
    try {
      await upsert.mutateAsync({ userId: target.id, month, year, targetSales, targetVisits: isNaN(targetVisits) ? 0 : targetVisits });
      setFeedback("Meta definida com sucesso.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao definir meta."));
    }
  };

  return (
    <div>
      <Header title="Metas" subtitle="Acompanhamento de metas mensais" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}><ChevronLeft size={16} /></button>
            <span className="font-semibold min-w-[160px] text-center" style={{ color: "var(--foreground)" }}>{months[month - 1]} {year}</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}><ChevronRight size={16} /></button>
          </div>
          {canManage && (
            <button onClick={defineGoal} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "var(--primary)", color: "white" }}>
              <Plus size={16} /> Definir meta
            </button>
          )}
        </div>

        {feedback && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{feedback}</p>}

        <div className="grid md:grid-cols-2 gap-4">
          {(progress ?? []).map((p) => (
            <div key={p.goal.id} className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--primary)18", color: "var(--primary)" }}>
                  <Target size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: "var(--foreground)" }}>{p.goal.user?.name ?? "—"}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{months[month - 1]} {year}</div>
                </div>
                {canManage && (
                  <button
                    onClick={() => removeGoal(p.goal.id, p.goal.user?.name)}
                    disabled={deleteGoal.isPending}
                    className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-50"
                    style={{ color: "#ef4444" }}
                    title="Excluir meta"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <ProgressBar label="Vendas" achieved={p.achievedSales} target={p.goal.targetSales} pct={p.salesPct} color="#22c55e" />
              <div className="h-3" />
              <ProgressBar label="Visitas" achieved={p.achievedVisits} target={p.goal.targetVisits} pct={p.visitsPct} color="#3b82f6" />
            </div>
          ))}
          {(progress ?? []).length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma meta definida para este mês.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, achieved, target, pct, color }: { label: string; achieved: number; target: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</span>
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{achieved} / {target}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
