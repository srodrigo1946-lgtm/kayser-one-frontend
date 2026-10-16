"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Loader2, Plus, ExternalLink, RefreshCw } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { useMarca } from "@/hooks/use-marca";
import { PainelBusiness } from "@/components/business/painel-business";

type Cliente = {
  id: string;
  empresa: string;
  subdominio: string;
  plano: string;
  limiteUsuarios: number;
  diretorNome: string;
  diretorEmail: string;
  adicionais: string;
  valorMensal: number | null;
  cobrancaLink: string | null;
  assinatura: string | null;
  pagoEm: string | null;
  bloqueadoEm: string | null;
  encerradoEm: string | null;
  agendaAcao: string | null;
  agendaEm: string | null;
  origem: string | null;
  status: "criando" | "ativo" | "erro" | "aguardando";
  etapa: string | null;
  erro: string | null;
  createdAt: string;
};
type Resposta = { configurado: boolean; mercadoPago?: boolean; faltam?: string[]; planos: Record<string, number>; personalizado: string; clientes: Cliente[] };

// Mesmos preços da página de vendas (R$/mês). Personalizado é negociado com o CEO.
const PRECO: Record<string, number> = { Corretor: 49, "Gerente de Vendas": 110, "Gerente Geral": 330, Superintendente: 530, "Diretor completo": 750 };
// Serviços adicionais (vendidos à parte em todos os planos), preço promocional de lançamento por plano.
const ADIC: { id: string; nome: string; preco: Record<string, number> }[] = [
  { id: "ia", nome: "IA de resposta", preco: { Corretor: 29, "Gerente de Vendas": 149, "Gerente Geral": 399, Superintendente: 790, "Diretor completo": 1290 } },
  { id: "ione", nome: "IA One", preco: { Corretor: 19, "Gerente de Vendas": 59, "Gerente Geral": 99, Superintendente: 199, "Diretor completo": 449 } },
  { id: "meta", nome: "Anúncios Meta", preco: { Corretor: 9, "Gerente de Vendas": 29, "Gerente Geral": 59, Superintendente: 79, "Diretor completo": 99 } },
];
const lista = (a: string) => (a ? a.split(",").filter(Boolean) : []);
// Preço de tabela = plano + adicionais ligados. O valor negociado (se tiver) vale mais.
const tabela = (plano: string, adicionais: string[]) => (PRECO[plano] ?? 0) + adicionais.reduce((t, a) => t + (ADIC.find((x) => x.id === a)?.preco[plano] ?? 0), 0);
const valor = (c: Cliente) => c.valorMensal ?? tabela(c.plano, lista(c.adicionais));

// Situação da assinatura no Mercado Pago.
const PAGAMENTO: Record<string, { cor: string; texto: string }> = {
  authorized: { cor: "#22c55e", texto: "Pagamento em dia" },
  pending: { cor: "#f59e0b", texto: "Aguardando pagamento" },
  paused: { cor: "#f59e0b", texto: "Assinatura pausada" },
  cancelled: { cor: "#ef4444", texto: "Assinatura cancelada" },
  pix_pago: { cor: "#22c55e", texto: "Mês pago (Pix/avulso)" },
};

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const STATUS: Record<Cliente["status"], { cor: string; texto: string }> = {
  ativo: { cor: "#22c55e", texto: "No ar" },
  criando: { cor: "#f59e0b", texto: "Criando" },
  erro: { cor: "#ef4444", texto: "Com erro" },
  aguardando: { cor: "#f59e0b", texto: "Pago, falta cadastro" },
};

const slug = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(ltda|me|eireli|s\/?a)\b/g, "").replace(/[^a-z0-9-]+/g, "").slice(0, 30);

/**
 * Venda do K1: criar a instalação de uma imobiliária com 1 clique (Railway + banco +
 * subdomínio + e-mail de boas-vindas). Só o Diretor da Kayser, só na instalação matriz.
 */
