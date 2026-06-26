"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { mockLeads } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types";
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Phone,
  MessageSquare,
  Eye,
  MoreHorizontal,
} from "lucide-react";

const statusLabels: Record<LeadStatus, string> = {
  novo_lead: "Novo Lead",
  primeiro_contato: "Primeiro Contato",
  em_atendimento: "Em Atendimento",
  documentacao: "Documentação",
  agendamento: "Agendamento",
  visita_agendada: "Visita Agendada",
  visita_realizada: "Visita Realizada",
  simulacao: "Simulação",
  subida_pasta: "Subida de Pasta",
  assinatura: "Assinatura",
  venda_ganha: "Venda Ganha",
  venda_perdida: "Venda Perdida",
};

const statusColors: Record<LeadStatus, string> = {
  novo_lead: "#6366f1",
  primeiro_contato: "#8b5cf6",
  em_atendimento: "#3b82f6",
  documentacao: "#06b6d4",
  agendamento: "#10b981",
  visita_agendada: "#f59e0b",
  visita_realizada: "#84cc16",
  simulacao: "#f97316",
  subida_pasta: "#ec4899",
  assinatura: "#14b8a6",
  venda_ganha: "#22c55e",
  venda_perdida: "#ef4444",
};

function ScoreBadge({ score }: { score?: number }) {
  if (!score) return <span style={{ color: "var(--muted-foreground)" }}>—</span>;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{score}</span>
    </div>
  );
}

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = mockLeads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <Header title="Leads / CRM" subtitle={`${mockLeads.length} leads cadastrados`} />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div
            className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <Search size={16} style={{ color: "var(--muted-foreground)" }} />
            <input
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--foreground)" }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <option value="all">Todos os status</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <Upload size={16} />
              Importar
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <Download size={16} />
              Exportar
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <Plus size={16} />
              Novo Lead
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Nome", "Contato", "Empreendimento", "Responsável", "Score", "Status", "Cadastro", "Ações"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b transition-colors hover:opacity-90"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--primary)", color: "white" }}
                        >
                          {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                            {lead.name}
                          </div>
                          {lead.cidade && (
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {lead.cidade}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" style={{ color: "var(--foreground)" }}>{lead.phone}</div>
                      {lead.email && (
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {lead.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" style={{ color: "var(--foreground)" }}>
                        {lead.empreendimento || "—"}
                      </div>
                      {lead.origem && (
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {lead.origem}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" style={{ color: "var(--foreground)" }}>
                        {lead.responsavel || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
                        style={{
                          background: `${statusColors[lead.status]}18`,
                          color: statusColors[lead.status],
                        }}
                      >
                        {statusLabels[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: "var(--muted-foreground)" }}
                          title="Ver lead"
                        >
                          <Eye size={14} />
                        </button>
                        {lead.phone && (
                          <button
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ color: "#22c55e" }}
                            title="WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: "var(--muted-foreground)" }}
                          title="Mais ações"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center" style={{ color: "var(--muted-foreground)" }}>
              Nenhum lead encontrado.
            </div>
          )}

          <div
            className="px-4 py-3 flex items-center justify-between border-t text-sm"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            <span>Mostrando {filtered.length} de {mockLeads.length} leads</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)" }}>Anterior</button>
              <button className="px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)" }}>Próximo</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
