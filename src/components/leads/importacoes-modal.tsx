"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Loader2, FolderOpen } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

type Importacao = { id: string; nome: string; userName: string; total: number; restantes: number; createdAt: string };

/** Planilhas importadas + "Apagar todos desta planilha" (subiu errado). */
export function ImportacoesModal({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const qc = useQueryClient();
  const [lista, setLista] = useState<Importacao[] | null>(null);
  const [erro, setErro] = useState("");
  const [apagando, setApagando] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Importacao[]>("/leads/import/lista")
      .then((r) => setLista(r.data))
      .catch((err) => setErro(getApiErrorMessage(err, "Não consegui listar as planilhas.")));
  }, []);

  const apagar = async (imp: Importacao) => {
    if (!window.confirm(`Apagar TODOS os ${imp.restantes} lead(s) da planilha "${imp.nome}"? Não dá pra desfazer — mas você pode subir a planilha de novo.`)) return;
    setApagando(imp.id);
    try {
      const { data } = await api.delete<{ removidos: number; mantidos?: number }>(`/leads/import/${imp.id}`);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["kanban"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setLista((l) => (data.mantidos ? (l ?? []).map((x) => (x.id === imp.id ? { ...x, restantes: data.mantidos! } : x)) : (l ?? []).filter((x) => x.id !== imp.id)));
      onDone(
        `🗑 Planilha "${imp.nome}": ${data.removidos} lead(s) removido(s).` +
          (data.mantidos ? ` ${data.mantidos} ficaram (já estão com outra pessoa — só o Diretor apaga).` : "")
      );
    } catch (err) {
      setErro(getApiErrorMessage(err, "Falha ao apagar a planilha."));
    } finally {
      setApagando(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)" }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <FolderOpen size={18} /> Planilhas importadas
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X size={20} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
          Subiu a planilha errada? Apague todos os leads dela e suba de novo.
        </p>

        {erro && <p className="text-sm mb-3" style={{ color: "#ef4444" }}>{erro}</p>}
        {!lista && !erro && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando…</p>}
        {lista && lista.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma planilha importada ainda.</p>
        )}

        <div className="space-y-2">
          {(lista ?? []).map((imp) => (
            <div key={imp.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>📄 {imp.nome}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(imp.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {imp.userName || "—"} ·{" "}
                  {imp.restantes} de {imp.total} lead(s) ainda no sistema
                </div>
              </div>
              <button
                onClick={() => apagar(imp)}
                disabled={!!apagando || imp.restantes === 0}
                className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                style={{ background: "rgba(239,68,68,.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,.35)" }}
              >
                {apagando === imp.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Apagar todos
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
