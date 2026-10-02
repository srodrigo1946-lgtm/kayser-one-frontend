"use client";

import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useEquipePlantao } from "@/hooks/use-plantao";

const CARGO: Record<string, string> = {
  superintendente: "Superintendente",
  gerente_geral: "Gerente geral",
  gerente: "Gerente",
};

/**
 * Bloqueio no plantão por hierarquia: Diretor bloqueia todos; cada gestor, a própria
 * equipe. Bloqueado não faz check-in nem recebe lead até alguém desbloquear.
 */
export function BloqueiosPlantao() {
  const { data: equipe } = useEquipePlantao(true);
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);

  if (!equipe) return null;

  const acao = async (id: string, nome: string, bloquear: boolean) => {
    const gestor = equipe.find((m) => m.id === id)?.cargo !== "corretor";
    if (
      !window.confirm(
        bloquear
          ? `Bloquear ${nome} no plantão?${gestor ? " TODA a equipe dele também fica bloqueada." : ""} Não faz check-in nem recebe lead até ser desbloqueado.`
          : `Desbloquear ${nome} no plantão?${gestor ? " A equipe dele volta junto." : ""}`
      )
    )
      return;
    setOcupado(id);
    try {
      await api.post(`/plantao/${bloquear ? "bloquear" : "desbloquear"}/${id}`);
      setMsg(bloquear ? `⛔ ${nome} bloqueado no plantão.` : `✅ ${nome} desbloqueado.`);
      qc.invalidateQueries({ queryKey: ["plantao"] });
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Não consegui."));
    } finally {
      setOcupado(null);
    }
  };

  const q = busca.trim().toLowerCase();
  // Gestores primeiro (bloquear um gestor bloqueia o time), depois bloqueados.
  const lista = equipe
    .filter((m) => !q || m.nome.toLowerCase().includes(q))
    .sort((a, b) => Number(b.cargo !== "corretor") - Number(a.cargo !== "corretor") || Number(!!b.bloqueado) - Number(!!a.bloqueado));
  const bloqueados = equipe.filter((m) => m.bloqueado).length;

  return (
    <div className="mt-6 rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
        <Ban size={18} /> Bloqueio no plantão {bloqueados > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#ef44441f", color: "#ef4444" }}>{bloqueados} bloqueado(s)</span>}
      </div>
      <div className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
        Bloqueado não faz check-in nem recebe lead do plantão até ser desbloqueado. Bloquear um gestor bloqueia o time inteiro dele. Você vê só a sua equipe.
      </div>
      {msg && <p className="text-sm mb-2" style={{ color: "var(--foreground)" }}>{msg}</p>}
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar corretor…"
        className="w-full text-sm px-3 py-2 rounded-xl border outline-none mb-2"
        style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
      />
      {lista.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum corretor.</p>
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
          {lista.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl" style={{ background: m.bloqueado ? "#ef44441a" : "var(--secondary)" }}>
              <span>{m.bloqueado ? "⛔" : "🟢"}</span>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ color: "var(--foreground)" }}>
                  {m.nome}
                  {m.cargo !== "corretor" && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full align-middle" style={{ background: "var(--card)", color: "var(--muted-foreground)" }}>
                      {CARGO[m.cargo] ?? m.cargo} · bloqueia o time
                    </span>
                  )}
                </div>
                {m.bloqueado && (
                  <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                    {m.bloqueado.via ? `Equipe de ${m.bloqueado.via} (bloqueada por ${m.bloqueado.por})` : `Bloqueado por ${m.bloqueado.por}`}
                  </div>
                )}
              </div>
              {m.bloqueado ? (
                m.podeDesbloquear ? (
                  <button onClick={() => acao(m.id, m.nome, false)} disabled={!!ocupado} className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-60" style={{ background: "#22c55e", color: "white" }}>
                    {ocupado === m.id ? <Loader2 size={13} className="animate-spin" /> : "Desbloquear"}
                  </button>
                ) : (
                  <span className="text-xs flex-shrink-0 text-right" style={{ color: "var(--muted-foreground)" }}>
                    {m.bloqueado.via ? `desbloqueie ${m.bloqueado.via}` : "só o Diretor libera"}
                  </span>
                )
              ) : (
                <button onClick={() => acao(m.id, m.nome, true)} disabled={!!ocupado} className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-60" style={{ background: "var(--card)", color: "#ef4444", border: "1px solid #ef444455" }}>
                  {ocupado === m.id ? <Loader2 size={13} className="animate-spin" /> : "Bloquear"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
