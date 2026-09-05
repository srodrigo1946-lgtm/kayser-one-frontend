"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Loader2, Check, CalendarClock } from "lucide-react";
import { useQueueSettings, useUpdateQueue, useQueueBoard } from "@/hooks/use-lead-queue";
import { useUsers } from "@/hooks/use-users";
import { useEscala } from "@/hooks/use-escala";
import { getStoredUser } from "@/lib/auth";

const roleLabels: Record<string, string> = {
  diretor: "Diretor",
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
};

// Turno ativo AGORA em horário de Brasília (mesma regra do backend), independente
// do fuso do computador de quem abre a tela.
function agoraBrasilia() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value])
  );
  const DIAS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hh = p.hour === "24" ? "00" : p.hour;
  return { dia: DIAS[p.weekday], hhmm: `${hh}:${p.minute}` };
}

export default function FilaLeadsPage() {
  const user = getStoredUser();
  const { data: settings } = useQueueSettings();
  const { data: users } = useUsers();
  const { data: grade } = useEscala();
  const { data: board } = useQueueBoard(user?.role === "diretor");
  const update = useUpdateQueue();

  const [enabled, setEnabled] = useState(false);
  const [slaMinutes, setSlaMinutes] = useState(5);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setSlaMinutes(settings.slaMinutes);
    }
  }, [settings]);

  if (user?.role !== "diretor") {
    return (
      <div className="p-8">
        <p style={{ color: "var(--muted-foreground)" }}>
          Apenas o Diretor pode configurar a fila de leads.
        </p>
      </div>
    );
  }

  const byId = new Map((users ?? []).map((u: any) => [u.id, u]));

  // Plantão AGORA = atendentes do turno ativo (puxado da Escala).
  const { dia, hhmm } = agoraBrasilia();
  const turnoAtivo = (grade ?? []).find(
    (t) => t.diaSemana === dia && t.horaInicio <= hhmm && hhmm < t.horaFim
  );
  // Só corretor recebe lead (gerente pra cima não entra), igual à regra do backend.
  const plantaoAgora = (turnoAtivo?.atendenteIds ?? [])
    .map((id) => byId.get(id))
    .filter((u: any) => u && u.role === "corretor" && !u.empresaId) as any[];

  const salvar = async () => {
    setSaved(false);
    await update.mutateAsync({ enabled, slaMinutes });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const card = { background: "var(--card)", borderColor: "var(--border)" };
  const input = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Megaphone size={22} style={{ color: "var(--primary)" }} />
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          Fila de Leads de Anúncio
        </h1>
      </div>
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        Quando ligada, os leads que chegam pelo número central (Diretor) via anúncio
        "Clique para WhatsApp" são distribuídos automaticamente em rodízio — mas
        <strong> só entre quem está de plantão na Escala de Atendimento</strong> naquele horário.
        Se o cargo não atender dentro do tempo, o lead passa para o próximo.
      </p>

      {/* Configuração */}
      <div className="rounded-2xl border p-4 space-y-4" style={card}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium" style={{ color: "var(--foreground)" }}>Fila ligada</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Distribui os leads de anúncio automaticamente.
            </div>
          </div>
          <button
            onClick={() => setEnabled((v) => !v)}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ background: enabled ? "var(--primary)" : "var(--secondary)" }}
            aria-pressed={enabled}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: enabled ? "26px" : "2px" }}
            />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm" style={{ color: "var(--foreground)" }}>
            Tempo de atendimento (minutos):
          </label>
          <input
            type="number"
            min={1}
            value={slaMinutes}
            onChange={(e) => setSlaMinutes(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 px-2 py-1.5 rounded-lg border text-sm outline-none"
            style={input}
          />
        </div>
      </div>

      {/* Quem recebe = Escala (não é mais lista manual) */}
      <div className="rounded-2xl border p-4 space-y-3" style={card}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="font-medium" style={{ color: "var(--foreground)" }}>Quem recebe os leads</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              A distribuição é automática pela <strong>Escala de Atendimento</strong> — só recebe quem está de plantão no horário.
            </div>
          </div>
          <Link
            href="/escala"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--secondary)" }}
          >
            <CalendarClock size={15} /> Editar Escala
          </Link>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Plantão agora {turnoAtivo ? `(${turnoAtivo.horaInicio}–${turnoAtivo.horaFim})` : ""}:
          </div>
          {plantaoAgora.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {plantaoAgora.map((u) => (
                <span
                  key={u.id}
                  className="text-xs px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  {u.name} <span style={{ color: "var(--muted-foreground)" }}>({roleLabels[u.role] ?? u.role})</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--warning, #f59e0b)" }}>
              Ninguém de plantão agora — os leads ficam aguardando até abrir um turno com atendentes. Adicione pessoas na Escala.
            </p>
          )}
        </div>
      </div>

      <button
        onClick={salvar}
        disabled={update.isPending}
        className="text-sm px-4 py-2.5 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-60"
        style={{ background: "var(--primary)", color: "white" }}
      >
        {update.isPending ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
        {saved ? "Salvo" : "Salvar configuração"}
      </button>

      {/* Painel do dia */}
      <div className="rounded-2xl border p-4" style={card}>
        <div className="font-medium mb-3" style={{ color: "var(--foreground)" }}>Hoje</div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Metric label="Recebidos" value={board?.recebidos ?? 0} color="var(--foreground)" />
          <Metric label="Atendidos" value={board?.atendidos ?? 0} color="var(--success, #22c55e)" />
          <Metric label="Estouraram o tempo" value={board?.expirados ?? 0} color="var(--warning, #f59e0b)" />
        </div>
        <div className="space-y-1">
          {Object.entries(board?.porCargo ?? {})
            .filter(([id]) => !!id)
            .map(([id, n]) => (
              <div key={id} className="flex justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>
                  {(byId.get(id) as any)?.name ?? "Usuário removido"}
                </span>
                <span style={{ color: "var(--foreground)" }}>{n as number}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--border)" }}>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</div>
    </div>
  );
}
