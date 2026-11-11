"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Loader2, X } from "lucide-react";
import { useQueueSettings, useUpdateQueue, useQueueOrdem } from "@/hooks/use-lead-queue";
import { useUsers } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api";

const MAX = 16;

/**
 * Fila SWAT (Rodrigo 11/11): até 16 corretores que recebem os leads mais qualificados —
 * formulário Meta "SWAT" e quem a IA qualificou (pediu visita / informou renda).
 * Mesmo check-in e horário da fila normal, prazo de 15 min. Só o Diretor escolhe.
 */
export function FilaSwat({ isDiretor }: { isDiretor: boolean }) {
  const { data: settings } = useQueueSettings();
  const { data: users = [] } = useUsers();
  const { data: ordem } = useQueueOrdem();
  const update = useUpdateQueue();
  const [sel, setSel] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (settings) setSel(settings.swatMemberIds ?? []);
  }, [settings]);

  const corretores = (users as any[])
    .filter((u) => u.role === "corretor" && !u.empresaId && u.active !== false)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const nome = (id: string) => (users as any[]).find((u) => u.id === id)?.name ?? "—";
  const livres = corretores.filter((u) => !sel.includes(u.id));
  const [novo, setNovo] = useState("");

  // Incluir / trocar / excluir: grava na hora.
  const gravar = async (lista: string[], ok: string) => {
    setMsg("");
    try {
      const s = await update.mutateAsync({ swatMemberIds: lista });
      setSel(s.swatMemberIds ?? lista);
      setNovo("");
      setMsg(`✅ ${ok}`);
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Não consegui salvar o grupo SWAT."));
    }
  };

  const swatAgora = ordem?.swat ?? [];
  const card = { background: "var(--card)", borderColor: "#facc15" };

  return (
    <div className="rounded-2xl border p-4 space-y-3" style={card}>
      <div className="flex items-center gap-2">
        <Shield size={18} style={{ color: "#facc15" }} />
        <div className="font-semibold" style={{ color: "var(--foreground)" }}>Fila SWAT</div>
        <span className="text-xs ml-auto tabular-nums" style={{ color: "var(--muted-foreground)" }}>
          {sel.length}/{MAX} vagas
        </span>
      </div>
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Recebe os leads mais qualificados: formulário <strong>SWAT</strong> do Facebook e quem a IA qualificou (pediu visita ou
        informou renda). Só recebe quem está no grupo <strong>e fez check-in</strong> no plantão. Prazo de <strong>15 min</strong>{" "}
        pro primeiro contato; lead SWAT só gira entre os SWAT.
      </p>

      {/* SWAT de plantão agora (todos veem) */}
      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>SWAT de plantão agora:</div>
      {swatAgora.length ? (
        <div className="flex flex-wrap gap-2">
          {swatAgora.map((o) => (
            <span
              key={o.userId}
              className="text-xs px-2.5 py-1.5 rounded-lg border"
              style={{ borderColor: o.proximo ? "#facc15" : "var(--border)", color: "var(--foreground)" }}
            >
              {o.nome}
              {o.proximo && <strong style={{ color: "#facc15" }}> · próximo</strong>}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs" style={{ color: "var(--warning, #f59e0b)" }}>
          Nenhum SWAT de plantão — os leads SWAT esperam até um SWAT fazer check-in.
        </p>
      )}
      {isDiretor && (ordem?.swatEsperando ?? 0) > 0 && (
        <p className="text-xs" style={{ color: "var(--warning, #f59e0b)" }}>⏳ {ordem?.swatEsperando} lead(s) SWAT esperando.</p>
      )}

      {isDiretor && (
        <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
            Corretores do grupo SWAT <span style={{ color: "var(--muted-foreground)" }}>· cada botão já salva</span>
          </div>

          {/* Cada corretor: Trocar por outro ou Excluir */}
          {sel.map((id, i) => (
            <div key={id} className="flex items-center gap-2 flex-wrap p-2 rounded-lg" style={{ background: "#facc1512" }}>
              <span className="text-xs w-6 text-center tabular-nums" style={{ color: "var(--muted-foreground)" }}>{i + 1}</span>
              <span className="flex-1 min-w-[140px] text-sm" style={{ color: "var(--foreground)" }}>{nome(id)}</span>
              <select
                value=""
                disabled={update.isPending}
                onChange={(e) => e.target.value && gravar(sel.map((x) => (x === id ? e.target.value : x)), `${nome(id)} trocado por ${nome(e.target.value)}.`)}
                aria-label={`Trocar ${nome(id)} por outro corretor`}
                className="text-xs px-2 py-1.5 rounded-lg border outline-none"
                style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="">Trocar por...</option>
                {livres.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <button
                onClick={() => window.confirm(`Excluir ${nome(id)} do grupo SWAT?`) && gravar(sel.filter((x) => x !== id), `${nome(id)} excluído do SWAT.`)}
                disabled={update.isPending}
                className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 disabled:opacity-50"
                style={{ background: "#ef444422", color: "#f87171" }}
              >
                <X size={12} /> Excluir
              </button>
            </div>
          ))}

          {/* Incluir corretor */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={novo}
              disabled={sel.length >= MAX}
              onChange={(e) => setNovo(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg border outline-none w-full sm:w-80 disabled:opacity-50"
              style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="">{sel.length >= MAX ? "16 vagas preenchidas" : "Escolha o corretor..."}</option>
              {livres.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button
              onClick={() => novo && gravar([...sel, novo], `${nome(novo)} incluído no SWAT.`)}
              disabled={!novo || sel.length >= MAX || update.isPending}
              className="text-sm px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: "#facc15", color: "#0a0a0a" }}
            >
              {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Incluir
            </button>
          </div>
          {msg && <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{msg}</div>}
        </div>
      )}
    </div>
  );
}
