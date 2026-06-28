"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import type { Lead, LeadStatus } from "@/types";
import { MoreHorizontal, MessageSquare } from "lucide-react";
import { useKanbanBoard, useMoveCard } from "@/hooks/use-kanban";

function LeadCard({
  lead,
  onDragStart,
}: {
  lead: Lead;
  onDragStart: (lead: Lead) => void;
}) {
  const score = lead.score || 0;
  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(lead)}
      className="rounded-xl p-3 border cursor-grab active:cursor-grabbing"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--primary)", color: "white" }}
          >
            {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="text-sm font-medium leading-none" style={{ color: "var(--foreground)" }}>
            {lead.name.split(" ").slice(0, 2).join(" ")}
          </div>
        </div>
        <button style={{ color: "var(--muted-foreground)" }}>
          <MoreHorizontal size={14} />
        </button>
      </div>

      {lead.empreendimento && (
        <div className="text-xs mb-2 truncate" style={{ color: "var(--muted-foreground)" }}>
          🏢 {lead.empreendimento}
        </div>
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
        {lead.score ? (
          <span className="text-xs font-bold" style={{ color: scoreColor }}>{lead.score}</span>
        ) : null}
      </div>

      {lead.responsavel?.name && (
        <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          👤 {lead.responsavel.name.split(" ")[0]}
        </div>
      )}
    </div>
  );
}

export default function KanbanPage() {
  const { data: board, isLoading, isError } = useKanbanBoard();
  const moveCard = useMoveCard();
  const [dragging, setDragging] = useState<Lead | null>(null);

  const handleDrop = (status: LeadStatus) => {
    if (dragging && dragging.status !== status) {
      moveCard.mutate({ leadId: dragging.id, status, order: 0 });
    }
    setDragging(null);
  };

  return (
    <div className="h-full flex flex-col">
      <Header title="Kanban" subtitle="Fluxo comercial de leads" />

      {isLoading && (
        <div className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando board...</div>
      )}
      {isError && (
        <div className="p-6 text-sm" style={{ color: "#ef4444" }}>
          Erro ao carregar o board. Verifique se o backend está rodando.
        </div>
      )}

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full" style={{ minWidth: "max-content" }}>
          {(board ?? []).map((col) => (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id as LeadStatus)}
              className="flex flex-col rounded-2xl border"
              style={{ background: "var(--secondary)", borderColor: "var(--border)", width: "260px", minHeight: "500px" }}
            >
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{col.emoji}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{col.title}</span>
                  <span
                    className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                    style={{ background: col.color, color: "white" }}
                  >
                    {col.leads.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {col.leads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onDragStart={setDragging} />
                ))}
                {col.leads.length === 0 && (
                  <div
                    className="text-xs text-center py-8 rounded-xl border-2 border-dashed"
                    style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                  >
                    Arraste leads aqui
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
