"use client";

import { useState } from "react";
import { X, Pencil, Loader2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import { useLeadHistory, useUpdateLead } from "@/hooks/use-leads";
import { useProperties } from "@/hooks/use-properties";
import { useUsers } from "@/hooks/use-users";
import type { Lead } from "@/types";

export function LeadDetailDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [current, setCurrent] = useState<Lead>(lead);
  const [editing, setEditing] = useState(false);
  const { data: history, isLoading } = useLeadHistory(current.id);

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
              {current.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>{current.name}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{current.cidade || "—"}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!editing && (
              <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: "var(--muted-foreground)" }} title="Editar lead">
                <Pencil size={16} />
              </button>
            )}
            <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X size={20} /></button>
          </div>
        </div>

        {editing ? (
          <LeadEditForm
            lead={current}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => {
              setCurrent((c) => ({ ...c, ...updated }));
              setEditing(false);
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              <Detail label="Telefone" value={current.phone} />
              <Detail label="E-mail" value={current.email || "—"} />
              <Detail label="Empreendimento" value={current.empreendimento || "—"} />
              <Detail label="Origem" value={current.origem || "—"} />
              <Detail label="Responsável" value={current.responsavel?.name || "—"} />
              <Detail label="Score" value={current.score != null ? String(current.score) : "—"} />
              <Detail label="Renda" value={current.renda ? formatCurrency(current.renda) : "—"} />
              <Detail label="FGTS" value={current.fgts ? formatCurrency(current.fgts) : "—"} />
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
          </>
        )}
      </div>
    </div>
  );
}

function LeadEditForm({
  lead,
  onCancel,
  onSaved,
}: {
  lead: Lead;
  onCancel: () => void;
  onSaved: (updated: Partial<Lead>) => void;
}) {
  const updateLead = useUpdateLead();
  const { data: properties } = useProperties();
  const { data: teamUsers } = useUsers();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [respOpen, setRespOpen] = useState(false);
  const [respQuery, setRespQuery] = useState("");

  const [form, setForm] = useState({
    name: lead.name ?? "",
    phone: lead.phone ?? "",
    whatsapp: lead.whatsapp ?? "",
    email: lead.email ?? "",
    responsavelId: lead.responsavelId ?? lead.responsavel?.id ?? "",
    propertyId: lead.propertyId ?? "",
    empreendimento: lead.empreendimento ?? "",
    origem: lead.origem ?? "",
    cidade: lead.cidade ?? "",
    renda: lead.renda != null ? String(lead.renda) : "",
    fgts: lead.fgts != null ? String(lead.fgts) : "",
    observacoes: lead.observacoes ?? "",
  });
  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  // Se o lead tem empreendimento em texto mas sem vínculo, avisa.
  const semVinculo = !form.propertyId && !!lead.empreendimento;

  const pickProperty = (id: string) => {
    const p = (properties ?? []).find((x) => x.id === id);
    setForm((s) => ({ ...s, propertyId: id, empreendimento: p?.name ?? (id ? s.empreendimento : "") }));
  };

  // Busca de responsável (lupa) — filtra os corretores pelo nome.
  const filteredUsers = (teamUsers ?? []).filter((u) =>
    (u.name || "").toLowerCase().includes(respQuery.toLowerCase())
  );
  const selectedRespName = (teamUsers ?? []).find((u) => u.id === form.responsavelId)?.name;
  const pickResp = (id: string) => {
    set("responsavelId", id);
    setRespOpen(false);
    setRespQuery("");
  };

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Nome e telefone são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    const payload: Partial<Lead> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || undefined,
      email: form.email.trim() || undefined,
      propertyId: form.propertyId || undefined,
      empreendimento: form.empreendimento.trim() || undefined,
      origem: form.origem.trim() || undefined,
      cidade: form.cidade.trim() || undefined,
      renda: form.renda !== "" ? Number(form.renda) : undefined,
      fgts: form.fgts !== "" ? Number(form.fgts) : undefined,
      observacoes: form.observacoes.trim() || undefined,
      responsavelId: form.responsavelId || undefined,
    };
    try {
      await updateLead.mutateAsync({ id: lead.id, ...payload });
      onSaved(payload);
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao salvar o lead."));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };

  return (
    <div className="space-y-3">
      {error && <div className="text-sm p-2 rounded-lg" style={{ background: "#ef444422", color: "#ef4444" }}>{error}</div>}

      <Field label="Nome *">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone *"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
        <Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
      </div>
      <Field label="E-mail"><input value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>

      <Field label="Responsável (corretor/atendente)">
        <div className="relative">
          {respOpen ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={inputStyle}>
              <Search size={14} style={{ color: "var(--muted-foreground)" }} />
              <input
                autoFocus
                value={respQuery}
                onChange={(e) => setRespQuery(e.target.value)}
                onBlur={() => setTimeout(() => setRespOpen(false), 150)}
                placeholder="Buscar corretor pelo nome..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--foreground)" }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setRespOpen(true); setRespQuery(""); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            >
              <Search size={14} style={{ color: "var(--muted-foreground)" }} />
              <span className="flex-1 text-left" style={{ color: selectedRespName ? "var(--foreground)" : "var(--muted-foreground)" }}>
                {selectedRespName || "— Sem responsável —"}
              </span>
            </button>
          )}
          {respOpen && (
            <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border max-h-52 overflow-y-auto" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <button type="button" onMouseDown={() => pickResp("")} className="w-full text-left px-3 py-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                — Sem responsável —
              </button>
              {filteredUsers.map((u) => (
                <button key={u.id} type="button" onMouseDown={() => pickResp(u.id)} className="w-full text-left px-3 py-2 text-sm" style={{ color: "var(--foreground)" }}>
                  {u.name}{u.role ? ` · ${u.role}` : ""}
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="px-3 py-2 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum corretor encontrado.</div>
              )}
            </div>
          )}
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Ao fechar a venda, ela é contada para o responsável no ranking.</div>
      </Field>

      <Field label="Empreendimento (imóvel)">
        <select value={form.propertyId} onChange={(e) => pickProperty(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle}>
          <option value="">— Selecione o imóvel —</option>
          {(properties ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}{p.cidade ? ` · ${p.cidade}` : ""}</option>
          ))}
        </select>
        {semVinculo && (
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Atual (texto): {lead.empreendimento}</div>
        )}
        {(properties ?? []).length === 0 && (
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Nenhum imóvel cadastrado ainda — cadastre em “Imóveis”.</div>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Origem"><input value={form.origem} onChange={(e) => set("origem", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
        <Field label="Cidade"><input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Renda (R$)"><input type="number" value={form.renda} onChange={(e) => set("renda", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
        <Field label="FGTS (R$)"><input type="number" value={form.fgts} onChange={(e) => set("fgts", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} /></Field>
      </div>
      <Field label="Observações">
        <textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={inputStyle} />
      </Field>

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</button>
        <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
          {saving && <Loader2 size={16} className="animate-spin" />} Salvar
        </button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</div>
      {children}
    </div>
  );
}
