"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, Send, RefreshCw, Upload } from "lucide-react";
import { Header } from "@/components/layout/header";
import { api, getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";

type Conversa = { phone: string; nome: string | null; content: string; direction: string; createdAt: string; total: number };
type Msg = { id: string; direction: "in" | "out"; content: string; createdAt: string };

const card = "rounded-2xl border p-4";
const cardStyle = { background: "var(--card)", borderColor: "var(--border)" };
const input = "w-full text-sm px-3 py-2 rounded-xl border outline-none";
const inputStyle = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };
const btn = "px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-60";

/** IA One: assistente da equipe num número de WhatsApp próprio (só o Diretor configura). */
export default function IaOnePage() {
  const isDiretor = getStoredUser()?.role === "diretor";
  const { data: s } = useSettings();
  const salvar = useUpdateSettings();
  const qc = useQueryClient();
  const cfg = (s ?? {}) as any;

  const [msg, setMsg] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [claude, setClaude] = useState("");
  const [openai, setOpenai] = useState("");
  const [planilha, setPlanilha] = useState("");
  const [unidades, setUnidades] = useState("");
  const [info, setInfo] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<{ limpo: string; fotos: string[]; condicoes: boolean } | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);

  useEffect(() => {
    if (!s) return;
    setPlanilha(cfg.ionePlanilhaUrl || "");
    setUnidades(cfg.ioneUnidadesUrl || "");
    setInfo(cfg.ioneInfo || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const { data: status, refetch: refStatus } = useQuery({
    queryKey: ["ia-one", "status"],
    enabled: isDiretor,
    refetchInterval: qr ? 4000 : 30_000,
    queryFn: async () => (await api.get<any>("/ia-one/status")).data,
  });
  const conectado = (status?.instance?.state || status?.state) === "open";
  useEffect(() => {
    if (conectado) setQr(null);
  }, [conectado]);

  const { data: dados, refetch: refDados, isFetching: lendo } = useQuery({
    queryKey: ["ia-one", "dados"],
    enabled: isDiretor,
    queryFn: async () => (await api.get<any>("/ia-one/dados")).data,
  });
  const { data: conversas } = useQuery({
    queryKey: ["ia-one", "conversas"],
    enabled: isDiretor,
    refetchInterval: 15_000,
    queryFn: async () => (await api.get<Conversa[]>("/ia-one/conversas")).data,
  });
  const { data: mensagens } = useQuery({
    queryKey: ["ia-one", "conversa", aberta],
    enabled: isDiretor && !!aberta,
    refetchInterval: 10_000,
    queryFn: async () => (await api.get<Msg[]>(`/ia-one/conversas/${aberta}`)).data,
  });

  if (!isDiretor) {
    return (
      <div>
        <Header title="IA One" subtitle="Assistente da equipe" />
        <p className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Só o Diretor acessa esta aba.</p>
      </div>
    );
  }

  const acao = async (nome: string, fn: () => Promise<void>) => {
    setOcupado(nome);
    setMsg("");
    try {
      await fn();
    } catch (e) {
      setMsg(getApiErrorMessage(e, "Não deu certo."));
    } finally {
      setOcupado(null);
    }
  };

  const conectar = (reset = false) =>
    acao("conectar", async () => {
      const { data } = await api.post(`/ia-one/conectar${reset ? "?reset=1" : ""}`);
      const img = data?.base64 || data?.qrcode?.base64 || data?.code;
      setQr(img && String(img).startsWith("data:") ? img : img ? `data:image/png;base64,${img}` : null);
      if (!img) setMsg("Não veio QR. Se já está conectado, tudo certo; senão tente “Gerar novo QR”.");
      refStatus();
    });

  const salvarConfig = () =>
    acao("salvar", async () => {
      await salvar.mutateAsync({
        ...(claude ? { ioneClaudeKey: claude } : {}),
        ...(openai ? { ioneOpenaiKey: openai } : {}),
        ionePlanilhaUrl: planilha,
        ioneUnidadesUrl: unidades,
        ioneInfo: info,
      } as any);
      setClaude("");
      setOpenai("");
      setMsg("✅ Configuração da IA One salva.");
      refDados();
    });

  // Excel (.xlsx/.xls) ou CSV — vai em base64; o servidor descobre o formato.
  const subirCsv = (f: File) =>
    acao("csv", async () => {
      const bytes = new Uint8Array(await f.arrayBuffer());
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...Array.from(bytes.subarray(i, i + 0x8000)));
      const { data } = await api.post("/ia-one/unidades-arquivo", { nome: f.name, base64: btoa(bin) });
      setMsg(`✅ ${data.importadas} unidade(s) do ${data.empreendimento} carregadas (${f.name}).`);
      refDados();
      qc.invalidateQueries({ queryKey: ["settings"] });
    });

  const testar = () =>
    acao("testar", async () => {
      setResposta(null);
      const { data } = await api.post("/ia-one/testar", { mensagem: pergunta });
      setResposta(data);
    });

  return (
    <div>
      <Header title="IA One" subtitle="Assistente da equipe no WhatsApp (número próprio)" />
      <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        {msg && (
          <p className="xl:col-span-2 text-sm px-3 py-2 rounded-xl" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
            {msg}
          </p>
        )}

        {/* Conexão */}
        <div className={card} style={cardStyle}>
          <div className="font-semibold flex items-center gap-2 mb-1" style={{ color: "var(--foreground)" }}>
            <Sparkles size={18} /> Número da IA One
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
            Um WhatsApp só pra equipe. Responde corretores e gestores cadastrados (pelo telefone do cadastro).
          </p>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-sm font-semibold" style={{ color: conectado ? "#22c55e" : "#f59e0b" }}>
              {conectado ? "🟢 Conectado" : "🟠 Desconectado"}
            </span>
            {!conectado && (
              <button onClick={() => conectar(false)} disabled={!!ocupado} className={btn} style={{ background: "#facc15", color: "#0a0a0a" }}>
                {ocupado === "conectar" ? <Loader2 size={14} className="animate-spin inline" /> : "Conectar número (QR)"}
              </button>
            )}
            <button onClick={() => conectar(true)} disabled={!!ocupado} className={btn} style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
              Gerar novo QR
            </button>
            <button
              onClick={async () => {
                await salvar.mutateAsync({ ioneAtivo: !(cfg.ioneAtivo !== false) } as any);
              }}
              className={btn}
              style={{ background: cfg.ioneAtivo !== false ? "#22c55e" : "var(--secondary)", color: cfg.ioneAtivo !== false ? "white" : "var(--foreground)" }}
            >
              {cfg.ioneAtivo !== false ? "Respondendo (ligada)" : "Desligada"}
            </button>
          </div>
          {qr && (
            <div className="text-center">
              <img src={qr} alt="QR da IA One" className="mx-auto w-56 h-56 rounded-xl bg-white p-2" />
              <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                No celular do número NOVO: WhatsApp → Aparelhos conectados → Conectar aparelho → leia o QR.
              </p>
            </div>
          )}
        </div>

        {/* Chaves */}
        <div className={card} style={cardStyle}>
          <div className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>🔑 Chaves próprias da IA One</div>
          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>Separadas das chaves do atendimento aos clientes. Cole aqui; ela nunca aparece de volta.</p>
          <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Chave Claude (Anthropic) {cfg.hasIoneClaudeKey && <span style={{ color: "#22c55e" }}>— configurada</span>}
          </label>
          <input type="password" value={claude} onChange={(e) => setClaude(e.target.value)} placeholder="sk-ant-..." className={`${input} mb-2`} style={inputStyle} />
          <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Chave OpenAI (áudio) {cfg.hasIoneOpenaiKey && <span style={{ color: "#22c55e" }}>— configurada</span>}
          </label>
          <input type="password" value={openai} onChange={(e) => setOpenai(e.target.value)} placeholder="sk-..." className={`${input} mb-3`} style={inputStyle} />
          <button onClick={salvarConfig} disabled={!!ocupado} className={btn} style={{ background: "#facc15", color: "#0a0a0a" }}>
            Salvar
          </button>
        </div>

        {/* Fontes */}
        <div className={`${card} xl:col-span-2`} style={cardStyle}>
          <div className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>📊 De onde a One tira as informações</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>Planilha do Simulador Pro Soluto (Google Sheets, link de leitura)</label>
              <input value={planilha} onChange={(e) => setPlanilha(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className={input} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>Planilha das unidades (se a Riva compartilhar) — opcional</label>
              <input value={unidades} onChange={(e) => setUnidades(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className={input} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Ou suba as unidades em Excel ou CSV (nome do arquivo = empreendimento, ex.: ilhamar.xlsx) {cfg.hasIoneUnidadesCsv && <span style={{ color: "#22c55e" }}>— enviado</span>}
              </label>
              <label className={`${btn} inline-flex items-center gap-2 cursor-pointer`} style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                <Upload size={14} /> {ocupado === "csv" ? "Enviando…" : "Escolher arquivo (Excel ou CSV)"}
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = ""; // permite subir o mesmo arquivo de novo
                    if (f) subirCsv(f);
                  }}
                />
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Materiais e informações extras (links de book e vídeo por empreendimento, condições do mês, recados)
              </label>
              <textarea
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                rows={5}
                placeholder={"Ilhamar — book: https://...  vídeo: https://...\nVilla Santé — book: https://...\nCondições de outubro: ..."}
                className={input}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button onClick={salvarConfig} disabled={!!ocupado} className={btn} style={{ background: "#facc15", color: "#0a0a0a" }}>
              Salvar fontes
            </button>
            <button onClick={() => refDados()} className={`${btn} inline-flex items-center gap-1`} style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
              <RefreshCw size={14} className={lendo ? "animate-spin" : ""} /> Ler planilhas agora
            </button>
          </div>
          {dados && (
            <div className="mt-3 text-xs space-y-1" style={{ color: "var(--muted-foreground)" }}>
              {dados.campanha && <div>📌 {dados.campanha}</div>}
              <div>
                🏢 {dados.empreendimentos?.length ?? 0} empreendimento(s) na planilha · 🔢 {dados.unidades ?? 0} unidade(s) na tabela de preços
              </div>
              {!!dados.disponiveisPorProduto?.length && (
                <div className="pt-1">
                  <div className="mb-1" style={{ color: "var(--foreground)" }}>✅ Unidades carregadas (a One responde status e preço destes):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {dados.disponiveisPorProduto.map((p: any, i: number) => {
                      // Atualização mensal: passou de 35 dias sem planilha nova → vermelho.
                      const dias = p.enviadoEm ? Math.floor((Date.now() - new Date(`${p.enviadoEm}T12:00:00`).getTime()) / 86_400_000) : null;
                      const velho = dias != null && dias > 35;
                      return (
                        <span key={i} className="px-2 py-1 rounded-lg" style={{ background: velho ? "#ef44441f" : "#22c55e1f", color: "var(--foreground)" }}>
                          {p.produto} · {p.disponiveis} disponíveis · R$ {Number(p.precoMin).toLocaleString("pt-BR")} a R$ {Number(p.precoMax).toLocaleString("pt-BR")} · entrega {p.entrega}
                          {p.enviadoEm && ` · atualizado ${p.enviadoEm.split("-").reverse().join("/")}`}
                          {velho && " ⚠️ suba a planilha nova"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {!!dados.empreendimentos?.length && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dados.empreendimentos.map((e: any, i: number) => (
                    <span key={i} className="px-2 py-1 rounded-lg" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                      {e.nome} · {e.valorVenda ? `R$ ${Number(e.valorVenda).toLocaleString("pt-BR")}` : "sem valor"} · {e.estoque} un. · {e.mesesEntrega ? `${e.mesesEntrega}m` : "pronto"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Testar */}
        <div className={card} style={cardStyle}>
          <div className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>🧪 Testar a One (sem WhatsApp)</div>
          <div className="flex gap-2">
            <input
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pergunta.trim() && testar()}
              placeholder="Ex.: simula Ilhamar na tabela investidor"
              className={input}
              style={inputStyle}
            />
            <button onClick={testar} disabled={!!ocupado || !pergunta.trim()} className={btn} style={{ background: "#facc15", color: "#0a0a0a" }}>
              {ocupado === "testar" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          {resposta && (
            <div className="mt-3 text-sm whitespace-pre-wrap px-3 py-2 rounded-xl" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
              {resposta.limpo}
              {(resposta.fotos.length > 0 || resposta.condicoes) && (
                <div className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                  {resposta.fotos.length > 0 && `📷 Mandaria fotos: ${resposta.fotos.join(", ")} `}
                  {resposta.condicoes && "🖼️ Mandaria a imagem das condições do mês"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversas */}
        <div className={card} style={cardStyle}>
          <div className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>💬 Conversas ao vivo da One</div>
          {!conversas?.length ? (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Ninguém falou com a One ainda.</p>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
              {conversas.map((c) => (
                <div key={c.phone}>
                  <button
                    onClick={() => setAberta(aberta === c.phone ? null : c.phone)}
                    className="w-full text-left text-sm px-3 py-2 rounded-xl"
                    style={{ background: aberta === c.phone ? "#facc1522" : "var(--secondary)", color: "var(--foreground)" }}
                  >
                    <b>{c.nome || c.phone}</b> · {new Date(c.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {c.total} msg
                    <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                      {c.direction === "in" ? "👤 " : "✨ "}
                      {c.content}
                    </div>
                  </button>
                  {aberta === c.phone && (
                    <div className="mt-1 mb-2 space-y-1 px-1">
                      {(mensagens ?? []).map((m) => (
                        <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : ""}`}>
                          <div
                            className="text-xs whitespace-pre-wrap px-3 py-1.5 rounded-xl max-w-[85%]"
                            style={{ background: m.direction === "out" ? "#facc1533" : "var(--secondary)", color: "var(--foreground)" }}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
