"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { FolderPlus, Search, X, User, Pencil, FileText, Eye, ExternalLink, StickyNote, Clock, Lock, Trash2 } from "lucide-react";
import { usePastas, useCreatePasta, useUpdatePasta, useUpdatePastaStatus, useGeneratePastaDocs, usePastaFiles, useReleasePastaDocs, useDeletePasta, useAddPendencia, openPastaFile, type Pasta } from "@/hooks/use-pastas";
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
const analiseLabel = (n?: number) => (n != null ? `Análise ${String(n).padStart(2, "0")}` : "");

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
  const deletePasta = useDeletePasta();
  const storedUser = getStoredUser() as any;
  const isEmpresa = !!storedUser?.empresaId;
  const isDiretor = storedUser?.role === "diretor";
  // Veredito (complemento/aprovado/reprovado) só Diretor ou empresa parceira;
  // corretor/gestores só movem entre "montando" e "em_analise".
  const statusOptions = isEmpresa || isDiretor ? STATUS_KEYS : ["montando", "em_analise"];

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

  const excluir = async (p: Pasta) => {
    const rotulo = analiseLabel(p.numero) || "esta pasta";
    if (!window.confirm(`Excluir ${rotulo} — ${p.clientName}? Isso apaga também os documentos enviados. Não dá para desfazer.`)) return;
    try {
      await deletePasta.mutateAsync(p.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao excluir a pasta."));
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<Pasta | null>(null);
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
                      <div className="flex items-center gap-2">
                        {p.numero != null && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap" style={{ background: "var(--primary)", color: "white" }}>
                            {analiseLabel(p.numero)}
                          </span>
                        )}
                        <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{p.clientName}</span>
                      </div>
                      <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                        {[p.empreendimento, p.unidade && `Un. ${p.unidade}`, p.bloco && `Bl. ${p.bloco}`, p.apartamento && `Ap. ${p.apartamento}`].filter(Boolean).join(" · ") || "Sem empreendimento"}
                        {p.valorVendaFinal ? ` · ${brl(p.valorVendaFinal)}` : ""}
                      </div>
                      {p.parecer && (
                        <div className="text-xs mt-1 flex items-start gap-1.5" style={{ color: "#f59e0b" }}>
                          <StickyNote size={12} className="flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{p.parecer}</span>
                        </div>
                      )}
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                        <div className="h-full rounded-full" style={{ width: `${st.pct}%`, background: st.color }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewing(p)} title="Ver documentos enviados" className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium" style={{ color: "#3b82f6", background: "#3b82f622" }}>
                        <Eye size={14} /> Ver docs
                      </button>
                      {!isEmpresa && (
                        <button onClick={() => abrirDocs(p)} disabled={genDocs.isPending} title="Ambiente de upload (link do cliente)" className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium disabled:opacity-60" style={{ color: "#10b981", background: "#10b98122" }}>
                          <FileText size={14} /> Upload
                        </button>
                      )}
                      {!isEmpresa && (
                        <button onClick={() => editarPasta(p)} title="Editar" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>
                          <Pencil size={15} />
                        </button>
                      )}
                      {isDiretor && (
                        <button onClick={() => excluir(p)} disabled={deletePasta.isPending} title="Excluir pasta" className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-60" style={{ color: "#ef4444", background: "#ef444422" }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
                      {/* Cargos restritos não mexem em pasta já com veredito (mostra só o selo). */}
                      {(statusOptions.includes(p.status) || statusOptions.length === STATUS_KEYS.length) && (
                        <select
                          value={p.status}
                          onChange={(e) => updateStatus.mutate({ id: p.id, status: e.target.value })}
                          className="text-xs px-2 py-1.5 rounded-lg border outline-none"
                          style={inputStyle}
                        >
                          {statusOptions.map((k) => (
                            <option key={k} value={k}>{STATUS[k].label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {viewing && <DocsViewer pasta={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

const fmtDateTime = (s?: string) =>
  s
    ? new Date(s).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const TIPO_LABEL: Record<string, string> = {
  rg_cnh: "RG ou CNH",
  cpf: "CPF",
  comprovante_residencia: "Comprovante de residência",
  contracheque: "Contracheque",
  contracheques: "Contracheques",
  imposto_renda: "Imposto de renda",
  extrato_bancario: "Extrato bancário",
  certidao_nascimento: "Certidão de nascimento",
  certidao_casamento: "Certidão de casamento",
  carteira_trabalho: "Carteira de trabalho",
  comprovante_renda: "Comprovante de renda",
};

function fmtRemaining(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function WindowBanner({ color, icon, children }: { color: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs" style={{ background: `${color}18`, color }}>
      <span className="flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function DocsViewer({ pasta, onClose }: { pasta: Pasta; onClose: () => void }) {
  const { data, isLoading } = usePastaFiles(pasta.id);
  const [opening, setOpening] = useState<string | null>(null);
  const docs = data?.documents ?? [];
  const win = data?.window;

  const isEmpresa = !!(getStoredUser() as any)?.empresaId;
  const updatePasta = useUpdatePasta();
  const releaseDocs = useReleasePastaDocs();
  const addPend = useAddPendencia();
  const [parecer, setParecer] = useState(pasta.parecer ?? "");
  const [savedMsg, setSavedMsg] = useState("");
  const [pendLabel, setPendLabel] = useState("");
  const [pendMsg, setPendMsg] = useState("");

  // Cronômetro ao vivo enquanto a janela de 40 min estiver ativa.
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    if (!win?.active) return;
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [win?.active, win?.expiresAt]);
  const remainingMs = win?.expiresAt ? new Date(win.expiresAt).getTime() - nowTs : 0;
  const empresaBloqueada = isEmpresa && (!win?.active || remainingMs <= 0);

  const abrir = async (docId: string) => {
    setOpening(docId);
    try {
      await openPastaFile(pasta.id, docId);
    } finally {
      setOpening(null);
    }
  };

  const salvarParecer = async () => {
    setSavedMsg("");
    try {
      await updatePasta.mutateAsync({ id: pasta.id, parecer });
      setSavedMsg("✓ Observação salva.");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch {
      setSavedMsg("Não foi possível salvar.");
    }
  };

  const liberar = async () => {
    try {
      await releaseDocs.mutateAsync(pasta.id);
    } catch {
      /* ignora */
    }
  };

  const pedirPendencia = async () => {
    const label = pendLabel.trim();
    if (!label) return;
    setPendMsg("");
    try {
      await addPend.mutateAsync({ id: pasta.id, label });
      setPendLabel("");
      setPendMsg("✓ Pedido criado — o cliente verá o novo espaço no link.");
      setTimeout(() => setPendMsg(""), 3500);
    } catch {
      setPendMsg("Não foi possível pedir.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border max-h-[85vh] overflow-hidden flex flex-col" style={{ background: "var(--card)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="font-semibold" style={{ color: "var(--foreground)" }}>
              {pasta.numero != null ? `${analiseLabel(pasta.numero)} · ` : ""}{pasta.clientName}
            </div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Análise {pasta.fase === "completa" ? "completa" : "simplificada"}</div>
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X size={18} /></button>
        </div>

        {/* Janela de 40 minutos (Fase 5) */}
        <div className="px-4 pt-3">
          {isEmpresa ? (
            !win?.released ? (
              <WindowBanner color="#f59e0b" icon={<Clock size={14} />}>
                Aguardando o corretor liberar os documentos para análise.
              </WindowBanner>
            ) : empresaBloqueada ? (
              <WindowBanner color="#ef4444" icon={<Lock size={14} />}>
                Janela expirada — documentos arquivados com segurança. Peça ao corretor para liberar novamente.
              </WindowBanner>
            ) : (
              <WindowBanner color="#10b981" icon={<Clock size={14} />}>
                Documentos disponíveis por mais <strong>{fmtRemaining(remainingMs)}</strong> — baixe o que precisar.
              </WindowBanner>
            )
          ) : (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: "var(--secondary)" }}>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {!win?.released
                  ? "Empresa: ainda não liberado."
                  : win.active && remainingMs > 0
                  ? `Empresa: janela ativa (${fmtRemaining(remainingMs)})`
                  : "Empresa: janela expirada (arquivado)."}
              </span>
              <button onClick={liberar} disabled={releaseDocs.isPending} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-60 flex-shrink-0" style={{ background: "var(--primary)", color: "white" }}>
                <Clock size={13} /> {releaseDocs.isPending ? "Liberando…" : win?.released ? "Reabrir (40 min)" : "Liberar (40 min)"}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando…</div>
          ) : empresaBloqueada ? (
            <div className="py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Os documentos ficam disponíveis por 40 minutos após a liberação do corretor.
            </div>
          ) : docs.length === 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum documento enviado ainda.</div>
          ) : (
            docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                <FileText size={16} style={{ color: "#10b981" }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{TIPO_LABEL[d.tipo] ?? d.tipo}</div>
                  <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{d.filename}</div>
                  {d.uploadedAt && (
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      Enviado em {fmtDateTime(d.uploadedAt)}
                    </div>
                  )}
                </div>
                <button onClick={() => abrir(d.id)} disabled={opening === d.id} className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-60 flex-shrink-0" style={{ color: "white", background: "var(--primary)" }}>
                  <ExternalLink size={13} /> {opening === d.id ? "Abrindo…" : "Abrir"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pedir documento pendente (abre espaço novo no mesmo link) */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Pedir documento pendente
          </div>
          <div className="flex items-center gap-2">
            <input
              value={pendLabel}
              onChange={(e) => setPendLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pedirPendencia()}
              placeholder="Ex.: Extrato do FGTS de abril"
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <button
              onClick={pedirPendencia}
              disabled={addPend.isPending || !pendLabel.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 flex-shrink-0"
              style={{ background: "#f59e0b", color: "white" }}
            >
              {addPend.isPending ? "Pedindo…" : "Pedir"}
            </button>
          </div>
          {pendMsg && <div className="text-xs" style={{ color: "#10b981" }}>{pendMsg}</div>}
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Cria um espaço extra no mesmo link do cliente, sem apagar o que já foi enviado.
          </div>
        </div>

        {/* Parecer / observações da empresa parceira */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Parecer / observações
          </div>
          <textarea
            value={parecer}
            onChange={(e) => setParecer(e.target.value)}
            rows={3}
            placeholder="Ex.: Aprovado, mas com ressalva — falta o extrato do FGTS de abril."
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
            style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
          <div className="flex items-center justify-end gap-3">
            {savedMsg && <span className="text-xs" style={{ color: "#10b981" }}>{savedMsg}</span>}
            <button
              onClick={salvarParecer}
              disabled={updatePasta.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ background: "var(--primary)", color: "white" }}
            >
              {updatePasta.isPending ? "Salvando…" : "Salvar observação"}
            </button>
          </div>
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
