"use client";

import { useState } from "react";
import { MapPin, Loader2, RefreshCw } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { usePlantaoPainel, pegarLocalizacao } from "@/hooks/use-plantao";
import { useUpdateSettings } from "@/hooks/use-settings";

/** Diretor: stands (endereço de stand dos imóveis) no mapa + check-ins de hoje + liga/desliga. */
export function PainelPlantao() {
  const { data: p } = usePlantaoPainel(true);
  const qc = useQueryClient();
  const updateSettings = useUpdateSettings();
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);

  const recarregar = () => qc.invalidateQueries({ queryKey: ["plantao"] });

  const localizar = async () => {
    setOcupado("localizar");
    setMsg("Localizando os stands no mapa… (pode levar até 1 minuto)");
    try {
      const { data } = await api.post<{ localizados: number; semLocalizacao: string[] }>("/plantao/localizar-stands");
      setMsg(
        `✅ ${data.localizados} stand(s) localizado(s).` +
          (data.semLocalizacao.length ? ` Sem localização pelo endereço: ${data.semLocalizacao.join(", ")} — vá até o stand e use "📍 Estou aqui".` : "")
      );
      recarregar();
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Falha ao localizar."));
    } finally {
      setOcupado(null);
    }
  };

  const estouAqui = async (propertyId: string, nome: string) => {
    if (!window.confirm(`Você está AGORA no stand do ${nome}? A localização deste aparelho vira a do stand.`)) return;
    setOcupado(propertyId);
    try {
      const loc = await pegarLocalizacao();
      await api.post(`/plantao/stand/${propertyId}/localizacao`, { lat: loc.lat, lng: loc.lng });
      setMsg(`✅ Localização do stand ${nome} gravada (precisão ~${Math.round(loc.precisao)} m).`);
      recarregar();
    } catch (err) {
      setMsg(err instanceof Error && !(err as any).response ? err.message : getApiErrorMessage(err, "Falha ao gravar."));
    } finally {
      setOcupado(null);
    }
  };

  // Cola "lat, lng" ou um link do Google Maps (…@-23.00,-43.36… ou ?q=-23.00,-43.36).
  const colar = async (propertyId: string, nome: string) => {
    const t = window.prompt(
      `Coordenada do stand ${nome}:\nNo Google Maps, clique com o botão direito no stand e clique nos números (ex.: -23.0012, -43.3654) — ou cole o link do lugar.`,
      ""
    );
    if (!t) return;
    const m = t.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
    if (!m) {
      setMsg("Não entendi a coordenada. Cole no formato -23.0012, -43.3654 ou o link do Google Maps.");
      return;
    }
    setOcupado(propertyId);
    try {
      await api.post(`/plantao/stand/${propertyId}/localizacao`, { lat: Number(m[1]), lng: Number(m[2]) });
      setMsg(`✅ Localização do stand ${nome} gravada.`);
      recarregar();
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Falha ao gravar."));
    } finally {
      setOcupado(null);
    }
  };

  const liberar = async (userId: string, turnoId: string, nome: string, hora: string) => {
    if (!window.confirm(`Liberar ${nome} no plantão das ${hora} sem check-in pelo GPS?`)) return;
    setOcupado(userId + turnoId);
    try {
      await api.post("/plantao/liberar", { userId, turnoId });
      setMsg(`✅ ${nome} liberado no plantão das ${hora}.`);
      recarregar();
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Falha ao liberar."));
    } finally {
      setOcupado(null);
    }
  };

  // Plantão livre (todos os corretores, sem escala) x plantão antigo (por escala).
  const diaSP = (somaDias: number) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(Date.now() + somaDias * 86_400_000));
  const mudarModo = async (desde: string | null) => {
    const txt = desde
      ? `Plantão LIVRE a partir de ${desde.split("-").reverse().join("/")}: todo corretor pode fazer check-in em qualquer turno (sem escala). Confirmar?`
      : "Voltar ao plantão ANTIGO (por escala)? Só quem está na escala do turno entra.";
    if (!window.confirm(txt)) return;
    await updateSettings.mutateAsync({ plantaoLivreDesde: desde } as any);
    setMsg(desde ? "✅ Plantão livre agendado." : "✅ Voltou ao plantão por escala.");
    recarregar();
  };

  const ajustarPeloCheckin = async (id: string, nome: string, stand: string) => {
    if (!window.confirm(`Usar a posição do check-in de ${nome} como a localização exata do stand ${stand}?`)) return;
    setOcupado(id);
    try {
      await api.post(`/plantao/checkin/${id}/usar-como-stand`);
      setMsg(`✅ Stand ${stand} ajustado com a posição de ${nome}.`);
      recarregar();
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Falha ao ajustar o stand."));
    } finally {
      setOcupado(null);
    }
  };

  const usarPosicao = async (id: string, nome: string, stand: string | null) => {
    if (!window.confirm(`${nome} está AGORA no stand ${stand ?? ""}? A posição do celular dele vira a localização do stand (e libera o check-in de todos lá).`)) return;
    setOcupado(id);
    try {
      await api.post(`/plantao/tentativa/${id}/usar-como-stand`);
      setMsg(`✅ Stand ${stand ?? ""} corrigido com a posição de ${nome}. Peça pra ele tentar o check-in de novo.`);
      recarregar();
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Falha ao corrigir o stand."));
    } finally {
      setOcupado(null);
    }
  };

  const alternar = async () => {
    const liga = !p?.checkinObrigatorio;
    if (!window.confirm(liga ? "Ligar o check-in obrigatório? Quem não fizer check-in no turno não recebe lead." : "Desligar o check-in obrigatório? A fila volta a mandar lead pra todos da escala.")) return;
    await updateSettings.mutateAsync({ checkinObrigatorio: liga } as any);
    recarregar();
  };

  if (!p) return null;
  const box = { background: "var(--card)", borderColor: "var(--border)" };

  return (
    <div className="mt-6 rounded-2xl border p-4" style={box}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div>
          <div className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <MapPin size={18} /> Check-in do plantão (GPS)
          </div>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            O corretor da escala faz check-in pelo celular a até <b>{p.raio} m</b> de um stand. Sem check-in no turno, não recebe lead.
          </div>
        </div>
        <button
          onClick={alternar}
          className="px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{ background: p.checkinObrigatorio ? "#22c55e" : "var(--secondary)", color: p.checkinObrigatorio ? "white" : "var(--foreground)" }}
        >
          {p.checkinObrigatorio ? "🟢 Obrigatório (ligado)" : "⚪ Desligado"}
        </button>
      </div>
      {p.checkinObrigatorio && !p.regraAtiva && (
        <p className="text-xs mb-2" style={{ color: "#f59e0b" }}>
          A regra começa a valer quando TODOS os stands estiverem no mapa{p.faltamLocalizar ? ` — faltam ${p.faltamLocalizar} (🔴 abaixo)` : ""}. Até lá, a fila distribui normal.
        </p>
      )}
      <div className="rounded-xl p-3 mb-2 flex items-center gap-2 flex-wrap" style={{ background: "var(--secondary)" }}>
        <div className="flex-1 min-w-[200px] text-sm" style={{ color: "var(--foreground)" }}>
          {p.modoLivre ? (
            <>🔓 <b>Plantão livre</b> — todo corretor pode fazer check-in em qualquer turno (sem escala).</>
          ) : p.plantaoLivreDesde ? (
            <>📋 Plantão por escala — <b>livre a partir de {p.plantaoLivreDesde.split("-").reverse().join("/")}</b>.</>
          ) : (
            <>📋 <b>Plantão por escala</b> — só quem está na escala do turno entra.</>
          )}
        </div>
        {p.modoLivre || p.plantaoLivreDesde ? (
          <button onClick={() => mudarModo(null)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            ↩️ Voltar ao plantão antigo (escala)
          </button>
        ) : (
          <>
            <button onClick={() => mudarModo(diaSP(1))} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "#22c55e", color: "white" }}>
              🔓 Liberar todos a partir de amanhã
            </button>
            <button onClick={() => mudarModo(diaSP(0))} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
              Liberar todos agora
            </button>
          </>
        )}
      </div>
      {msg && <p className="text-sm mb-2" style={{ color: "var(--foreground)" }}>{msg}</p>}

      <div className="flex items-center justify-between mt-3 mb-1">
        <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Stands (endereço de stand dos imóveis)</div>
        <button onClick={localizar} disabled={!!ocupado} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 disabled:opacity-60" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
          {ocupado === "localizar" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Localizar stands
        </button>
      </div>
      {p.stands.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum imóvel com “Endereço do stand” preenchido. Cadastre em Imóveis.</p>
      ) : (
        <div className="space-y-1.5">
          {p.stands.map((s) => (
            <div key={s.propertyId} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl" style={{ background: "var(--secondary)" }}>
              <span>{s.localizado ? "🟢" : "🔴"}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" style={{ color: "var(--foreground)" }}>{s.nome}</div>
                <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                  {s.endereco}
                  {s.localizado && s.lat != null && (
                    <>
                      {" · "}
                      <a href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>ver no mapa</a>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => colar(s.propertyId, s.nome)} disabled={!!ocupado} className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-60" style={{ background: "var(--card)", color: "var(--foreground)" }} title="Colar coordenada/link do Google Maps">
                🗺️ Colar do Maps
              </button>
              <button onClick={() => estouAqui(s.propertyId, s.nome)} disabled={!!ocupado} className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-60" style={{ background: "var(--card)", color: "var(--foreground)" }} title="Use quando estiver no stand — fica exato">
                {ocupado === s.propertyId ? "…" : "📍 Estou aqui"}
              </button>
            </div>
          ))}
        </div>
      )}

      {!!p.turnosHoje?.length && (
        <>
          <div className="text-sm font-semibold mt-4 mb-1" style={{ color: "var(--foreground)" }}>Liberar plantão manualmente (hoje)</div>
          <div className="space-y-2">
            {p.turnosHoje.map((t) => (
              <div key={t.id} className="px-3 py-2 rounded-xl" style={{ background: "var(--secondary)" }}>
                <div className="text-xs font-semibold mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  Turno {t.horaInicio}–{t.horaFim}
                </div>
                {p.modoLivre && (
                  <select
                    value=""
                    disabled={!!ocupado}
                    onChange={(e) => {
                      const c = p.corretores?.find((x) => x.id === e.target.value);
                      if (c) liberar(c.id, t.id, c.nome, t.horaInicio);
                    }}
                    className="text-xs px-2 py-1.5 rounded-lg border outline-none mb-1.5"
                    style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    <option value="">🔓 Liberar corretor neste turno…</option>
                    {(p.corretores ?? [])
                      .filter((c) => !t.atendentes.some((a) => a.id === c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                  </select>
                )}
                {t.atendentes.length === 0 ? (
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.modoLivre ? "Ninguém entrou ainda." : "Ninguém na escala."}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {t.atendentes.map((a) =>
                      a.bloqueado ? (
                        <span key={a.id} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "#ef44441a", color: "var(--foreground)" }}>
                          ⛔ {a.nome}
                        </span>
                      ) : a.entrou ? (
                        <span key={a.id} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "#22c55e1f", color: "var(--foreground)" }} title={a.como ?? ""}>
                          🟢 {a.nome}
                        </span>
                      ) : (
                        <button
                          key={a.id}
                          onClick={() => liberar(a.id, t.id, a.nome, t.horaInicio)}
                          disabled={!!ocupado}
                          className="text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                          style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                        >
                          {ocupado === a.id + t.id ? "…" : `🔓 Liberar ${a.nome}`}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {(() => {
        const falhas = (p.tentativasHoje ?? []).filter((t) => !t.entrou);
        if (!falhas.length) return null;
        return (
          <>
            <div className="text-sm font-semibold mt-4 mb-1" style={{ color: "var(--foreground)" }}>
              ⚠️ Tentaram e não conseguiram entrar hoje ({falhas.length})
            </div>
            <div className="space-y-1.5">
              {falhas.map((t, i) => (
                <div key={i} className="text-xs px-3 py-2 rounded-xl" style={{ background: "#f59e0b1a", color: "var(--foreground)" }}>
                  <b>{t.nome}</b> · {new Date(t.hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {t.vezes > 1 ? ` · ${t.vezes} tentativas` : ""}
                  {t.distancia != null && t.stand ? ` · ${t.distancia >= 1000 ? (t.distancia / 1000).toFixed(1) + " km" : t.distancia + " m"} do ${t.stand}` : ""}
                  <div style={{ color: "var(--muted-foreground)" }}>{t.motivo}</div>
                  {t.podeUsarPosicao && (
                    <button
                      onClick={() => usarPosicao(t.id, t.nome, t.stand)}
                      disabled={!!ocupado}
                      className="mt-1.5 text-xs px-2.5 py-1 rounded-lg disabled:opacity-60"
                      style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                    >
                      {ocupado === t.id ? "…" : `📍 Ele está no stand: usar a posição dele como o ${t.stand}`}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        );
      })()}

      <div className="text-sm font-semibold mt-4 mb-1" style={{ color: "var(--foreground)" }}>
        Check-ins de hoje {p.turnoAtivo ? `· turno atual ${p.turnoAtivo.horaInicio}–${p.turnoAtivo.horaFim}` : "· sem turno agora"}
      </div>
      {p.checkinsHoje.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Ninguém fez check-in hoje ainda.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {p.checkinsHoje.map((c, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: c.doTurnoAtual ? "#22c55e1f" : "var(--secondary)", color: "var(--foreground)" }}>
              {c.doTurnoAtual ? "🟢" : "⚪"} {c.nome} · {c.stand} · {new Date(c.hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              {c.podeUsarPosicao && c.id && (
                <button onClick={() => ajustarPeloCheckin(c.id!, c.nome, c.stand)} disabled={!!ocupado} className="ml-1.5 underline disabled:opacity-60" title="Usar a posição deste check-in como a localização exata do stand">
                  {ocupado === c.id ? "…" : "📍 ajustar stand"}
                </button>
              )}
              {c.precisao != null && (
                <span title="Precisão do GPS informada pelo celular. 0–1 m costuma ser GPS falso." style={{ color: c.precisao <= 1 ? "#ef4444" : "var(--muted-foreground)" }}>
                  {" "}· GPS ±{c.precisao} m{c.precisao <= 1 ? " ⚠️ suspeito" : ""}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
