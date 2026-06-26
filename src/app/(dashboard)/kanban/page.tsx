"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { mockLeads, kanbanColumns } from "@/lib/mock-data";
import type { Lead, LeadStatus } from "@/types";
import { Plus, MoreHorizontal, MessageSquare } from "lucide-react";

function LeadCard({ lead }: { lead: Lead }) {
  const score = lead.score || 0;
  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div
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
          <div>
            <div className="text-sm font-medium leading-none" style={{ color: "var(--foreground)" }}>
              {lead.name.split(" ").slice(0, 2).join(" ")}
            </div>
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
            <span
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: "#22c55e18", color: "#22c55e" }}
            >
              <MessageSquare size={11} />
            </span>
          )}
          {lead.origem && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
            >
              {lead.origem.split(" ")[0]}
            </span>
          )}
        </div>
        {lead.score && (
          <span className="text-xs font-bold" style={{ color: scoreColor }}>
            {lead.score}
          </span>
        )}
      </div>

      {lead.responsavel && (
        <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          👤 {lead.responsavel.split(" ")[0]}
        </div>
      )}
    </div>
  );
}

export default function KanbanPage() {
  const [leads] = useState<Lead[]>(mockLeads);

  const getLeadsForColumn = (status: LeadStatus) =>
    leads.filter((l) => l.status === status);

  return (
    <div className="h-full flex flex-col">
      <Header
        title="Kanban"
        subtitle="Fluxo comercial de leads"
      />

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full" style={{ minWidth: "max-content" }}>
          {kanbanColumns.map((col) => {
            const colLeads = getLeadsForColumn(col.id as LeadStatus);
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-2xl border"
                style={{
                  background: "var(--secondary)",
                  borderColor: "var(--border)",
                  width: "260px",
                  minHeight: "500px",
                }}
              >
                {/* Column Header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{col.emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {col.title}
                    </span>
                    <span
                      className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                      style={{ background: col.color, color: "white" }}
                    >
                      {colLeads.length}
                    </span>
                  </div>
                  <button style={{ color: "var(--muted-foreground)" }}>
                    <Plus size={16} />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {colLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                  {colLeads.length === 0 && (
                    <div
                      className="text-xs text-center py-8 rounded-xl border-2 border-dashed"
                      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                    >
                      Arraste leads aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
