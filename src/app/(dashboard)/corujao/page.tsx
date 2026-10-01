"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Send, Phone, Rocket } from "lucide-react";
import { Coruja } from "@/components/icons/coruja";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import {
  useCorujaoPool,
  useAceitarCorujao,
  useCorujaoConfig,
  useSetCorujaoConfig,
  useAtivarCorretorCorujao,
  usePuxarCorujao,
  useLiberarCorujao,
  useRemoverPoolCorujao,
} from "@/hooks/use-corujao";

const LOTES = [2, 5, 10, 20, 30, 50];

export default function CorujaoPage() {
  const isDiretor = getStoredUser()?.role === "diretor";
  const { data: pool, isLoading } = useCorujaoPool();
  const leads = pool?.leads ?? [];
  const podePegar = !!pool?.podePegar;
  const aceitar = useAceitarCorujao();
  const [msg, setMsg] = useState("");

  // Lead aceito some na hora (antes do refetch) e dispara o foguete do card.
  const [aceitos, setAceitos] = useState<string[]>([]);
  const [lancamentos, setLancamentos] = useState<{ id: number; x: number; y: number }[]>([]);
  const visiveis = leads.filter((l) => !aceitos.includes(l.id));

  const lancarFoguete = (el: HTMLElement | null) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setLancamentos((ls) => [...ls, { id, x: r.left + r.width / 2, y: r.top }]);
    setTimeout(() => setLancamentos((ls) => ls.filter((l) => l.id !== id)), 1800);
  };

  const handleAceitar = async (id: string, el: HTMLElement | null) => {
    setMsg("");
    try {
      await aceitar.mutateAsync(id);
      lancarFoguete(el);
      setAceitos((a) => [...a, id]);
      setMsg("🚀 Lead aceito! Já está com você em Primeiro Contato — abra o CRM/WhatsApp pra falar com o cliente.");
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Falha ao aceitar o lead."));
    }
  };

  const limite = pool?.limiteDia ?? 0;
  const meus = pool?.meusHoje ?? 0;
  const pct = limite ? Math.min(100, Math.round((meus / limite) * 100)) : 0;
  // Mais leads disponíveis = mais foguetes no céu (até 6).
  const qtdFoguetes = podePegar ? Math.min(visiveis.length, 6) : 0;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Coruja size={52} />
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Corujão — repique de leads</h1>
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
        Leads sem interesse (e os que estão com o Diretor) voltam pra cá. Clique em <b>Aceitar</b> pra assumir — o lead vira seu e entra em “Primeiro Contato”.
      </p>

      {/* Céu de foguetes: quanto mais lead disponível, mais foguete voando. */}
      {Array.from({ length: qtdFoguetes }, (_, i) => (
        <div
          key={`fg-${i}`}
          aria-hidden
          className="corujao-rocket"
          style={{ bottom: `${8 + ((i * 13) % 50)}%`, animationDelay: `${i * 0.9}s`, animationDuration: `${4.5 + (i % 3)}s`, fontSize: `${30 + (i % 3) * 8}px` }}
        >
          🚀
        </div>
      ))}
      {/* Foguete que decola do card aceito + estrelas. */}
      {lancamentos.map((l) => (
        <div key={l.id} aria-hidden className="corujao-launch" style={{ left: l.x, top: l.y }}>
          <span className="corujao-launch-rocket">🚀</span>
          {["✨", "⭐", "🌟", "✨", "⭐", "💫"].map((e, i) => (
            <span key={i} className="corujao-star" style={{ ["--a" as any]: `${i * 60}deg` }}>{e}</span>
          ))}
        </div>
      ))}
      <style>{`
        .corujao-rocket{position:fixed;left:-60px;z-index:40;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.3));animation:corujaoFly 5s linear infinite;opacity:0;}
        @keyframes corujaoFly{
          0%{transform:translate(0,0) rotate(-28deg);opacity:0;}
          8%{opacity:1;} 88%{opacity:1;}
          100%{transform:translate(108vw,-70vh) rotate(-28deg);opacity:0;}
        }
        .corujao-launch{position:fixed;z-index:60;pointer-events:none;transform:translate(-50%,-50%);}
        .corujao-launch-rocket{display:block;font-size:46px;animation:corujaoDecola 1.6s cubic-bezier(.3,.0,.7,1) forwards;filter:drop-shadow(0 0 12px rgba(250,204,21,.8));}
        @keyframes corujaoDecola{
          0%{transform:translateY(0) scale(.6) rotate(-45deg);opacity:0;}
          12%{transform:translateY(-10px) scale(1.1) rotate(-45deg);opacity:1;}
          100%{transform:translateY(-110vh) scale(1.3) rotate(-45deg);opacity:0;}
        }
        .corujao-star{position:absolute;left:0;top:0;font-size:20px;animation:corujaoEstrela 1s ease-out forwards;}
        @keyframes corujaoEstrela{
          0%{transform:rotate(var(--a)) translateX(0) scale(.4);opacity:1;}
          100%{transform:rotate(var(--a)) translateX(90px) scale(1.2);opacity:0;}
        }
        .corujao-card{transition:transform .2s ease, box-shadow .2s ease;}
        .corujao-card:hover{transform:translateY(-3px);}
        .corujao-btn{background:linear-gradient(90deg,var(--primary),#f59e0b);transition:transform .15s ease, filter .15s ease;}
        .corujao-btn:hover:not(:disabled){transform:scale(1.02);filter:brightness(1.08);}
        @media (prefers-reduced-motion: reduce){ .corujao-rocket,.corujao-launch{display:none;} }
      `}</style>

      {isDiretor && <ConfigPanel />}

      {isDiretor && pool?.pegosHoje && (
        <div className="mb-4 p-3 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            🦉 Quem pegou hoje ({pool.pegosHoje.reduce((a, p) => a + p.qtd, 0)} lead(s))
          </div>
          {pool.pegosHoje.length === 0 ? (
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Ninguém pegou lead do Corujão hoje ainda.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pool.pegosHoje.map((p) => (
                <span key={p.nome} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                  {p.nome}: <b>{p.qtd}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {msg && (
        <div className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>{msg}</div>
      )}

      <h2 className="font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
        Leads para pegar {pool ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--primary)", color: "white" }}>{visiveis.length}</span> : ""}
      </h2>

      {/* Barra do dia: o foguete anda conforme o corretor pega leads. */}
      {podePegar && !!limite && (
        <div className="mb-4 p-3 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="flex items-center justify-between text-xs mb-2" style={{ color: meus >= limite ? "#ef4444" : "var(--muted-foreground)" }}>
            <span>Você pegou <b style={{ color: "var(--foreground)" }}>{meus}</b> de <b style={{ color: "var(--foreground)" }}>{limite}</b> hoje</span>
            <span>{meus >= limite ? "Chegou no limite — amanhã tem mais! 🦉" : `Faltam ${limite - meus} 🚀`}</span>
          </div>
          <div className="relative h-3 rounded-full" style={{ background: "var(--secondary)" }}>
            <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,var(--primary),#f59e0b)", transition: "width .6s ease" }} />
            <span className="absolute -top-3 text-xl" style={{ left: `calc(${pct}% - 12px)`, transition: "left .6s ease", transform: "rotate(45deg)" }}>🚀</span>
          </div>
        </div>
      )}
      {isDiretor && !!limite && (
        <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
          Limite: cada corretor pega no máximo <b>{limite}</b> leads do Corujão por dia.
        </p>
      )}
      {!podePegar && !isDiretor && (
        <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
          Só corretores ativados no Corujão pegam os leads. Você está vendo em modo consulta.
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={16} className="animate-spin" /> Carregando…
        </div>
      ) : visiveis.length === 0 ? (
        <div className="p-6 rounded-2xl border text-center" style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--muted-foreground)" }}>
          <div className="text-3xl mb-1">🦉</div>
          Nenhum lead no repique agora. 🎉
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visiveis.map((l) => {
            const cor = corDoEmpreendimento(l.empreendimento);
            const og = origemInfo(l.origem);
            const dias = (l as any).desde ? Math.max(0, Math.floor((Date.now() - new Date((l as any).desde).getTime()) / 86400000)) : null;
            return (
              <div
                key={l.id}
                className="corujao-card rounded-2xl border overflow-hidden"
                style={{ borderColor: `${cor}55`, background: `linear-gradient(135deg, ${cor}1f, var(--card) 55%)` }}
              >
                <div style={{ height: 4, background: cor }} />
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold" style={{ color: "var(--foreground)" }}>{l.name || "🔒 Lead disponível"}</div>
                    {dias !== null && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                        ⏳ {dias === 0 ? "hoje" : `${dias}d parado`}
                      </span>
                    )}
                  </div>
                  {l.phone && (
                    <div className="text-xs flex items-center gap-1 mt-1" style={{ color: "var(--muted-foreground)" }}>
                      <Phone size={12} /> {l.phone}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {l.empreendimento && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cor}26`, color: cor }}>🏢 {l.empreendimento}</span>
                    )}
                    {og && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{og}</span>
                    )}
                    {l.responsavel && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· atual: {l.responsavel}</span>
                    )}
                  </div>
                  {podePegar && (
                    <button
                      onClick={(e) => handleAceitar(l.id, e.currentTarget)}
                      disabled={aceitar.isPending || (!!limite && meus >= limite)}
                      className="corujao-btn mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                      style={{ color: "white" }}
                    >
                      🚀 Aceitar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Cor fixa por empreendimento (o mesmo empreendimento sempre na mesma cor). */
function corDoEmpreendimento(nome?: string): string {
  const cores = ["#facc15", "#22c55e", "#3b82f6", "#a855f7", "#f97316", "#06b6d4", "#ec4899", "#14b8a6"];
  const t = (nome || "").toLowerCase();
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  return t ? cores[h % cores.length] : "#94a3b8";
}

/** Origem legível com ícone. */
function origemInfo(origem?: string): string {
  const o = (origem || "").toLowerCase();
  if (!o) return "";
  if (o.includes("formul")) return "📝 Formulário";
  if (o.includes("insta")) return "📸 Instagram";
  if (o.includes("face")) return "📘 Facebook";
  if (o.includes("tiktok")) return "🎵 TikTok";
  if (o.includes("whats")) return "💬 WhatsApp";
  if (o === "anuncio") return "🎯 Anúncio";
  return `👥 ${origem}`;
}

function ConfigPanel() {
  const { data: cfg } = useCorujaoConfig(true);
  const setCfg = useSetCorujaoConfig();
  const ativar = useAtivarCorretorCorujao();
  const puxar = usePuxarCorujao();
  const liberar = useLiberarCorujao();
  const removerPool = useRemoverPoolCorujao();
  const [hora, setHora] = useState("14:00");
  const [puxouMsg, setPuxouMsg] = useState("");
  const [libMsg, setLibMsg] = useState("");
  const [agendar, setAgendar] = useState("");

  const handleLiberar = async (n: number) => {
    setLibMsg("");
    try {
      const r = await liberar.mutateAsync(n);
      setLibMsg(`Liberados ${r.released} 🚀 · ${r.noPool} no pool · ${r.naoLiberados} ainda na fila.`);
    } catch (err) {
      setLibMsg(getApiErrorMessage(err, "Falha ao liberar leads."));
    }
  };

  useEffect(() => {
    if (cfg?.hora) setHora(cfg.hora);
  }, [cfg?.hora]);

  const handlePuxar = async () => {
    setPuxouMsg("");
    try {
      const r = await puxar.mutateAsync();
      setPuxouMsg(`Enviado: ${r.leads} lead(s) no repique · ${r.corretores} corretor(es) ativado(s) · ${r.notificados} avisado(s) por e-mail.`);
    } catch (err) {
      setPuxouMsg(getApiErrorMessage(err, "Falha ao puxar o repique."));
    }
  };

  const inputStyle = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };

  return (
    <div className="mb-6 p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>
          <input
            type="checkbox"
            checked={!!cfg?.enabled}
            onChange={(e) => setCfg.mutate({ enabled: e.target.checked })}
          />
          Repique automático ligado
        </label>
        <button
          onClick={handlePuxar}
          disabled={puxar.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--primary)", color: "white" }}
        >
          {puxar.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Puxar e enviar agora
        </button>
      </div>

      {/* Liberar leads aos poucos pro pool do Corujão */}
      <div className="mb-4 p-3 rounded-lg" style={{ background: "var(--secondary)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Rocket size={15} style={{ color: "var(--primary)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Liberar leads pro repique</span>
        </div>
        <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
          {cfg?.poolCount ?? 0} no pool · {cfg?.naoLiberados ?? 0} na fila esperando liberação
        </div>
        <div className="flex flex-wrap gap-2">
          {LOTES.map((n) => (
            <button
              key={n}
              onClick={() => handleLiberar(n)}
              disabled={liberar.isPending || (cfg?.naoLiberados ?? 0) === 0}
              className="px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              +{n}
            </button>
          ))}
          <button
            onClick={() => handleLiberar(cfg?.naoLiberados ?? 0)}
            disabled={liberar.isPending || (cfg?.naoLiberados ?? 0) === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--primary)", color: "white" }}
          >
            Liberar todos
          </button>
          <button
            onClick={async () => {
              setLibMsg("");
              try {
                const r = await removerPool.mutateAsync();
                setLibMsg(`Removidos ${r.removidos} do pool · voltaram pra fila (${r.naoLiberados}).`);
              } catch (err) {
                setLibMsg(getApiErrorMessage(err, "Falha ao remover do pool."));
              }
            }}
            disabled={removerPool.isPending || (cfg?.poolCount ?? 0) === 0}
            className="px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-50"
            style={{ borderColor: "#ef4444", color: "#ef4444" }}
          >
            Remover do pool ({cfg?.poolCount ?? 0})
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm flex-wrap" style={{ color: "var(--foreground)" }}>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Automático por dia (no horário):</span>
          <select
            value={String(cfg?.autoQtd ?? 0)}
            onChange={(e) => setCfg.mutate({ autoQtd: Number(e.target.value) })}
            className="px-2 py-1 rounded-lg border text-sm outline-none"
            style={inputStyle}
          >
            <option value="0">Desligado</option>
            {LOTES.map((n) => (
              <option key={n} value={String(n)}>{n} por dia</option>
            ))}
          </select>
        </div>

        {/* Agendar liberação automática para uma data e hora específica (1 disparo) */}
        <div className="mt-3">
          <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
            Agendar liberação automática (data e hora):
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="datetime-local"
              value={agendar}
              onChange={(e) => setAgendar(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
            <button
              onClick={() => {
                if (!agendar) return;
                setCfg.mutate({ agendadoPara: new Date(agendar).toISOString() });
                setLibMsg("Liberação agendada. No horário marcado o Corujão libera e avisa os corretores.");
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--primary)", color: "white" }}
            >
              Agendar
            </button>
          </div>
          {cfg?.agendadoPara && (
            <div className="text-xs mt-1.5 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
              🗓️ Agendado para {new Date(cfg.agendadoPara).toLocaleString("pt-BR")}
              <button
                onClick={() => { setCfg.mutate({ agendadoPara: "" }); setAgendar(""); }}
                className="underline"
                style={{ color: "var(--primary)" }}
              >
                cancelar
              </button>
            </div>
          )}
        </div>
        {libMsg && <div className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>{libMsg}</div>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Horário do repique (Brasília)</div>
          <div className="flex gap-2">
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
            <button
              onClick={() => setCfg.mutate({ hora })}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Salvar
            </button>
          </div>
        </div>

        <div>
          <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Coluna do Kanban (fonte)</div>
          <select
            value={cfg?.status || ""}
            onChange={(e) => setCfg.mutate({ status: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          >
            {(cfg?.colunas ?? []).map((c) => (
              <option key={c.key} value={c.key}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
            <input
              type="checkbox"
              checked={!!cfg?.incluirDiretor}
              onChange={(e) => setCfg.mutate({ incluirDiretor: e.target.checked })}
            />
            Incluir leads que estão com o Diretor
          </label>
        </div>
      </div>

      {puxouMsg && (
        <div className="text-xs mt-3" style={{ color: "var(--muted-foreground)" }}>{puxouMsg}</div>
      )}

      <div className="mt-4">
        <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
          Corretores ativados no Corujão ({(cfg?.corretores ?? []).filter((c) => c.corujao).length}/{(cfg?.corretores ?? []).length}) · {cfg?.poolCount ?? 0} lead(s) no repique
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {(cfg?.corretores ?? []).map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              <input
                type="checkbox"
                checked={c.corujao}
                onChange={(e) => ativar.mutate({ id: c.id, ativo: e.target.checked })}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
