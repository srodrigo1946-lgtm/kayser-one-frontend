"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Loader2, Plus, ExternalLink, RefreshCw } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

type Cliente = {
  id: string;
  empresa: string;
  subdominio: string;
  plano: string;
  limiteUsuarios: number;
  diretorNome: string;
  diretorEmail: string;
  status: "criando" | "ativo" | "erro";
  etapa: string | null;
  erro: string | null;
  createdAt: string;
};
type Resposta = { configurado: boolean; planos: Record<string, number>; personalizado: string; clientes: Cliente[] };

const slug = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(ltda|me|eireli|s\/?a)\b/g, "").replace(/[^a-z0-9-]+/g, "").slice(0, 30);

/**
 * Venda do Kayser One: criar a instalação de uma imobiliária com 1 clique (Railway + banco +
 * subdomínio + e-mail de boas-vindas). Só o Diretor da Kayser.
 */
export default function ClientesSaasPage() {
  const [permitido, setPermitido] = useState<boolean | null>(null);
  const [dados, setDados] = useState<Resposta | null>(null);
  const [f, setF] = useState({ empresa: "", subdominio: "", plano: "Gerente de Vendas", limiteUsuarios: "", diretorNome: "", diretorEmail: "" });
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setPermitido(getStoredUser()?.role === "diretor"), []);

  const carregar = () =>
    api
      .get<Resposta>("/clientes-saas")
      .then((r) => setDados(r.data))
      .catch((e) => setMsg(getApiErrorMessage(e, "Não consegui carregar os clientes.")));

  useEffect(() => {
    if (permitido) carregar();
  }, [permitido]);

  // Enquanto algum cliente está sendo criado, atualiza a cada 10 s.
  useEffect(() => {
    if (!dados?.clientes.some((c) => c.status === "criando")) return;
    const t = setInterval(carregar, 10_000);
    return () => clearInterval(t);
  }, [dados]);

  if (permitido === null) return null;
  if (!permitido) return <div className="p-6 text-sm">Área restrita ao Diretor.</div>;

  const sub = slug(f.subdominio || f.empresa);
  const personalizado = f.plano === dados?.personalizado;

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Criar o Kayser One da ${f.empresa} em ${sub}.kayserone.com.br, plano ${f.plano}${personalizado ? ` (${f.limiteUsuarios} usuários)` : ""}?\n\nIsso cria um servidor no Railway (custo mensal).`)) return;
    setEnviando(true);
    setMsg("");
    try {
      await api.post("/clientes-saas", { ...f, subdominio: f.subdominio || undefined, limiteUsuarios: personalizado ? Number(f.limiteUsuarios) : undefined });
      setMsg("✅ Criando! Acompanhe abaixo — leva uns 5 a 10 minutos.");
      setF({ empresa: "", subdominio: "", plano: f.plano, limiteUsuarios: "", diretorNome: "", diretorEmail: "" });
      carregar();
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Não consegui criar."));
    } finally {
      setEnviando(false);
    }
  };

  const tentar = async (id: string) => {
    await api.post(`/clientes-saas/${id}/tentar-de-novo`).catch((e) => setMsg(getApiErrorMessage(e)));
    carregar();
  };

  const input = "w-full px-3 py-2 rounded-xl border text-sm";
  const estilo = { background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" };
  const cor = (s: Cliente["status"]) => (s === "ativo" ? "#22c55e" : s === "erro" ? "#ef4444" : "#f59e0b");

  return (
    <div>
      <Header title="Clientes (venda do Kayser One)" subtitle="Crie a instalação de uma imobiliária com 1 clique" />
      <div className="p-6 space-y-6 max-w-5xl">
        {dados && !dados.configurado && (
          <div className="p-4 rounded-2xl text-sm" style={{ background: "#f59e0b1a", color: "#f59e0b", border: "1px solid #f59e0b55" }}>
            Falta configurar as chaves do Railway no servidor da Kayser (RAILWAY_API_TOKEN e os IDs do projeto dos clientes). Até lá, o botão Criar não funciona.
          </div>
        )}

        <form onSubmit={criar} className="rounded-2xl border p-5 grid gap-3 sm:grid-cols-2" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <label className="text-sm" style={{ color: "var(--foreground)" }}>
            Imobiliária
            <input required maxLength={80} value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} className={input} style={estilo} placeholder="Imobiliária Exemplo" />
          </label>
          <label className="text-sm" style={{ color: "var(--foreground)" }}>
            Subdomínio (opcional)
            <input maxLength={30} value={f.subdominio} onChange={(e) => setF({ ...f, subdominio: e.target.value })} className={input} style={estilo} placeholder={sub || "imobexemplo"} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {sub ? `${sub}.kayserone.com.br` : "gerado pelo nome da imobiliária"}
            </span>
          </label>
          <label className="text-sm" style={{ color: "var(--foreground)" }}>
            Plano
            <select value={f.plano} onChange={(e) => setF({ ...f, plano: e.target.value })} className={input} style={estilo}>
              {Object.entries(dados?.planos ?? {}).map(([p, n]) => (
                <option key={p} value={p}>
                  {p} — até {n} usuário{n > 1 ? "s" : ""}
                </option>
              ))}
              {dados?.personalizado && <option value={dados.personalizado}>{dados.personalizado} — digitar usuários</option>}
            </select>
            {personalizado && (
              <input required type="number" min={1} max={100000} value={f.limiteUsuarios} onChange={(e) => setF({ ...f, limiteUsuarios: e.target.value })} className={input + " mt-2"} style={estilo} placeholder="Quantidade de usuários (ex.: 450)" />
            )}
          </label>
          <label className="text-sm" style={{ color: "var(--foreground)" }}>
            Nome do Diretor
            <input required maxLength={80} value={f.diretorNome} onChange={(e) => setF({ ...f, diretorNome: e.target.value })} className={input} style={estilo} />
          </label>
          <label className="text-sm sm:col-span-2" style={{ color: "var(--foreground)" }}>
            E-mail do Diretor (vira o login e recebe as boas-vindas)
            <input required type="email" maxLength={160} value={f.diretorEmail} onChange={(e) => setF({ ...f, diretorEmail: e.target.value })} className={input} style={estilo} />
          </label>
          <div className="sm:col-span-2 flex items-center gap-3 flex-wrap">
            <button type="submit" disabled={enviando || !dados?.configurado} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {enviando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar cliente
            </button>
            {msg && <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{msg}</span>}
          </div>
        </form>

        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {(dados?.clientes ?? []).length === 0 ? (
            <div className="p-6 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>Nenhum cliente criado ainda.</div>
          ) : (
            dados!.clientes.map((c) => (
              <div key={c.id} className="p-4 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: "var(--border)" }}>
                <div className="flex-1 min-w-[220px]">
                  <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{c.empresa}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {c.plano} · até {c.limiteUsuarios} usuário(s) · {c.diretorEmail}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${cor(c.status)}22`, color: cor(c.status) }}>
                  {c.status === "criando" ? `⏳ ${c.etapa || "Criando"}` : c.status === "ativo" ? "✅ No ar" : "❌ Erro"}
                </span>
                {c.status === "ativo" && (
                  <a href={`https://${c.subdominio}.kayserone.com.br`} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 underline" style={{ color: "var(--primary)" }}>
                    {c.subdominio}.kayserone.com.br <ExternalLink size={12} />
                  </a>
                )}
                {c.status === "erro" && (
                  <>
                    <span className="text-xs w-full" style={{ color: "#ef4444" }}>{c.erro}</span>
                    <button onClick={() => tentar(c.id)} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                      <RefreshCw size={12} /> Tentar de novo
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
