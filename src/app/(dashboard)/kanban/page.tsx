"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import type { Lead, KanbanColumn } from "@/types";
import { MessageSquare, Plus, Trash2, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useKanbanBoard,
  useMoveCard,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
  useReorderColumns,
} from "@/hooks/use-kanban";
import { useDeleteLead } from "@/hooks/use-leads";
import { getStoredUser } from "@/lib/auth";
import { LeadDetailDrawer } from "@/components/leads/lead-detail-drawer";

function LeadCard({
  lead,
  onDragStart,
  onOpen,
  podeExcluir,
  onExcluir,
}: {
  lead: Lead;
  onDragStart: (lead: Lead) => void;
  onOpen: (lead: Lead) => void;
  podeExcluir: boolean;
  onExcluir: (lead: Lead) => void;
}) {
  const score = lead.score || 0;
  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(lead)}
      onClick={() => onOpen(lead)}
      className="rounded-xl p-3 border cursor-pointer active:cursor-grabbing"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
      title="Ver dados do cliente"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--primary)", color: "white" }}>
            {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="text-sm font-medium leading-none" style={{ color: "var(--foreground)" }}>
            {lead.name.split(" ").slice(0, 2).join(" ")}
          </div>
        </div>
        {podeExcluir && (
          <button
            onClick={(e) => { e.stopPropagation(); onExcluir(lead); }}
            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ color: "#ef4444" }}
            title="Excluir lead"
            aria-label="Excluir lead"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {lead.empreendimento && (
        <div className="text-xs mb-2 truncate" style={{ color: "var(--muted-foreground)" }}>🏢 {lead.empreendimento}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {lead.whatsapp && (
            <span className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#22c55e18", color: "#22c55e" }}>
              <MessageSquare size={11} />
            </span>
          )}
          {lead.origem && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
              {lead.origem.split(" ")[0]}
            </span>
          )}
        </div>
        {lead.score ? <span className="text-xs font-bold" style={{ color: scoreColor }}>{lead.score}</span> : null}
      </div>

      {lead.responsavel?.name && (
        <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          👤 {lead.responsavel.name.split(" ")[0]}
        </div>
      )}
    </div>
  );
}

function ColumnEditor({
  col,
  onSave,
  onDelete,
  onMoveLeft,
  onMoveRight,
  canLeft,
  canRight,
}: {
  col: KanbanColumn;
  onSave: (patch: { title?: string; emoji?: string; color?: string }) => void;
  onDelete: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canLeft: boolean;
  canRight: boolean;
}) {
  const [title, setTitle] = useState(col.title);
  const [emoji, setEmoji] = useState(col.emoji);

  const inputStyle = { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          onBlur={() => emoji !== col.emoji && onSave({ emoji })}
          maxLength={2}
          className="w-8 text-center px-1 py-1 rounded-lg border text-sm outline-none"
          style={inputStyle}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== col.title && onSave({ title: title.trim() })}
          className="flex-1 min-w-0 px-2 py-1 rounded-lg border text-sm outline-none"
          style={inputStyle}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={col.color}
          onChange={(e) => onSave({ color: e.target.value })}
          className="w-8 h-7 rounded-lg border cursor-pointer"
          style={{ borderColor: "var(--border)", background: "transparent" }}
          title="Cor"
        />
        <button onClick={onMoveLeft} disabled={!canLeft} className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-40" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} title="Mover para a esquerda">
          <ChevronLeft size={14} />
        </button>
        <button onClick={onMoveRight} disabled={!canRight} className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-40" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} title="Mover para a direita">
          <ChevronRight size={14} />
        </button>
        <button onClick={onDelete} className="w-7 h-7 rounded-lg border flex items-center justify-center ml-auto" style={{ borderColor: "var(--border)", color: "#ef4444" }} title="Remover coluna">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const { data: board, isLoading, isError } = useKanbanBoard();
  const moveCard = useMoveCard();
  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const reorder = useReorderColumns();
  const [dragging, setDragging] = useState<Lead | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  // Excluir lead pelo card: só o Diretor.
  const excluirLead = useDeleteLead();
  const isDiretor = (getStoredUser() as any)?.role === "diretor";
  const confirmarExcluir = (lead: Lead) => {
    if (!window.confirm(`Excluir o lead "${lead.name}" de vez? Não dá para desfazer.`)) return;
    excluirLead.mutate(lead.id);
  };

  const user = getStoredUser();
  const isDiretor = user?.role === "diretor";
  const cols = board ?? [];

  const handleDrop = (status: string) => {
    if (dragging && dragging.status !== status) {
      moveCard.mutate({ leadId: dragging.id, status, order: 0 });
    }
    setDragging(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    const ids = cols.map((c) => c.columnId).filter((x): x is string => !!x);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorder.mutate(ids);
  };

  const addColumn = () => {
    const title = window.prompt("Nome da nova coluna:");
    if (title && title.trim()) createColumn.mutate({ title: title.trim() });
  };

  return (
    <div className="h-full flex flex-col">
      <Header title="Kanban" subtitle="Fluxo comercial de leads" />

      {isDiretor && (
        <div className="px-6 pt-3 flex justify-end">
          <button
            onClick={() => setEditMode((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border"
            style={{
              borderColor: "var(--border)",
              background: editMode ? "var(--primary)" : "var(--card)",
              color: editMode ? "white" : "var(--foreground)",
            }}
          >
            <Settings2 size={14} /> {editMode ? "Concluir edição" : "Editar colunas"}
          </button>
        </div>
      )}

      {isLoading && <div className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando board...</div>}
      {isError && <div className="p-6 text-sm" style={{ color: "#ef4444" }}>Erro ao carregar o board. Verifique se o backend está rodando.</div>}

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full" style={{ minWidth: "max-content" }}>
          {cols.map((col, index) => (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
              className="flex flex-col rounded-2xl border"
              style={{ background: "var(--secondary)", borderColor: "var(--border)", width: "260px", minHeight: "500px" }}
            >
              <div className="p-3">
                {editMode && isDiretor ? (
                  <ColumnEditor
                    col={col}
                    onSave={(patch) => col.columnId && updateColumn.mutate({ id: col.columnId, ...patch })}
                    onDelete={() => {
                      if (col.columnId && window.confirm(`Remover a coluna "${col.title}"? Os leads dela vão para a primeira coluna.`)) {
                        deleteColumn.mutate(col.columnId);
                      }
                    }}
                    onMoveLeft={() => move(index, -1)}
                    onMoveRight={() => move(index, 1)}
                    canLeft={index > 0}
                    canRight={index < cols.length - 1}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{col.emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{col.title}</span>
                    <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ background: col.color, color: "white" }}>
                      {col.leads.length}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {col.leads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onDragStart={setDragging} onOpen={setDetailLead} podeExcluir={isDiretor} onExcluir={confirmarExcluir} />
                ))}
                {col.leads.length === 0 && (
                  <div className="text-xs text-center py-8 rounded-xl border-2 border-dashed" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                    Arraste leads aqui
                  </div>
                )}
              </div>
            </div>
          ))}

          {editMode && isDiretor && (
            <button
              onClick={addColumn}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", width: "260px", minHeight: "500px" }}
            >
              <Plus size={20} /> Nova coluna
            </button>
          )}
        </div>
      </div>

      {detailLead && <LeadDetailDrawer lead={detailLead} onClose={() => setDetailLead(null)} />}
    </div>
  );
}
