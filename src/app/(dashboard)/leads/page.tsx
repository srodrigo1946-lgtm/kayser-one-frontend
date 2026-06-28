"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/layout/header";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import type { LeadStatus } from "@/types";
import {
  useLeads,
  useCreateLead,
  useDeleteLead,
  useImportLeads,
  useLeadHistory,
  exportLeads,
} from "@/hooks/use-leads";
import type { Lead } from "@/types";
import {
  Search,
  Download,
  Upload,
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  Eye,
  X,
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
  const [feedback, setFeedback] = useState<string>("");
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useLeads({ search, status: filterStatus });
  const createLead = useCreateLead();
  const deleteLead = useDeleteLead();
  const importLeads = useImportLeads();

  const leads = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback("");
    try {
      const res = await importLeads.mutateAsync(file);
      setFeedback(`Importação concluída: ${res.imported} novos, ${res.duplicates} duplicados (de ${res.total} linhas).`);
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao importar a planilha."));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleNewLead = async () => {
    const name = window.prompt("Nome do lead:");
    if (!name) return;
    const phone = window.prompt("Telefone (somente números):");
    if (!phone) return;
    setFeedback("");
    try {
      await createLead.mutateAsync({ name, phone });
      setFeedback("Lead criado com sucesso.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao criar o lead."));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remover o lead "${name}"?`)) return;
    try {
      await deleteLead.mutateAsync(id);
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao remover o lead."));
    }
  };

  const handleExport = async () => {
    try {
      await exportLeads();
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao exportar."));
    }
  };

  return (
    <div>
      <Header title="Leads / CRM" subtitle={`${total} leads cadastrados`} />

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
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <option value="all">Todos os status</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importLeads.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium disabled:opacity-60"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              {importLeads.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Importar
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <Download size={16} />
              Exportar
            </button>
            <button
              onClick={handleNewLead}
              disabled={createLead.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <Plus size={16} />
              Novo Lead
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className="text-sm p-3 rounded-xl"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            {feedback}
          </div>
        )}

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
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--primary)", color: "white" }}
                        >
                          {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{lead.name}</div>
                          {lead.cidade && (
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{lead.cidade}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" style={{ color: "var(--foreground)" }}>{lead.phone}</div>
                      {lead.email && (
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{lead.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" style={{ color: "var(--foreground)" }}>{lead.empreendimento || "—"}</div>
                      {lead.origem && (
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{lead.origem}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm" style={{ color: "var(--foreground)" }}>{lead.responsavel?.name || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
                        style={{ background: `${statusColors[lead.status]}18`, color: statusColors[lead.status] }}
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
                          onClick={() => setDetailLead(lead)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: "var(--muted-foreground)" }}
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </button>
                        {lead.whatsapp && (
                          <button
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ color: "#22c55e" }}
                            title="WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(lead.id, lead.name)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: "#ef4444" }}
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isLoading && (
            <div className="py-16 text-center" style={{ color: "var(--muted-foreground)" }}>
              Carregando leads...
            </div>
          )}
          {isError && (
            <div className="py-16 text-center" style={{ color: "#ef4444" }}>
              Erro ao carregar leads. Verifique se o backend está rodando.
            </div>
          )}
          {!isLoading && !isError && leads.length === 0 && (
            <div className="py-16 text-center" style={{ color: "var(--muted-foreground)" }}>
              Nenhum lead encontrado.
            </div>
          )}

          <div
            className="px-4 py-3 flex items-center justify-between border-t text-sm"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            <span>Mostrando {leads.length} de {total} leads</span>
          </div>
        </div>
      </div>

      {detailLead && <LeadDetailDrawer lead={detailLead} onClose={() => setDetailLead(null)} />}
    </div>
  );
}

function LeadDetailDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
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