export default function ClientesSaasPage() {
  const marca = useMarca();
  const [permitido, setPermitido] = useState<boolean | null>(null);
  const [dados, setDados] = useState<Resposta | null>(null);
  const [f, setF] = useState({ empresa: "", subdominio: "", plano: "Gerente de Vendas", limiteUsuarios: "", diretorNome: "", diretorEmail: "", adicionais: [] as string[], valorMensal: "" });
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
  if (!permitido || !marca.matriz) return <div className="p-6 text-sm">Esta tela é só da K1.</div>;

  const sub = slug(f.subdominio || f.empresa);
  const personalizado = f.plano === dados?.personalizado;
  const clientes = dados?.clientes ?? [];
  const conta = (s: Cliente["status"]) => clientes.filter((c) => c.status === s).length;
  const mensal = clientes.filter((c) => c.status === "ativo").reduce((t, c) => t + valor(c), 0);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Criar o K1 da ${f.empresa} em ${sub}.kayserone.com.br, plano ${f.plano}${personalizado ? ` (${f.limiteUsuarios} usuários)` : ""}?\n\nIsso cria um servidor no Railway (custo mensal).`)) return;
    setEnviando(true);
    setMsg("");
    try {
      await api.post("/clientes-saas", {
        ...f,
        subdominio: f.subdominio || undefined,
        limiteUsuarios: personalizado ? Number(f.limiteUsuarios) : undefined,
        valorMensal: f.valorMensal.trim() ? Number(f.valorMensal.replace(/[^0-9,.]/g, "").replace(",", ".")) : undefined,
      });
      setMsg(`Criando ${f.empresa}. Fica pronto em 5 a 10 minutos e o Diretor recebe o login por e-mail.`);
      setF({ empresa: "", subdominio: "", plano: f.plano, limiteUsuarios: "", diretorNome: "", diretorEmail: "", adicionais: [], valorMensal: "" });
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

  const ajustar = async (c: Cliente, corpo: { adicionais?: string[]; valorMensal?: number | null }) => {
    await api.post(`/clientes-saas/${c.id}/ajustar`, corpo).catch((e) => setMsg(getApiErrorMessage(e, "Não consegui salvar.")));
    carregar();
  };
  const alternar = (c: Cliente, id: string) => {
    const atual = lista(c.adicionais);
    ajustar(c, { adicionais: atual.includes(id) ? atual.filter((a) => a !== id) : [...atual, id] });
  };
  const negociar = (c: Cliente) => {
    const t = prompt(`Valor mensal negociado para ${c.empresa} (R$). Tabela: ${brl(tabela(c.plano, lista(c.adicionais)))}.
Deixe vazio para voltar ao preço de tabela.`, c.valorMensal != null ? String(c.valorMensal) : "");
    if (t === null) return;
    const n = Number(t.replace(/[^0-9,.]/g, "").replace(",", "."));
    ajustar(c, { valorMensal: t.trim() === "" ? null : n });
  };

  // Bloquear / encerrar a conta do cliente, na hora ou numa data (dados ficam guardados).
  const contaCliente = async (c: Cliente, acao: "bloquear" | "encerrar" | "desbloquear" | "cancelar_agenda") => {
    let quando: string | undefined;
    if (acao === "bloquear" || acao === "encerrar") {
      const nome = acao === "bloquear" ? "Bloquear" : "Encerrar";
      const t = prompt(
        `${nome} a conta de ${c.empresa}?\n\n` +
          (acao === "encerrar" ? "Encerrar = bloqueia o acesso e cancela a assinatura no Mercado Pago. Os dados ficam guardados (dá para reativar).\n\n" : "Bloquear = ninguém da imobiliária consegue entrar. Os dados ficam guardados.\n\n") +
          "Deixe vazio para fazer AGORA, ou digite a data (dd/mm/aaaa):",
        ""
      );
      if (t === null) return;
      const m = t.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (t.trim() && !m) return setMsg("Data inválida. Use dd/mm/aaaa.");
      if (m) quando = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 8, 0).toISOString();
    } else if (acao === "desbloquear" && !confirm(`Reativar a conta de ${c.empresa}?`)) return;
    try {
      const r = await api.post<{ agendado?: string }>(`/clientes-saas/${c.id}/conta`, { acao, quando });
      setMsg(
        r.data.agendado
          ? `${c.empresa}: marcado para ${new Date(r.data.agendado).toLocaleDateString("pt-BR")}.`
          : acao === "desbloquear"
            ? `${c.empresa} reativada. Volta a funcionar em uns 3 minutos.`
            : acao === "cancelar_agenda"
              ? "Agendamento cancelado."
              : `${c.empresa} ${acao === "bloquear" ? "bloqueada" : "encerrada"}. Vale em uns 3 minutos.`
      );
      carregar();
    } catch (e) {
      setMsg(getApiErrorMessage(e, "Não consegui fazer isso agora."));
    }
  };

  // Apagar de vez (só conta encerrada): servidor, banco e cadastro. Não tem volta.
  const apagar = async (c: Cliente) => {
    const t = prompt(
      `APAGAR DE VEZ ${c.empresa}?

Isso apaga o servidor e TODOS os dados dessa imobiliária (leads, conversas, usuários). NÃO TEM VOLTA.
O histórico de pagamentos do caixa fica.

Para confirmar, digite o endereço: ${c.subdominio}`,
      ""
    );
    if (t === null) return;
    try {
      await api.delete(`/clientes-saas/${c.id}`, { data: { confirmacao: t } });
      setMsg(`${c.empresa} apagado.`);
      carregar();
    } catch (e) {
      setMsg(getApiErrorMessage(e, "Não consegui apagar."));
    }
  };

  const cobrar = async (c: Cliente, pix = false) => {
    const tipo = pix ? `a mensalidade deste mês (Pix ou cartão) de ${brl(valor(c))}` : `a assinatura mensal no cartão de ${brl(valor(c))}`;
    if (!confirm(`Gerar ${tipo} para ${c.empresa}?

O link do Mercado Pago vai por e-mail para ${c.diretorEmail} (cópia para você).`)) return;
    try {
      const r = await api.post<{ link: string }>(`/clientes-saas/${c.id}/${pix ? "cobrar-pix" : "cobrar"}`);
      await navigator.clipboard?.writeText(r.data.link).catch(() => {});
      setMsg(`Cobrança de ${c.empresa} enviada por e-mail. O link também foi copiado.`);
      carregar();
    } catch (e) {
      setMsg(getApiErrorMessage(e, "Não consegui gerar a cobrança."));
    }
  };

  const input = "mt-1 w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";
  const estilo = { background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" };
  const fraco = { color: "var(--muted-foreground)" };
  const planos: [string, number | null][] = [...Object.entries(dados?.planos ?? {}), ...(dados?.personalizado ? [[dados.personalizado, null] as [string, null]] : [])];

  return (
    <div>
      <Header title="Business K1" subtitle="Clientes, cobrança e resultado do K1" />
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
        {dados && !dados.configurado && (
          <div className="p-4 rounded-2xl text-sm" style={{ background: "#f59e0b1a", color: "#f59e0b", border: "1px solid #f59e0b55" }}>
            Falta configurar no Railway do servidor da Kayser: {(dados.faltam ?? []).join(", ") || "chaves do Railway"}. Até lá, não dá para criar clientes.
          </div>
        )}

        {dados?.configurado && dados.mercadoPago === false && (
          <div className="p-4 rounded-2xl text-sm" style={{ background: "#f59e0b1a", color: "#f59e0b", border: "1px solid #f59e0b55" }}>
            Para cobrar pelo painel, falta colar o Access Token do Mercado Pago (MP_ACCESS_TOKEN) no Railway da Kayser.
          </div>
        )}

        {msg && (
          <div role="status" className="sticky top-2 z-10 p-3 rounded-xl border text-sm flex justify-between gap-3" style={{ background: "var(--card)", borderColor: "var(--primary)", color: "var(--foreground)" }}>
            {msg}
            <button onClick={() => setMsg("")} aria-label="Fechar aviso" style={fraco}>✕</button>
          </div>
        )}

        <PainelBusiness />

        {/* Resumo: uma faixa só, sem cartões. */}
        <div className="rounded-2xl border px-5 py-4 flex flex-wrap items-end gap-x-10 gap-y-3" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div>
            <div className="text-3xl font-bold" style={{ color: "var(--primary)" }}>{brl(mensal)}</div>
            <div className="text-xs" style={fraco}>por mês dos clientes no ar</div>
          </div>
          {(["ativo", "criando", "erro", "aguardando"] as const).map((s) => (
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

          <fieldset>
            <legend className="text-sm mb-2" style={{ color: "var(--foreground)" }}>Serviços adicionais</legend>
            <div className="flex flex-wrap gap-2">
              {ADIC.map((a) => {
                const ligado = f.adicionais.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={ligado}
                    onClick={() => setF({ ...f, adicionais: ligado ? f.adicionais.filter((x) => x !== a.id) : [...f.adicionais, a.id] })}
                    className="rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    style={{ borderColor: ligado ? "var(--primary)" : "var(--border)", background: ligado ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "var(--background)", color: "var(--foreground)" }}
                  >
                    {ligado ? "✓ " : "+ "}{a.nome} <span style={fraco}>{a.preco[f.plano] ? `${brl(a.preco[f.plano])}/mês` : "a combinar"}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs mt-2" style={fraco}>
              Total de tabela: {brl(tabela(f.plano, f.adicionais))}/mês.
            </p>
            <label className="block text-sm mt-3 max-w-xs" style={{ color: "var(--foreground)" }}>
              Valor negociado (opcional)
              <input inputMode="decimal" value={f.valorMensal} onChange={(e) => setF({ ...f, valorMensal: e.target.value })} className={input} style={estilo} placeholder={`ex.: ${tabela(f.plano, f.adicionais) || 500}`} />
              <span className="text-xs" style={fraco}>Qualquer valor por mês. Vazio = preço de tabela. Dá para mudar depois na lista.</span>
            </label>
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
                      {c.plano}, até {c.limiteUsuarios} usuário{c.limiteUsuarios > 1 ? "s" : ""}. {c.status === "aguardando" ? `Pagou com o e-mail ${c.diretorEmail || "(não informado)"}; chame no WhatsApp para completar o cadastro.` : `Diretor: ${c.diretorNome} (${c.diretorEmail}).`} {c.origem === "site" ? "Assinou pelo site" : "Criado"} em {new Date(c.createdAt).toLocaleDateString("pt-BR")}.
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ADIC.map((a) => {
                        const ligado = lista(c.adicionais).includes(a.id);
                        return (
                          <button key={a.id} onClick={() => alternar(c, a.id)} title={ligado ? "Clique para desligar" : "Clique para ligar"} className="text-[11px] px-2 py-0.5 rounded-full border" style={{ borderColor: ligado ? "var(--primary)" : "var(--border)", color: ligado ? "var(--primary)" : "var(--muted-foreground)" }}>
                            {ligado ? "✓" : "+"} {a.nome}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      {c.assinatura && PAGAMENTO[c.assinatura] && (
                        <span className="font-semibold" style={{ color: PAGAMENTO[c.assinatura].cor }}>
                          ● {PAGAMENTO[c.assinatura].texto}
                          {c.assinatura === "pix_pago" && c.pagoEm ? ` em ${new Date(c.pagoEm).toLocaleDateString("pt-BR")}` : ""}
                        </span>
                      )}
                      {c.assinatura !== "authorized" && (
                        <button onClick={() => cobrar(c)} disabled={!dados?.mercadoPago} title="Assinatura mensal: o cartão é cobrado sozinho todo mês" className="px-2.5 py-1 rounded-lg font-semibold disabled:opacity-40" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                          Cobrar assinatura (cartão)
                        </button>
                      )}
                      {c.assinatura !== "authorized" && (
                        <button onClick={() => cobrar(c, true)} disabled={!dados?.mercadoPago} title="Link do mês: paga com Pix ou cartão, uma vez" className="px-2.5 py-1 rounded-lg font-semibold border disabled:opacity-40" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                          Cobrar Pix (mês)
                        </button>
                      )}
                      {c.cobrancaLink && c.assinatura !== "authorized" && (
                        <button onClick={() => navigator.clipboard?.writeText(c.cobrancaLink!).then(() => setMsg("Link de pagamento copiado."))} className="underline underline-offset-2" style={fraco}>
                          copiar link de pagamento
                        </button>
                      )}
                    </div>
                    {c.status === "erro" && c.erro && <div className="text-xs mt-1" style={{ color: STATUS.erro.cor }}>{c.erro}</div>}
                  </div>
                  <button onClick={() => negociar(c)} className="text-right" title="Negociar valor">
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{brl(valor(c))}/mês</div>
                    <div className="text-[11px] underline underline-offset-2" style={fraco}>{c.valorMensal != null ? "valor negociado" : "negociar valor"}</div>
                  </button>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5" style={{ background: `${STATUS[c.status].cor}22`, color: STATUS[c.status].cor }}>
                    {c.status === "criando" && <Loader2 size={11} className="animate-spin" />}
                    {c.status === "criando" ? c.etapa || "Criando" : STATUS[c.status].texto}
                  </span>
                  {c.status === "ativo" && (
                    <a href={`https://${c.subdominio}.kayserone.com.br`} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 underline underline-offset-2" style={{ color: "var(--primary)" }}>
                      {c.subdominio}.kayserone.com.br <ExternalLink size={12} />
                    </a>
                  )}
                  <div className="w-full flex flex-wrap items-center gap-2 text-xs">
                    {c.encerradoEm ? (
                      <span className="font-semibold" style={{ color: "#ef4444" }}>⛔ Conta encerrada em {new Date(c.encerradoEm).toLocaleDateString("pt-BR")}</span>
                    ) : c.bloqueadoEm ? (
                      <span className="font-semibold" style={{ color: "#ef4444" }}>🔒 Bloqueada desde {new Date(c.bloqueadoEm).toLocaleDateString("pt-BR")}</span>
                    ) : null}
                    {c.agendaAcao && c.agendaEm && (
                      <span className="font-semibold" style={{ color: "#f59e0b" }}>
                        ⏰ {c.agendaAcao === "encerrar" ? "Encerra" : "Bloqueia"} em {new Date(c.agendaEm).toLocaleDateString("pt-BR")}
                        <button onClick={() => contaCliente(c, "cancelar_agenda")} className="ml-2 underline underline-offset-2 font-normal" style={fraco}>cancelar</button>
                      </span>
                    )}
                    {c.status === "ativo" && (
                      <span className="ml-auto flex gap-2">
                        {c.bloqueadoEm ? (
                          <button onClick={() => contaCliente(c, "desbloquear")} className="px-2.5 py-1 rounded-lg border font-semibold" style={{ borderColor: "#22c55e", color: "#22c55e" }}>
                            Reativar
                          </button>
                        ) : (
                          <button onClick={() => contaCliente(c, "bloquear")} className="px-2.5 py-1 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                            Bloquear
                          </button>
                        )}
                        {c.encerradoEm && (
                          <button onClick={() => apagar(c)} className="px-2.5 py-1 rounded-lg font-semibold" style={{ background: "#ef4444", color: "#fff" }}>
                            Apagar de vez
                          </button>
                        )}
                        {!c.encerradoEm && (
                          <button onClick={() => contaCliente(c, "encerrar")} className="px-2.5 py-1 rounded-lg border" style={{ borderColor: "#ef444466", color: "#ef4444" }}>
                            Encerrar conta
                          </button>
                        )}
                      </span>
                    )}
                  </div>
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
