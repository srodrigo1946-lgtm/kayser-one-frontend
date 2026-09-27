"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import type { Lead, KanbanColumn } from "@/types";
import { MessageSquare, Plus, Trash2, Settings2, ChevronLeft, ChevronRight, Search, Clock, BellRing } from "lucide-react";
import {
  useKanbanBoard,
  useMoveCard,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
  useReorderColumns,
} from "@/hooks/use-kanban";
import { useDeleteLead } from "@/hooks/use-leads";
import { usePendentes } from "@/hooks/use-lead-queue";
import { getStoredUser } from "@/lib/auth";
import { useAlerts } from "@/hooks/use-alerts";
import { LeadDetailDrawer } from "@/components/leads/lead-detail-drawer";

// Relógio de contagem regressiva do SLA (tempo pra atender antes de passar pro próximo).
function Countdown({ dueAt }: { dueAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const restante = Math.max(0, Math.floor((new Date(dueAt).getTime() - now) / 1000));
  const mm = String(Math.floor(restante / 60)).padStart(2, "0");
  const ss = String(restante % 60).padStart(2, "0");
  const acabou = restante <= 0;
  const cor = acabou ? "#ef4444" : restante <= 120 ? "#f59e0b" : "#22c55e";
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded"
      style={{ color: cor, background: `${cor}18` }}
      title={acabou ? "Tempo esgotado — vai passar pro próximo da fila" : "Tempo para atender antes de passar pro próximo"}
    >
      <Clock size={11} /> {acabou ? "Esgotado" : `${mm}:${ss}`}
    </span>
  );
}

