"use client";

import { useEffect, useState } from "react";
import { Shield, Check, Loader2, X } from "lucide-react";
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
  const mudou = JSON.stringify(sel) !== JSON.stringify(settings?.swatMemberIds ?? []);

  const salvar = async () => {
    setMsg("");
    try {
      await update.mutateAsync({ swatMemberIds: sel });
      setMsg("Grupo SWAT salvo.");
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
          <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Corretores do grupo SWAT</div>
          {sel.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sel.map((id) => (
                <span key={id} className="text-xs pl-2.5 pr-1 py-1 rounded-lg flex items-center gap-1" style={{ background: "#facc1522", color: "var(--foreground)" }}>
                  {nome(id)}
                  <button onClick={() => setSel(sel.filter((x) => x !== id))} aria-label={`Tirar ${nome(id)} do SWAT`} className="p-0.5 rounded">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <select
            value=""
            disabled={sel.length >= MAX}
            onChange={(e) => e.target.value && setSel([...sel, e.target.value])}
            className="text-sm px-3 py-1.5 rounded-lg border outline-none w-full sm:w-80 disabled:opacity-50"
            style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <option value="">{sel.length >= MAX ? "16 vagas preenchidas" : "Adicionar corretor ao SWAT..."}</option>
            {corretores
              .filter((u) => !sel.includes(u.id))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
          <div className="flex items-center gap-3">
            <button
              onClick={salvar}
              disabled={!mudou || update.isPending}
              className="text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: "#facc15", color: "#0a0a0a" }}
            >
              {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar grupo SWAT
            </button>
            {msg && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
