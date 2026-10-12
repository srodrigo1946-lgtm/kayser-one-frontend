"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Loader2, Plus, ExternalLink, RefreshCw } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { useMarca } from "@/hooks/use-marca";

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
type Resposta = { configurado: boolean; faltam?: string[]; planos: Record<string, number>; personalizado: string; clientes: Cliente[] };

// Mesmos preços da página de vendas (R$/mês). Personalizado é negociado com o CEO.
const PRECO: Record<string, number> = { Corretor: 30, "Gerente de Vendas": 110, "Gerente Geral": 330, Superintendente: 530, "Diretor completo": 750 };
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const STATUS: Record<Cliente["status"], { cor: string; texto: string }> = {
  ativo: { cor: "#22c55e", texto: "No ar" },
  criando: { cor: "#f59e0b", texto: "Criando" },
  erro: { cor: "#ef4444", texto: "Com erro" },
};

const slug = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(ltda|me|eireli|s\/?a)\b/g, "").replace(/[^a-z0-9-]+/g, "").slice(0, 30);

/**
 * Venda do Kayser One: criar a instalação de uma imobiliária com 1 clique (Railway + banco +
 * subdomínio + e-mail de boas-vindas). Só o Diretor da Kayser, só na instalação matriz.
 */
export default function ClientesSaasPage() {
  const marca = useMarca();
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
    if (permitido && marca.matriz) carregar();
  }, [permitido, marca.matriz]);

  // Enquanto algum cliente está sendo criado, atualiza a cada 10 s.
  useEffect(() => {
    if (!dados?.clientes.some((c) => c.status === "criando")) return;
    const t = setInterval(carregar, 10_000);
    return () => clearInterval(t);
  }, [dados]);

  if (permitido === null || marca.matriz === undefined) return null;
  if (!permitido || !marca.matriz) return <div className="p-6 text-sm">Esta tela é só da Kayser One.</div>;

  const sub = slug(f.subdominio || f.empresa);
  const personalizado = f.plano === dados?.personalizado;
  const clientes = dados?.clientes ?? [];
  const conta = (s: Cliente["status"]) => clientes.filter((c) => c.status === s).length;
  const mensal = clientes.filter((c) => c.status === "ativo").reduce((t, c) => t + (PRECO[c.plano] ?? 0), 0);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Criar o Kayser One da ${f.empresa} em ${sub}.kayserone.com.br, plano ${f.plano}${personalizado ? ` (${f.limiteUsuarios} usuários)` : ""}?\n\nIsso cria um servidor no Railway (custo mensal).`)) return;
    setEnviando(true);
    setMsg("");
    try {
      await api.post("/clientes-saas", { ...f, subdominio: f.subdominio || undefined, limiteUsuarios: personalizado ? Number(f.limiteUsuarios) : undefined });
      setMsg(`Criando ${f.empresa}. Fica pronto em 5 a 10 minutos e o Diretor recebe o login por e-mail.`);
      setF({ empresa: "", subdominio: "", plano: f.plano, limiteUsuarios: "", diretorNome: "", diretorEmail: "" });
      carregar();
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Não consegui criar. Confira os dados e tente de novo."));
    } finally {
      setEnviando(false);
    }
  };

  const tentar = async (id: string) => {
    await api.post(`/clientes-saas/${id}/tentar-de-novo`).catch((e) => setMsg(getApiErrorMessage(e)));
    carregar();
  };

  const input = "mt-1 w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";
  const estilo = { background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" };
  const fraco = { color: "var(--muted-foreground)" };
  const planos: [string, number | null][] = [...Object.entries(dados?.planos ?? {}), ...(dados?.personalizado ? [[dados.personalizado, null] as [string, null]] : [])];

  return (
    <div>
      <Header title="Clientes" subtitle="Imobiliárias que usam o Kayser One" />
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
        {dados && !dados.configurado && (
          <div className="p-4 rounded-2xl text-sm" style={{ background: "#f59e0b1a", color: "#f59e0b", border: "1px solid #f59e0b55" }}>
            Falta configurar no Railway do servidor da Kayser: {(dados.faltam ?? []).join(", ") || "chaves do Railway"}. Até lá, não dá para criar clientes.
          </div>
        )}

        {/* Resumo: uma faixa só, sem cartões. */}
        <div className="rounded-2xl border px-5 py-4 flex flex-wrap items-end gap-x-10 gap-y-3" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--primary)" }}>{brl(mensal)}</div>
            <div className="text-xs" style={fraco}>por mês dos clientes no ar</div>
          </div>
          {(["ativo", "criando", "erro"] as const).map((s) => (
            <div key={s}>
              <div className="text-xl font-semibold" style={{ color: conta(s) ? STATUS[s].cor : "var(--muted-foreground)" }}>{conta(s)}</div>
              <div className="text-xs" style={fraco}>{STATUS[s].texto.toLowerCase()}</div>
            </div>
          ))}
        </div>

        <form onSubmit={criar} className="rounded-2xl border p-5 space-y-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Novo cliente</h2>

          {/* Plano: os mesmos da página de vendas, escolhidos por cartão. */}
          <fieldset>
            <legend className="text-sm mb-2" style={{ color: "var(--foreground)" }}>Plano</legend>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {planos.map(([p, n]) => {
                const ativo = f.plano === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setF({ ...f, plano: p })}
                    aria-pressed={ativo}
                    className="text-left rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    style={{ borderColor: ativo ? "var(--primary)" : "var(--border)", background: ativo ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "var(--background)" }}
                  >
                    <div className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>{p}</div>
                    <div className="text-xs mt-1" style={fraco}>{n ? `até ${n} usuário${n > 1 ? "s" : ""}` : "você define"}</div>
                    <div className="text-sm font-semibold mt-2" style={{ color: ativo ? "var(--primary)" : "var(--foreground)" }}>{PRECO[p] ? `${brl(PRECO[p])}/mês` : "sob consulta"}</div>
                  </button>
                );
              })}
            </div>
            {personalizado && (
              <label className="block text-sm mt-3 max-w-xs" style={{ color: "var(--foreground)" }}>
                Quantos usuários
                <input required type="number" min={1} max={100000} value={f.limiteUsuarios} onChange={(e) => setF({ ...f, limiteUsuarios: e.target.value })} className={input} style={estilo} placeholder="ex.: 450" />
              </label>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm" style={{ color: "var(--foreground)" }}>
              Imobiliária
              <input required maxLength={80} value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} className={input} style={estilo} placeholder="Imobiliária Exemplo" />
            </label>
            <label className="text-sm" style={{ color: "var(--foreground)" }}>
              Endereço
              <div className="mt-1 flex items-center rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)]" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                <input maxLength={30} value={f.subdominio} onChange={(e) => setF({ ...f, subdominio: e.target.value })} className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent outline-none" style={{ color: "var(--foreground)" }} placeholder={sub || "imobexemplo"} />
                <span className="px-3 text-sm shrink-0" style={fraco}>.kayserone.com.br</span>
              </div>
              <span className="text-xs" style={fraco}>Deixe vazio para usar o nome da imobiliária.</span>
            </label>
            <label className="text-sm" style={{ color: "var(--foreground)" }}>
              Nome do Diretor
              <input required maxLength={80} value={f.diretorNome} onChange={(e) => setF({ ...f, diretorNome: e.target.value })} className={input} style={estilo} />
            </label>
            <label className="text-sm" style={{ color: "var(--foreground)" }}>
              E-mail do Diretor
              <input required type="email" maxLength={160} value={f.diretorEmail} onChange={(e) => setF({ ...f, diretorEmail: e.target.value })} className={input} style={estilo} />
              <span className="text-xs" style={fraco}>Vira o login dele e recebe as boas-vindas.</span>
            </label>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button type="submit" disabled={enviando || !dados?.configurado} className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)]" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {enviando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar cliente
            </button>
            {msg && <span role="status" className="text-sm" style={fraco}>{msg}</span>}
          </div>
        </form>

        <section className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="px-5 pt-4 pb-3 font-semibold" style={{ color: "var(--foreground)" }}>Clientes criados</h2>
          {clientes.length === 0 ? (
            <p className="px-5 pb-6 text-sm" style={fraco}>Ainda não tem nenhum. Preencha o formulário acima para criar o primeiro.</p>
          ) : (
            <ul>
              {clientes.map((c) => (
                <li key={c.id} className="px-5 py-4 border-t flex items-center gap-4 flex-wrap" style={{ borderColor: "var(--border)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0" style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)" }}>
                    {c.empresa.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{c.empresa}</div>
                    <div className="text-xs mt-0.5" style={fraco}>
                      {c.plano}, até {c.limiteUsuarios} usuário{c.limiteUsuarios > 1 ? "s" : ""}. Diretor: {c.diretorNome} ({c.diretorEmail}). Criado em {new Date(c.createdAt).toLocaleDateString("pt-BR")}.
                    </div>
                    {c.status === "erro" && c.erro && <div className="text-xs mt-1" style={{ color: STATUS.erro.cor }}>{c.erro}</div>}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5" style={{ background: `${STATUS[c.status].cor}22`, color: STATUS[c.status].cor }}>
                    {c.status === "criando" && <Loader2 size={11} className="animate-spin" />}
                    {c.status === "criando" ? c.etapa || "Criando" : STATUS[c.status].texto}
                  </span>
                  {c.status === "ativo" && (
                    <a href={`https://${c.subdominio}.kayserone.com.br`} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 underline underline-offset-2" style={{ color: "var(--primary)" }}>
                      {c.subdominio}.kayserone.com.br <ExternalLink size={12} />
                    </a>
                  )}
                  {c.status === "erro" && (
                    <button onClick={() => tentar(c.id)} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                      <RefreshCw size={12} /> Tentar de novo
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
