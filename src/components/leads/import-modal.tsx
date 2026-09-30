"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2, Upload } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { useImportLeads } from "@/hooks/use-leads";
import { useKanbanColumns } from "@/hooks/use-kanban";
import { useUsers } from "@/hooks/use-users";
import { useSettings } from "@/hooks/use-settings";

type Lote = { quantidade: string; responsavelId: string; status: string; origem: string };
const loteVazio = (): Lote => ({ quantidade: "", responsavelId: "", status: "", origem: "" });

/**
 * Importar planilha: time (cargos), coluna padrão e LOTES — a mesma planilha repartida
 * (ex.: 10 leads pro Isaac, 50 pra coluna "Primeiro Contato", o resto na coluna padrão).
 */
export function ImportModal({ file, onClose, onDone }: { file: File; onClose: () => void; onDone: (msg: string) => void }) {
  const role = getStoredUser()?.role ?? "";
  const isDiretor = role === "diretor";
  const isGestor = ["diretor", "superintendente", "gerente_geral", "gerente"].includes(role);
  const importLeads = useImportLeads();
  const { data: colunas } = useKanbanColumns();
  const { data: usuarios } = useUsers();
  const { data: settings } = useSettings();
  const origens = settings?.leadOrigens?.length
    ? settings.leadOrigens
    : ["Time Tati", "Time Helen", "Time Allan", "Time Marisa", "Time Isabelle", "Time Isaac", "Time Andre", "Time Edjane", "Corujão"];
  const cols = (colunas ?? []).filter((c) => isGestor || !(c as any).somenteGestores);
  const pessoas = (usuarios ?? []).filter((u) => u.active !== false).sort((a, b) => a.name.localeCompare(b.name));

  const [time, setTime] = useState("");
  const [status, setStatus] = useState("");
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [erro, setErro] = useState("");

  const setLote = (i: number, k: keyof Lote, v: string) => setLotes((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const totalLotes = lotes.reduce((a, l) => a + (Number(l.quantidade) || 0), 0);

  const importar = async () => {
    setErro("");
    if (!isDiretor && !time) {
      setErro("Escolha o time de origem da planilha.");
      return;
    }
    const validos = lotes.filter((l) => Number(l.quantidade) > 0);
    try {
      const res = await importLeads.mutateAsync({
        file,
        time: time || undefined,
        status: status || undefined,
        lotes: validos.length
          ? JSON.stringify(
              validos.map((l) => ({
                quantidade: Number(l.quantidade),
                responsavelId: l.responsavelId || undefined,
                status: l.status || undefined,
                origem: l.origem || undefined,
              }))
            )
          : undefined,
      });
      const partes = [
        `${res.imported} novos`,
        `${res.duplicates} já existiam (não duplicados)`,
        res.semTelefone ? `${res.semTelefone} sem telefone (ignorados)` : "",
      ].filter(Boolean);
      const lotesTxt = (res.porLote ?? []).length
        ? ` Lotes: ${(res.porLote ?? []).map((n, i) => `${i + 1}º = ${n}`).join(", ")}; resto na coluna padrão = ${res.restante ?? 0}.`
        : "";
      onDone(`Importação concluída${time ? ` (${time})` : ""}: ${partes.join(", ")} — de ${res.total} linhas.${lotesTxt}`);
    } catch (err) {
      setErro(getApiErrorMessage(err, "Falha ao importar a planilha."));
    }
  };

  const box = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };
  const sel = "w-full px-2 py-2 rounded-lg border text-sm outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)" }} onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Upload size={18} /> Importar planilha
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X size={20} /></button>
        </div>
        <div className="text-xs mb-4 truncate" style={{ color: "var(--muted-foreground)" }}>📄 {file.name}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Time de origem {isDiretor ? "(opcional)" : "(obrigatório)"}
            <select value={time} onChange={(e) => setTime(e.target.value)} className={sel + " mt-1"} style={box}>
              <option value="">{isDiretor ? "— Sem time —" : "— Escolha o time —"}</option>
              {origens.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Coluna padrão do Kanban
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel + " mt-1"} style={box}>
              <option value="">🆕 Novo Lead (padrão)</option>
              {cols.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.title}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Repartir em lotes (opcional)</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Na ordem da planilha: o 1º lote pega os primeiros leads, o 2º os próximos… o que sobrar vai pra coluna padrão.
            </div>
          </div>
          <button
            onClick={() => setLotes((l) => [...l, loteVazio()])}
            className="px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1 flex-shrink-0"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <Plus size={14} /> Lote
          </button>
        </div>

        {lotes.length > 0 && (
          <div className="mt-3 space-y-2">
            {lotes.map((l, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-[90px_1fr_1fr_1fr_36px] gap-2 items-center p-2 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <input
                  type="number" min={1} placeholder="Qtd" value={l.quantidade}
                  onChange={(e) => setLote(i, "quantidade", e.target.value)}
                  className={sel} style={box}
                />
                <select value={l.responsavelId} onChange={(e) => setLote(i, "responsavelId", e.target.value)} className={sel} style={box}>
                  <option value="">👤 Responsável (padrão)</option>
                  {pessoas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={l.status} onChange={(e) => setLote(i, "status", e.target.value)} className={sel} style={box}>
                  <option value="">📋 Coluna (padrão)</option>
                  {cols.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.title}</option>)}
                </select>
                <select value={l.origem} onChange={(e) => setLote(i, "origem", e.target.value)} className={sel} style={box}>
                  <option value="">👥 Time (padrão)</option>
                  {origens.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <button onClick={() => setLotes((ls) => ls.filter((_, j) => j !== i))} className="p-2 rounded-lg justify-self-end" style={{ color: "#ef4444" }} title="Tirar lote">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Total nos lotes: <strong style={{ color: "var(--foreground)" }}>{totalLotes}</strong> lead(s). O restante vai pra coluna padrão.
            </div>
          </div>
        )}

        {erro && <p className="text-sm mt-3" style={{ color: "#ef4444" }}>{erro}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border text-sm" style={box}>Cancelar</button>
          <button
            onClick={importar}
            disabled={importLeads.isPending}
            className="px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60"
            style={{ background: "var(--primary)", color: "white" }}
          >
            {importLeads.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {importLeads.isPending ? "Importando…" : "Importar"}
          </button>
        </div>
      </div>
    </div>
  );
}
