"use client";

import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLeadHistory } from "@/hooks/use-leads";
import type { Lead } from "@/types";

export function LeadDetailDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data: history, isLoading } = useLeadHistory(lead.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div
        className="w-full max-w-md h-full overflow-y-auto p-6"
        style={{ background: "var(--card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--primary)", color: "white" }}>
              {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>{lead.name}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{lead.cidade || "—"}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <Detail label="Telefone" value={lead.phone} />
          <Detail label="E-mail" value={lead.email || "—"} />
          <Detail label="Empreendimento" value={lead.empreendimento || "—"} />
          <Detail label="Origem" value={lead.origem || "—"} />
          <Detail label="Responsável" value={lead.responsavel?.name || "—"} />
          <Detail label="Score" value={lead.score != null ? String(lead.score) : "—"} />
          <Detail label="Renda" value={lead.renda ? formatCurrency(lead.renda) : "—"} />
          <Detail label="FGTS" value={lead.fgts ? formatCurrency(lead.fgts) : "—"} />
        </div>

        <h4 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>Histórico</h4>
        {isLoading && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando...</p>}
        <div className="space-y-3">
          {(history ?? []).map((h) => (
            <div key={h.id} className="flex gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--primary)" }} />
              <div>
                <div className="text-sm" style={{ color: "var(--foreground)" }}>{h.description}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(h.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>
          ))}
          {!isLoading && (history ?? []).length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Sem histórico ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</div>
      <div style={{ color: "var(--foreground)" }}>{value}</div>
    </div>
  );
}
