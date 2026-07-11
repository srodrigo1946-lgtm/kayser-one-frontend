"use client";

import { useEffect, useState } from "react";
import { Megaphone, ChevronUp, ChevronDown, Loader2, Check, Search } from "lucide-react";
import { useQueueSettings, useUpdateQueue, useQueueBoard } from "@/hooks/use-lead-queue";
import { useUsers } from "@/hooks/use-users";
import { getStoredUser } from "@/lib/auth";

const roleLabels: Record<string, string> = {
  diretor: "Diretor",
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
};

export default function FilaLeadsPage() {
  const user = getStoredUser();
  const { data: settings } = useQueueSettings();
  const { data: users } = useUsers();
  const { data: board } = useQueueBoard(user?.role === "diretor");
  const update = useUpdateQueue();

  const [enabled, setEnabled] = useState(false);
  const [slaMinutes, setSlaMinutes] = useState(5);
  const [members, setMembers] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setSlaMinutes(settings.slaMinutes);
      setMembers(settings.memberIds ?? []);
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

  // Cargos elegíveis para a fila (aprovados, exceto o Diretor).
  const eligible = (users ?? []).filter((u: any) => u.role !== "diretor" && u.approved !== false);
  const byId = new Map((users ?? []).map((u: any) => [u.id, u]));

  const toggleMember = (id: string) =>
    setMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  const move = (idx: number, dir: -1 | 1) =>
    setMembers((m) => {
      const j = idx + dir;
      if (j < 0 || j >= m.length) return m;
      const copy = [...m];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });

  const salvar = async () => {
    setSaved(false);
    await update.mutateAsync({ enabled, slaMinutes, memberIds: members });
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
        "Clique para WhatsApp" são distribuídos automaticamente em rodízio entre os cargos.
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

      {/* Cargos na fila */}
      <div className="rounded-2xl border p-4 space-y-3" style={card}>
        <div className="font-medium" style={{ color: "var(--foreground)" }}>Cargos na fila (ordem do rodízio)</div>

        {/* Selecionados, na ordem */}
        <div className="space-y-1.5">
          {members.map((id, idx) => {
            const u: any = byId.get(id);
            if (!u) return null;
            return (
              <div key={id} className="flex items-center gap-2 p-2 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs w-6 text-center" style={{ color: "var(--muted-foreground)" }}>{idx + 1}º</span>
                <span className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>
                  {u.name} <span style={{ color: "var(--muted-foreground)" }}>· {roleLabels[u.role] ?? u.role}</span>
                </span>
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 disabled:opacity-30" style={{ color: "var(--muted-foreground)" }}><ChevronUp size={16} /></button>
                <button onClick={() => move(idx, 1)} disabled={idx === members.length - 1} className="p-1 disabled:opacity-30" style={{ color: "var(--muted-foreground)" }}><ChevronDown size={16} /></button>
                <button onClick={() => toggleMember(id)} className="text-xs px-2 py-1 rounded" style={{ color: "var(--destructive, #ef4444)" }}>Remover</button>
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum cargo na fila ainda. Adicione abaixo.</p>
          )}
        </div>

        {/* Disponíveis */}
        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>Adicionar à fila:</div>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar cargo por nome..."
              className="w-full pl-8 pr-2 py-1.5 rounded-lg border text-sm outline-none"
              style={input}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const disponiveis = eligible.filter(
                (u: any) =>
                  !members.includes(u.id) &&
                  (u.name ?? "").toLowerCase().includes(search.trim().toLowerCase())
              );
              if (disponiveis.length === 0) {
                return (
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {search ? "Nenhum cargo encontrado." : "Todos os cargos já estão na fila."}
                  </span>
                );
              }
              return disponiveis.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => toggleMember(u.id)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  + {u.name} <span style={{ color: "var(--muted-foreground)" }}>({roleLabels[u.role] ?? u.role})</span>
                </button>
              ));
            })()}
          </div>
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
          {Object.entries(board?.porCargo ?? {}).map(([id, n]) => (
            <div key={id} className="flex justify-between text-sm">
              <span style={{ color: "var(--muted-foreground)" }}>{(byId.get(id) as any)?.name ?? id}</span>
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