function LeadCard({
  lead,
  dueAt,
  onDragStart,
  onOpen,
  podeExcluir,
  onExcluir,
  onWhatsapp,
  respondeu,
  visita,
}: {
  lead: Lead;
  dueAt?: string;
  /** Texto que o cliente respondeu e ainda está sem resposta do corretor. */
  respondeu?: string;
  /** Visita agendada pela IA (data ISO). */
  visita?: string;
  onDragStart: (lead: Lead) => void;
  onOpen: (lead: Lead) => void;
  podeExcluir: boolean;
  onExcluir: (lead: Lead) => void;
  onWhatsapp: (lead: Lead) => void;
}) {
  const score = lead.score || 0;
  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  // Desde quando o lead está nesta etapa (data + tempo) — pra feedback com o time.
  const desde = lead.stageSince ? new Date(lead.stageSince) : null;
  const dias = desde ? Math.floor((Date.now() - desde.getTime()) / 86400000) : 0;
  const tempoEtapa = desde ? (dias <= 0 ? "hoje" : dias === 1 ? "1 dia" : `${dias} dias`) : "";
  // Alerta: 3+ dias sem contato (venda ganha/perdida não conta).
  const fechado = lead.status === "venda_ganha" || lead.status === "venda_perdida";
  const diasSemContato = lead.lastContactAt ? Math.floor((Date.now() - new Date(lead.lastContactAt).getTime()) / 86400000) : 0;
  const alertaContato = !fechado && diasSemContato >= 3;

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

      {dueAt && (
        <div className="mb-2"><Countdown dueAt={dueAt} /></div>
      )}

      {visita && (
        <div className="mb-2 text-xs px-2 py-1 rounded-lg" style={{ background: "#3b82f622", color: "#3b82f6" }} title="Visita agendada pela IA fora do plantão">
          📅 Visita {new Date(visita).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })} às {new Date(visita).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} (IA)
        </div>
      )}

      {respondeu !== undefined && (
        <div className="mb-2 text-xs px-2 py-1 rounded-lg line-clamp-2 break-words" style={{ background: "#22c55e22", color: "#22c55e" }} title="O cliente respondeu e está esperando você">
          💬 Respondeu: “{respondeu || "(mensagem)"}”
        </div>
      )}

      {alertaContato && respondeu === undefined && (
        <div className="mb-2 text-xs px-2 py-1 rounded-lg" style={{ background: "#f9731622", color: "#f97316" }} title="Chame o cliente">
          ⚠️ {diasSemContato} dias sem contato
        </div>
      )}

      {lead.empreendimento && (
        <div className="text-xs mb-2 truncate" style={{ color: "var(--muted-foreground)" }}>🏢 {lead.empreendimento}</div>
      )}

      {desde && (
        <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }} title={`Nesta etapa desde ${desde.toLocaleString("pt-BR")}`}>
          📅 {desde.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · {tempoEtapa} nesta etapa
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(lead.whatsapp || lead.phone) && (
            <button
              onClick={(e) => { e.stopPropagation(); onWhatsapp(lead); }}
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: "#22c55e18", color: "#22c55e" }}
              title="Abrir conversa no WhatsApp"
              aria-label="Abrir conversa no WhatsApp"
            >
              <MessageSquare size={11} />
            </button>
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
  const { data: pendentes } = usePendentes();
  const dueByLead = new Map((pendentes ?? []).map((p) => [p.leadId, p.dueAt]));
  // Avisos do sino (já filtrados pela equipe de quem está logado).
  const { data: alerts } = useAlerts();
  const responderam = alerts?.responderam ?? [];
  const semContato = alerts?.semContato ?? [];
  const respostaByLead = new Map(responderam.map((r) => [r.leadId, r.mensagem]));
  const visitasIA = alerts?.visitasIA ?? [];
  const visitaByLead = new Map(visitasIA.map((v) => [v.leadId, v.scheduledAt]));
  // Total verdadeiro (a lista mostra só parte: 20 sem contato mais antigos).
  const totalResponderam = alerts?.responderamTotal ?? responderam.length;
  const totalSemContato = alerts?.semContatoTotal ?? semContato.length;
  const [avisosAbertos, setAvisosAbertos] = useState(true);
  const moveCard = useMoveCard();
  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const reorder = useReorderColumns();
  const [dragging, setDragging] = useState<Lead | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [busca, setBusca] = useState("");

  // Filtra os cards por nome OU telefone (só dígitos). Vazio = mostra todos.
  const filtra = (leads: Lead[]): Lead[] => {
    const q = busca.trim().toLowerCase();
    if (!q) return leads;
    const num = q.replace(/\D/g, "");
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        (!!num && `${l.phone ?? ""}${l.whatsapp ?? ""}`.replace(/\D/g, "").includes(num))
    );
  };

  // Abrir a conversa do lead no WhatsApp (todos os cargos) — mesmo deep-link da tela de Leads.
  const router = useRouter();
  const abrirWhatsapp = (lead: Lead) => {
    const fone = (lead.whatsapp || lead.phone || "").replace(/\D/g, "");
    const params = new URLSearchParams({ lead: lead.id });
    if (fone) params.set("phone", fone);
    router.push(`/whatsapp?${params.toString()}`);
  };

  // Excluir lead pelo card: só o Diretor (usa o isDiretor já declarado abaixo).
  const excluirLead = useDeleteLead();
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

      <div className="px-6 pt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border w-full max-w-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <Search size={14} style={{ color: "var(--muted-foreground)" }} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente por nome ou telefone..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--foreground)" }}
          />
        </div>
        {isDiretor && (
          <button
            onClick={() => setEditMode((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border flex-shrink-0"
            style={{
              borderColor: "var(--border)",
              background: editMode ? "var(--primary)" : "var(--card)",
              color: editMode ? "white" : "var(--foreground)",
            }}
          >
            <Settings2 size={14} /> {editMode ? "Concluir edição" : "Editar colunas"}
          </button>
        )}
      </div>

      {/* Quadro de avisos: cliente respondeu / 3+ dias sem contato (cada cargo vê a sua equipe). */}
      {(visitasIA.length > 0 || responderam.length > 0 || semContato.length > 0) && (
        <div className="mx-6 mt-3 rounded-2xl border" style={{ background: "var(--card)", borderColor: "#f9731655" }}>
          <button onClick={() => setAvisosAbertos((v) => !v)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-left" style={{ color: "var(--foreground)" }}>
            <BellRing size={15} style={{ color: "#f97316" }} />
            Avisos: {visitasIA.length > 0 && <span style={{ color: "#3b82f6" }}>{visitasIA.length} visita(s) agendada(s) pela IA · </span>}
            {totalResponderam > 0 && <span style={{ color: "#22c55e" }}>{totalResponderam} cliente(s) responderam</span>}
            {totalResponderam > 0 && totalSemContato > 0 && " · "}
            {totalSemContato > 0 && <span style={{ color: "#f97316" }}>{totalSemContato} sem contato há 3+ dias</span>}
            <span className="ml-auto text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>{avisosAbertos ? "esconder" : "ver"}</span>
          </button>
          {avisosAbertos && (
            <div className="px-4 pb-3 grid gap-1.5 md:grid-cols-2 max-h-48 overflow-y-auto">
              {visitasIA.map((v) => (
                <button key={`vi-${v.id}`} onClick={() => router.push(`/whatsapp?lead=${v.leadId}`)} className="text-left text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "#3b82f618", color: "var(--foreground)", border: "1px solid #3b82f655" }} title="Abrir a conversa">
                  📅 <b>{v.nome}</b> · {v.phone || "sem telefone"}
                  <div style={{ color: "#3b82f6" }}>
                    Visita {new Date(v.scheduledAt).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })} às {new Date(v.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {v.local ? ` · ${v.local}` : ""} · {v.corretor ? `corretor: ${v.corretor.split(" ")[0]}` : "aguardando plantão"}
                  </div>
                </button>
              ))}
              {responderam.map((r) => (
                <button key={`rp-${r.leadId}`} onClick={() => router.push(`/whatsapp?lead=${r.leadId}`)} className="text-left text-xs px-2.5 py-1.5 rounded-lg truncate" style={{ background: "#22c55e18", color: "var(--foreground)" }} title="Abrir a conversa">
                  💬 <b>{r.nome}</b> respondeu: <span style={{ color: "#22c55e" }}>“{r.mensagem || "(mensagem)"}”</span>
                </button>
              ))}
              {semContato.map((l) => (
                <button key={`sc-${l.id}`} onClick={() => router.push(`/whatsapp?lead=${l.id}`)} className="text-left text-xs px-2.5 py-1.5 rounded-lg truncate" style={{ background: "#f9731618", color: "var(--foreground)" }} title="Abrir a conversa">
                  ⚠️ <b>{l.name}</b> — {l.lastContactAt ? Math.floor((Date.now() - new Date(l.lastContactAt).getTime()) / 86400000) : 3} dias sem contato
                </button>
              ))}
              {totalSemContato > semContato.length && (
                <div className="md:col-span-2 text-xs px-1 pt-1" style={{ color: "var(--muted-foreground)" }}>
                  Mostrando os {semContato.length} mais antigos sem contato de {totalSemContato}. Todos têm o selo ⚠️ no card.
                </div>
              )}
            </div>
          )}
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
                      {filtra(col.leads).length}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {filtra(col.leads).map((lead) => (
                  <LeadCard key={lead.id} lead={lead} dueAt={col.id === "novo_lead" ? dueByLead.get(lead.id) : undefined} onDragStart={setDragging} onOpen={setDetailLead} podeExcluir={isDiretor} onExcluir={confirmarExcluir} onWhatsapp={abrirWhatsapp} respondeu={respostaByLead.get(lead.id)} visita={visitaByLead.get(lead.id)} />
                ))}
                {filtra(col.leads).length === 0 && (
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
