"use client";

import { useEffect, useState } from "react";
import { Moon, Loader2, Check, Send, Phone } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import {
  useCorujaoPool,
  useAceitarCorujao,
  useCorujaoConfig,
  useSetCorujaoConfig,
  useAtivarCorretorCorujao,
  usePuxarCorujao,
} from "@/hooks/use-corujao";

export default function CorujaoPage() {
  const isDiretor = getStoredUser()?.role === "diretor";
  const { data: pool, isLoading, isError, error } = useCorujaoPool();
  const aceitar = useAceitarCorujao();
  const [msg, setMsg] = useState("");

  const handleAceitar = async (id: string, nome: string) => {
    setMsg("");
    try {
      await aceitar.mutateAsync(id);
      setMsg(`Você aceitou o lead "${nome}". Ele já está com você em Novo Lead.`);
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Falha ao aceitar o lead."));
    }
  };

  const naoAtivado = isError && (error as any)?.response?.status === 403;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Moon size={22} style={{ color: "var(--primary)" }} />
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Corujão — repique de leads</h1>
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
        Leads sem interesse (e os que estão com o Diretor) voltam pra cá. Clique em <b>Aceitar</b> pra assumir — o lead vira seu e volta pra “Novo Lead”.
      </p>

      {isDiretor && <ConfigPanel />}

      {msg && (
        <div className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>{msg}</div>
      )}

      <h2 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>
        Leads para pegar {pool ? `(${pool.length})` : ""}
      </h2>

      {naoAtivado ? (
        <div className="p-4 rounded-xl border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          Você ainda não está ativado no Corujão. Peça ao Diretor para te ativar na fila do repique.
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <Loader2 size={16} className="animate-spin" /> Carregando…
        </div>
      ) : (pool ?? []).length === 0 ? (
        <div className="p-4 rounded-xl border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          Nenhum lead no repique agora. 🎉
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {(pool ?? []).map((l) => (
            <div key={l.id} className="p-3 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="font-medium" style={{ color: "var(--foreground)" }}>{l.name}</div>
              <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                <Phone size={12} /> {l.phone || "—"}
              </div>
              {l.empreendimento && (
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>🏢 {l.empreendimento}</div>
              )}
              <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {l.origem || "—"} · atual: {l.responsavel}
              </div>
              <button
                onClick={() => handleAceitar(l.id, l.name)}
                disabled={aceitar.isPending}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                style={{ background: "var(--primary)", color: "white" }}
              >
                <Check size={15} /> Aceitar
              </button>
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
  const [hora, setHora] = useState("14:00");
  const [puxouMsg, setPuxouMsg] = useState("");

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
