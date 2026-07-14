"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Building2, Plus, Check, X, KeyRound } from "lucide-react";
import { useEmpresas, useCreateEmpresa, useSetEmpresaStatus } from "@/hooks/use-empresas";
import { getApiErrorMessage } from "@/lib/api";

const STATUS: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "#f59e0b" },
  aprovada: { label: "Aprovada", color: "#10b981" },
  reprovada: { label: "Reprovada", color: "#ef4444" },
};

export default function EmpresasPage() {
  const { data: empresas = [], isLoading } = useEmpresas();
  const createEmpresa = useCreateEmpresa();
  const setStatus = useSetEmpresaStatus();
  const [form, setForm] = useState({ cnpj: "", email: "", nome: "" });
  const [error, setError] = useState("");
  const [creds, setCreds] = useState<{ email: string; senhaProvisoria: string } | null>(null);

  const aprovar = async (id: string) => {
    setError("");
    try {
      const r: any = await setStatus.mutateAsync({ id, status: "aprovada" });
      if (r?.credenciais) setCreds(r.credenciais);
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao aprovar / gerar acesso da empresa."));
    }
  };
  const loginLink = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";

  const inputStyle = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };
  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none";

  const criar = async () => {
    if (!form.cnpj.trim() || !form.email.trim()) {
      setError("CNPJ e e-mail são obrigatórios.");
      return;
    }
    setError("");
    try {
      await createEmpresa.mutateAsync({ cnpj: form.cnpj.trim(), email: form.email.trim(), nome: form.nome.trim() || undefined });
      setForm({ cnpj: "", email: "", nome: "" });
    } catch (err) {
      setError(getApiErrorMessage(err, "Falha ao cadastrar empresa."));
    }
  };

  return (
    <div>
      <Header title="Empresas Parceiras" subtitle="Cadastre e libere as empresas que analisam as pastas" />
      <div className="p-6 space-y-4">
        {creds && (
          <div className="rounded-2xl p-4 border" style={{ background: "#10b98111", borderColor: "#10b98155" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm" style={{ color: "var(--foreground)" }}>
                <div className="font-semibold mb-1" style={{ color: "#10b981" }}>Empresa aprovada — envie o acesso para ela:</div>
                <div>🔗 Link: <span className="font-mono">{loginLink}</span></div>
                <div>✉️ Login: <span className="font-mono">{creds.email}</span></div>
                <div>🔑 Senha provisória: <span className="font-mono">{creds.senhaProvisoria}</span></div>
                <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>A empresa troca a senha no primeiro acesso.</div>
              </div>
              <button onClick={() => setCreds(null)} style={{ color: "var(--muted-foreground)" }}><X size={16} /></button>
            </div>
          </div>
        )}
        <div className="rounded-2xl p-5 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {error && <div className="text-sm p-2 rounded-lg mb-3" style={{ background: "#ef444422", color: "#ef4444" }}>{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={form.cnpj} onChange={(e) => setForm((s) => ({ ...s, cnpj: e.target.value }))} placeholder="CNPJ" className={inputCls} style={inputStyle} />
            <input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="E-mail corporativo" className={inputCls} style={inputStyle} />
            <input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} placeholder="Nome (opcional)" className={inputCls} style={inputStyle} />
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={criar} disabled={createEmpresa.isPending} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
              <Plus size={16} /> {createEmpresa.isPending ? "Cadastrando…" : "Cadastrar empresa"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {isLoading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando…</div>
          ) : empresas.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma empresa cadastrada.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {empresas.map((e) => {
                const st = STATUS[e.status] ?? STATUS.pendente;
                return (
                  <div key={e.id} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--secondary)" }}>
                      <Building2 size={18} style={{ color: "var(--muted-foreground)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate" style={{ color: "var(--foreground)" }}>{e.nome || e.email}</div>
                      <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>CNPJ {e.cnpj} · {e.email}</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
                    {e.status !== "aprovada" ? (
                      <button onClick={() => aprovar(e.id)} title="Aprovar" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: "#10b981", background: "#10b98122" }}><Check size={16} /></button>
                    ) : (
                      <button onClick={() => aprovar(e.id)} title="Gerar/mostrar acesso" className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium" style={{ color: "#10b981", background: "#10b98122" }}><KeyRound size={14} /> Acesso</button>
                    )}
                    {e.status !== "reprovada" && (
                      <button onClick={() => setStatus.mutate({ id: e.id, status: "reprovada" })} title="Reprovar" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: "#ef4444", background: "#ef444422" }}><X size={16} /></button>
                    )}
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
