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

  const handleAceitar = async (id: string) => {
    setMsg("");
    try {
      await aceitar.mutateAsync(id);
      setMsg("Lead aceito! 🎉 Já está com você em Novo Lead — abra o CRM/WhatsApp pra falar com o cliente.");
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Falha ao aceitar o lead."));
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Coruja size={52} />
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Corujão — repique de leads</h1>
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
        Leads sem interesse (e os que estão com o Diretor) voltam pra cá. Clique em <b>Aceitar</b> pra assumir — o lead vira seu e volta pra “Novo Lead”.
      </p>

      {/* Foguete voando: chama o corretor quando tem lead liberado no Corujão. */}
      {podePegar && leads.length > 0 && (
        <>
          <div aria-hidden className="corujao-rocket">🚀</div>
          <style>{`
            .corujao-rocket{position:fixed;left:-60px;bottom:48px;font-size:40px;z-index:40;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.3));animation:corujaoFly 5s linear infinite;}
            @keyframes corujaoFly{
              0%{transform:translate(0,0) rotate(-28deg);opacity:0;}
              8%{opacity:1;}
              88%{opacity:1;}
              100%{transform:translate(108vw,-78vh) rotate(-28deg);opacity:0;}
            }
            @media (prefers-reduced-motion: reduce){ .corujao-rocket{display:none;} }
          `}</style>
        </>
      )}

      {isDiretor && <ConfigPanel />}

      {msg && (
        <div className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>{msg}</div>
      )}

      <h2 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Leads para pegar {pool ? `(${leads.length})` : ""}
      </h2>
      {!podePegar && !isDiretor && (
        <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
          Só corretores ativados no Corujão pegam os leads. Você está vendo em modo consulta.
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={16} className="animate-spin" /> Carregando…
        </div>
      ) : leads.length === 0 ? (
        <div className="p-4 rounded-xl border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          Nenhum lead no repique agora. 🎉
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {leads.map((l) => (
            <div key={l.id} className="p-3 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="font-medium" style={{ color: "var(--foreground)" }}>{l.name || "🔒 Lead disponível"}</div>
              {l.phone && (
                <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  <Phone size={12} /> {l.phone}
                </div>
              )}
              {l.empreendimento && (
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>🏢 {l.empreendimento}</div>
              )}
              {(l.origem || l.responsavel) && (
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {l.origem || "—"}{l.responsavel ? ` · atual: ${l.responsavel}` : ""}
                </div>
              )}
              {podePegar && (
                <button
                  onClick={() => handleAceitar(l.id)}
                  disabled={aceitar.isPending}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  <Check size={15} /> Aceitar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
