"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { FolderPlus, Search, X, User, Pencil, FileText } from "lucide-react";
import { usePastas, useCreatePasta, useUpdatePasta, useUpdatePastaStatus, useGeneratePastaDocs, type Pasta } from "@/hooks/use-pastas";
import { useLeads } from "@/hooks/use-leads";
import { useProperties } from "@/hooks/use-properties";
import { useEmpresas } from "@/hooks/use-empresas";
import { getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

const STATUS: Record<string, { label: string; pct: number; color: string }> = {
  montando: { label: "Montando", pct: 20, color: "#3b82f6" },
  em_analise: { label: "Em análise", pct: 60, color: "#f59e0b" },
  complemento: { label: "Complemento", pct: 60, color: "#f59e0b" },
  aprovado: { label: "Aprovado", pct: 100, color: "#10b981" },
  reprovado: { label: "Reprovado", pct: 100, color: "#ef4444" },
};
const STATUS_KEYS = ["montando", "em_analise", "complemento", "aprovado", "reprovado"];
const brl = (v?: number) =>
  v != null ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—";

const EMPTY = {
  leadId: "", clientName: "", propertyId: "", empreendimento: "", construtora: "",
  unidade: "", bloco: "", apartamento: "", valorAvaliacao: "", valorVendaFinal: "",
  condicoesComerciais: "", observacoes: "", fase: "simplificada", perfil: "clt", empresaId: "",
};

export default function PastasPage() {
  const { data: pastas = [], isLoading } = usePastas();
  const createPasta = useCreatePasta();
  const updatePasta = useUpdatePasta();
  const updateStatus = useUpdatePastaStatus();
  const genDocs = useGeneratePastaDocs();
  const isEmpresa = getStoredUser()?.role === "empresa";

  const abrirDocs = async (p: Pasta) => {
    let token = p.docToken;
    if (!token) {
      try {
        const res = await genDocs.mutateAsync(p.id);
        token = res.token;
      } catch {
        return;
      }
    }
    if (token) window.open(`/docs/${token}`, "_blank");
  };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [clientQuery, setClientQuery] = useState("");
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const num = (v?: number) => (v != null ? String(v) : "");
  const novaPasta = () => {
    setEditingId(null);
    setForm({ ...EMPTY });
    setError("");
    setShowForm(true);
  };
  const editarPasta = (p: Pasta) => {
    setEditingId(p.id);
    setForm({
      leadId: p.leadId,
      clientName: p.clientName,
      propertyId: p.propertyId ?? "",
      empreendimento: p.empreendimento ?? "",
      construtora: p.construtora ?? "",
      unidade: p.unidade ?? "",
      bloco: p.bloco ?? "",
      apartamento: p.apartamento ?? "",
      valorAvaliacao: num(p.valorAvaliacao),
      valorVendaFinal: num(p.valorVendaFinal),
      condicoesComerciais: p.condicoesComerciais ?? "",
      observacoes: p.observacoes ?? "",
      fase: p.fase ?? "simplificada",
      perfil: p.perfil ?? "clt",
      empresaId: p.empresaId ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const { data: leadsResp } = useLeads({ search: clientQuery, limit: 8 });
  const clientResults = clientQuery.length >= 2 ? leadsResp?.data ?? [] : [];
  const { data: properties = [] } = useProperties();
  const { data: empresas = [] } = useEmpresas();
  const empresasAprovadas = empresas.filter((e) => e.status === "aprovada");

  const pickClient = (id: string, name: string) => {
    setForm((s) => ({ ...s, leadId: id, clientName: name }));
    setClientQuery("");
  };
  const pickProperty = (id: string) => {
    const p = (properties ?? []).find((x) => x.id === id);
    setForm((s) => ({ ...s, propertyId: id, empreendimento: p?.name ?? s.empreendimento }));
  };

  const inputStyle = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };
  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none";

  const criar = async () => {
    if (!form.leadId) {
      setError("Escolha um cliente.");
      return;
    }
    setError("");
    const payload: Partial<Pasta> = {
      leadId: form.leadId,
      propertyId: form.propertyId || undefined,
      empreendimento: form.empreendimento.trim() || undefined,
      construtora: form.construtora.trim() || undefined,
      unidade: form.unidade.trim() || undefined,
      bloco: form.bloco.trim() || undefined,
      apartamento: form.apartamento.trim() || undefined,
      valorAvaliacao: form.valorAvaliacao !== "" ? Number(form.valorAvaliacao) : undefined,
      valorVendaFinal: form.valorVendaFinal !== "" ? Number(form.valorVendaFinal) : undefined,
      condicoesComerciais: form.condicoesComerciais.trim() || undefined,
      observacoes: form.observacoes.trim() || undefined,
      fase: form.fase,
      perfil: form.perfil,
      empresaId: form.empresaId || undefined,
    };
    try {
      if (editingId) {
        await updatePasta.mutateAsync({ id: editingId, ...payload });
      } else {
        await createPasta.mutateAsync(payload);
      }
      setForm({ ...EMPTY });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao salvar a pasta."));
    }
  };

  return (
    <div>
      <Header title="Subir Pasta para Análise" subtitle="Monte a pasta do cliente e acompanhe a análise" />
      <div className="p-6 space-y-4">
        {!isEmpresa && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (showForm) {
                  setShowForm(false);
                  setEditingId(null);
                } else novaPasta();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--primary)", color: "white" }}
            >
              {showForm ? <X size={16} /> : <FolderPlus size={16} />}
              {showForm ? "Fechar" : "Nova pasta"}
            </button>
          </div>
        )}

        {showForm && (
          <div className="rounded-2xl p-5 border space-y-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{editingId ? "Editar pasta" : "Nova pasta"}</div>
            {error && <div className="text-sm p-2 rounded-lg" style={{ background: "#ef444422", color: "#ef4444" }}>{error}</div>}

            {/* Cliente */}
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Cliente</div>
              {form.leadId ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ ...inputStyle }}>
                  <User size={14} style={{ color: "var(--muted-foreground)" }} />
                  <span className="flex-1" style={{ color: "var(--foreground)" }}>{form.clientName}</span>
                  <button onClick={() => setForm((s) => ({ ...s, leadId: "", clientName: "" }))} style={{ color: "var(--muted-foreground)" }}><X size={14} /></button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={inputStyle}>
                    <Search size={14} style={{ color: "var(--muted-foreground)" }} />
                    <input value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} placeholder="Buscar cliente por nome/telefone…" className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--foreground)" }} />
                  </div>
                  {clientResults.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border max-h-56 overflow-y-auto" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      {clientResults.map((l) => (
                        <button key={l.id} onClick={() => pickClient(l.id, l.name)} className="w-full text-left px-3 py-2 text-sm" style={{ color: "var(--foreground)" }}>
                          {l.name} <span style={{ color: "var(--muted-foreground)" }}>· {l.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Empreendimento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Empreendimento</div>
                <select value={form.propertyId} onChange={(e) => pickProperty(e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="">— selecionar —</option>
                  {(properties ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <Campo label="Construtora" value={form.construtora} onChange={(v) => set("construtora", v)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Unidade" value={form.unidade} onChange={(v) => set("unidade", v)} />
              <Campo label="Bloco" value={form.bloco} onChange={(v) => set("bloco", v)} />
              <Campo label="Apartamento" value={form.apartamento} onChange={(v) => set("apartamento", v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Valor de avaliação (R$)" type="number" value={form.valorAvaliacao} onChange={(v) => set("valorAvaliacao", v)} />
              <Campo label="Valor de venda final (R$)" type="number" value={form.valorVendaFinal} onChange={(v) => set("valorVendaFinal", v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Fase</div>
                <select value={form.fase} onChange={(e) => set("fase", e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="simplificada">Simplificada</option>
                  <option value="completa">Completa</option>
                </select>
              </div>
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Perfil</div>
                <select value={form.perfil} onChange={(e) => set("perfil", e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="clt">CLT</option>
                  <option value="empresario">Empresário</option>
                </select>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Empresa parceira (análise)</div>
              <select value={form.empresaId} onChange={(e) => set("empresaId", e.target.value)} className={inputCls} style={inputStyle}>
                <option value="">— nenhuma —</option>
                {empresasAprovadas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nome || emp.email}</option>
                ))}
              </select>
              {empresasAprovadas.length === 0 && (
                <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Nenhuma empresa aprovada ainda (cadastre e libere em “Empresas”).</div>
              )}
            </div>
            <Campo label="Condições comerciais" value={form.condicoesComerciais} onChange={(v) => set("condicoesComerciais", v)} />
            <Campo label="Observações" value={form.observacoes} onChange={(v) => set("observacoes", v)} />

            <div className="flex justify-end">
              <button onClick={criar} disabled={createPasta.isPending || updatePasta.isPending} className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
                {createPasta.isPending || updatePasta.isPending ? "Salvando…" : editingId ? "Salvar alterações" : "Criar pasta"}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {isLoading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando…</div>
          ) : pastas.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma pasta ainda. Clique em “Nova pasta”.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {pastas.map((p) => {
                const st = STATUS[p.status] ?? STATUS.montando;
                return (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{p.clientName}</div>
                      <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                        {[p.empreendimento, p.unidade && `Un. ${p.unidade}`, p.bloco && `Bl. ${p.bloco}`, p.apartamento && `Ap. ${p.apartamento}`].filter(Boolean).join(" · ") || "Sem empreendimento"}
                        {p.valorVendaFinal ? ` · ${brl(p.valorVendaFinal)}` : ""}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                        <div className="h-full rounded-full" style={{ width: `${st.pct}%`, background: st.color }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => abrirDocs(p)} disabled={genDocs.isPending} title="Documentos" className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium disabled:opacity-60" style={{ color: "#10b981", background: "#10b98122" }}>
                        <FileText size={14} /> Docs
                      </button>
                      {!isEmpresa && (
                        <button onClick={() => editarPasta(p)} title="Editar" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>
                          <Pencil size={15} />
                        </button>
                      )}
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
                      <select
                        value={p.status}
                        onChange={(e) => updateStatus.mutate({ id: p.id, status: e.target.value })}
                        className="text-xs px-2 py-1.5 rounded-lg border outline-none"
                        style={inputStyle}
                      >
                        {STATUS_KEYS.map((k) => (
                          <option key={k} value={k}>{STATUS[k].label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <div className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
        style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
      />
    </div>
  );
}
