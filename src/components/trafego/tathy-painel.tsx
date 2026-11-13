"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";

/**
 * Tathy — gestora de tráfego (Rodrigo 13/11). Fica DENTRO da aba Custo por Lead, em tempo real
 * (recalcula a cada minuto). REGRA: só leads de anúncio — Google Ads x Meta separados. Só o Diretor vê.
 */
type Canal = "meta" | "google";
const NOME: Record<Canal, string> = { meta: "Meta (Facebook/Instagram)", google: "Google Ads" };
const COR: Record<Canal, string> = { meta: "#3b82f6", google: "#22c55e" };
const NOTA: Record<string, { txt: string; cor: string }> = {
  bom: { txt: "Bom", cor: "#22c55e" },
  atencao: { txt: "Atenção", cor: "#f59e0b" },
  problema: { txt: "Problema", cor: "#ef4444" },
  sem_veredito: { txt: "Aprendendo", cor: "#94a3b8" },
};
const NIVEL: Record<string, string> = { critico: "#ef4444", atencao: "#f59e0b", ok: "#22c55e" };
const CARGO: Record<string, string> = { corretor: "Corretor", gerente: "Gerente", gerente_geral: "Gerente Geral", superintendente: "Superintendente", diretor: "Diretor" };
const brl = (v?: number | null) => (v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }));
const dias = (d: number) => (d < 1 ? `${Math.round(d * 24)}h` : `${d.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dia(s)`);

const SCRIPT_GOOGLE = `function main() {
  var TOKEN = 'COLE_AQUI_O_VERIFY_TOKEN_DO_K1';
  var q = "SELECT segments.date, campaign.name, ad_group.name, ad_group_ad.ad.id, " +
    "ad_group_ad.ad.responsive_search_ad.headlines, metrics.cost_micros, metrics.clicks, " +
    "metrics.impressions, metrics.conversions FROM ad_group_ad WHERE segments.date DURING THIS_MONTH";
  var it = AdsApp.search(q), linhas = [];
  while (it.hasNext()) {
    var r = it.next(), ad = r.adGroupAd.ad;
    var h = (ad.responsiveSearchAd && ad.responsiveSearchAd.headlines) || [];
    linhas.push({
      data: r.segments.date, campanha: r.campaign.name,
      anuncio: r.adGroup.name + ' · ' + (h.length ? h[0].text : 'Anúncio ' + ad.id),
      gasto: Number(r.metrics.costMicros) / 1e6, cliques: Number(r.metrics.clicks),
      impressoes: Number(r.metrics.impressions), conversoes: Number(r.metrics.conversions)
    });
  }
  UrlFetchApp.fetch('https://kayser-one-backend-production.up.railway.app/api/v1/investimento/google-direct?token=' +
    encodeURIComponent(TOKEN), { method: 'post', contentType: 'application/json', payload: JSON.stringify({ linhas: linhas }) });
}`;

export function TathyPainel({ year, month }: { year: number; month: number }) {
  const qc = useQueryClient();
  const [aba, setAba] = useState<"funil" | "parados" | "anuncios" | "perdas">("funil");
  const [canalFunil, setCanalFunil] = useState<Canal>("meta");
  const [msg, setMsg] = useState("");
  const [verScript, setVerScript] = useState(false);
  const { data, isLoading, dataUpdatedAt, error } = useQuery({
    queryKey: ["tathy", year, month],
    queryFn: async () => (await api.get(`/investimento/tathy`, { params: { year, month } })).data,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });

  const puxar = async () => {
    setMsg("Puxando os anúncios do Meta...");
    try {
      const { data: r } = await api.post(`/investimento/tathy/sincronizar?year=${year}&month=${month}`);
      setMsg(r.erro ? `Meta: ${r.erro}` : `✅ ${r.linhas} linha(s) de anúncio do Meta atualizadas.`);
      qc.invalidateQueries({ queryKey: ["tathy"] });
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Não consegui puxar agora."));
    }
  };

  const card = { background: "var(--card)", borderColor: "var(--border)" };
  const hora = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ ...card, borderColor: "#facc15aa" }}>
      {/* Cabeçalho da Tathy */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-11 h-11 rounded-full grid place-items-center font-bold text-lg" style={{ background: "linear-gradient(135deg,#facc15,#d97706)", color: "#0a0a0a" }}>T</div>
        <div className="flex-1 min-w-[200px]">
          <div className="font-semibold" style={{ color: "var(--foreground)" }}>Tathy · gestora de tráfego</div>
          <div className="text-xs flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
            Ao vivo · só leads de anúncio{hora && ` · atualizado às ${hora}`}
          </div>
        </div>
        <button onClick={puxar} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Puxar anúncios do Meta agora</button>
      </div>
      {msg && <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{msg}</div>}
      {isLoading && <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>A Tathy está lendo os números...</div>}
      {error && <div className="text-sm" style={{ color: "#ef4444" }}>{getApiErrorMessage(error, "Não consegui carregar a análise.")}</div>}

      {data && (
        <>
          {/* Avisos em tempo real */}
          <div className="space-y-2">
            {data.alertas.map((a: any, i: number) => (
              <div key={i} className="text-sm px-3 py-2 rounded-lg flex gap-2" style={{ background: `${NIVEL[a.nivel]}14`, borderLeft: `3px solid ${NIVEL[a.nivel]}`, color: "var(--foreground)" }}>
                <span>{a.nivel === "critico" ? "🔴" : a.nivel === "atencao" ? "🟡" : "🟢"}</span>
                <span>{a.texto}</span>
              </div>
            ))}
          </div>

          {/* Google Ads x Meta */}
          <div className="grid gap-3 md:grid-cols-2">
            {(["meta", "google"] as Canal[]).map((c) => {
              const k = data.canais[c];
              const itens = [
                ["Investimento", brl(k.gasto)],
                ["Leads no K1", `${k.leads}${k.leadsPlataforma ? ` (plataforma: ${Math.round(k.leadsPlataforma)})` : ""}`],
                ["Custo por lead", brl(k.cpl)],
                ["Vendas", `${k.vendas}${k.vgv ? ` · ${brl(k.vgv)}` : ""}`],
                ["Custo por venda", brl(k.custoVenda)],
                ["Sem interesse no mês", String(k.semInteresse)],
                ["Hoje", `${brl(k.gastoHoje)} · ${k.leadsHoje} lead(s)`],
              ];
              return (
                <div key={c} className="rounded-xl border p-4" style={{ borderColor: `${COR[c]}66`, background: `${COR[c]}0d` }}>
                  <div className="font-semibold mb-2" style={{ color: COR[c] }}>{NOME[c]}</div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                    {itens.map(([r, v]) => (
                      <div key={r} className="contents">
                        <dt style={{ color: "var(--muted-foreground)" }}>{r}</dt>
                        <dd className="text-right font-medium tabular-nums" style={{ color: "var(--foreground)" }}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>

          {/* Abas de detalhe */}
          <div className="flex gap-2 flex-wrap">
            {([
              ["funil", "Funil e tempo parado"],
              ["parados", `Mais parados (${data.parados.length})`],
              ["anuncios", "Anúncios Meta x Google"],
              ["perdas", `Sem interesse (${data.semInteresse.length})`],
            ] as const).map(([k, t]) => (
              <button key={k} onClick={() => setAba(k)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: aba === k ? "#facc15" : "var(--border)", background: aba === k ? "#facc1522" : "transparent", color: "var(--foreground)" }}>{t}</button>
            ))}
          </div>

          {aba === "funil" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {(["meta", "google"] as Canal[]).map((c) => (
                  <button key={c} onClick={() => setCanalFunil(c)} className="text-xs px-3 py-1 rounded-full" style={{ background: canalFunil === c ? COR[c] : "var(--secondary)", color: canalFunil === c ? "#fff" : "var(--foreground)" }}>{NOME[c]}</button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: "var(--muted-foreground)" }} className="text-left">
                      <th className="py-1.5 pr-3">Etapa</th><th className="pr-3 text-right">Leads</th><th className="pr-3 text-right">Com corretor</th>
                      <th className="pr-3 text-right">Com gerente</th><th className="pr-3 text-right">Sem dono</th><th className="pr-3 text-right">Parado (média)</th><th className="text-right">Parado (máx.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.funil.filter((f: any) => f.canal === canalFunil).map((f: any) => (
                      <tr key={f.etapa} className="border-t" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                        <td className="py-1.5 pr-3">{f.titulo}</td>
                        <td className="pr-3 text-right tabular-nums">{f.total}</td>
                        <td className="pr-3 text-right tabular-nums">{f.comCorretor}</td>
                        <td className="pr-3 text-right tabular-nums" style={{ color: f.comGestor ? "#f59e0b" : undefined }}>{f.comGestor}</td>
                        <td className="pr-3 text-right tabular-nums">{f.semDono}</td>
                        <td className="pr-3 text-right tabular-nums">{dias(f.diasMedio)}</td>
                        <td className="text-right tabular-nums" style={{ color: f.diasMax > 7 ? "#ef4444" : undefined }}>{dias(f.diasMax)}</td>
                      </tr>
                    ))}
                    {!data.funil.some((f: any) => f.canal === canalFunil) && (
                      <tr><td colSpan={7} className="py-3" style={{ color: "var(--muted-foreground)" }}>Nenhum lead deste canal ainda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {aba === "parados" && (
            <div className="space-y-1.5">
              {data.parados.map((p: any) => (
                <div key={p.id} className="text-sm flex flex-wrap gap-x-3 gap-y-0.5 px-3 py-2 rounded-lg" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                  <span className="font-medium">{p.nome}</span>
                  <span style={{ color: COR[p.canal as Canal] }}>{p.canal === "google" ? "Google" : "Meta"}</span>
                  <span style={{ color: "var(--muted-foreground)" }}>{p.etapa}</span>
                  <span style={{ color: p.dias > 3 ? "#ef4444" : "#f59e0b" }}>parado há {dias(p.dias)}</span>
                  <span className="ml-auto" style={{ color: "var(--muted-foreground)" }}>{p.responsavel ? `${p.responsavel} · ${CARGO[p.cargo] ?? p.cargo}` : "sem responsável"}</span>
                </div>
              ))}
              {!data.parados.length && <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum lead de anúncio aberto.</div>}
            </div>
          )}

          {aba === "anuncios" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {(["meta", "google"] as Canal[]).map((c) => (
                  <button key={c} onClick={() => setCanalFunil(c)} className="text-xs px-3 py-1 rounded-full" style={{ background: canalFunil === c ? COR[c] : "var(--secondary)", color: canalFunil === c ? "#fff" : "var(--foreground)" }}>
                    {NOME[c]} ({data.anuncios.filter((a: any) => a.canal === c).length})
                  </button>
                ))}
              </div>
              {data.anuncios.filter((a: any) => a.canal === canalFunil).map((a: any) => {
                const n = NOTA[a.nota] ?? NOTA.sem_veredito;
                return (
                  <div key={a.canal + a.anuncio} className="rounded-lg border p-3 space-y-1" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${n.cor}22`, color: n.cor }}>{n.txt}</span>
                      <span className="text-xs" style={{ color: COR[a.canal as Canal] }}>{a.canal === "google" ? "Google" : "Meta"}</span>
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{a.anuncio}</span>
                    </div>
                    <div className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>
                      {brl(a.gasto)} · {a.impressoes.toLocaleString("pt-BR")} impressões · {a.cliques} cliques
                      {a.ctr != null && ` · CTR ${(a.ctr * 100).toFixed(1).replace(".", ",")}%`} · {Math.round(a.conversoes)} lead(s){a.cpl != null && ` · ${brl(a.cpl)} por lead`}
                    </div>
                    <div className="text-sm" style={{ color: "var(--foreground)" }}>💡 {a.dica}</div>
                  </div>
                );
              })}
              {!data.anuncios.some((a: any) => a.canal === canalFunil) && (
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {canalFunil === "meta"
                    ? 'Ainda sem números por anúncio do Meta. Clique em "Puxar anúncios do Meta agora".'
                    : "Ainda sem números do Google Ads. Conecte o script abaixo (uma vez só)."}
                </div>
              )}
              <button onClick={() => setVerScript((v) => !v)} className="text-xs underline" style={{ color: "var(--muted-foreground)" }}>
                {verScript ? "Esconder" : "Conectar o Google Ads (script)"}
              </button>
              {verScript && (
                <div className="space-y-2 text-sm" style={{ color: "var(--foreground)" }}>
                  <p>No Google Ads: <b>Ferramentas → Ações em massa → Scripts → +</b>. Cole o código, troque <b>COLE_AQUI_O_VERIFY_TOKEN_DO_K1</b> pelo Verify Token (Configurações → Integrações), salve e programe para rodar <b>a cada hora</b>.</p>
                  <pre className="text-xs p-3 rounded-lg overflow-x-auto" style={{ background: "var(--secondary)" }}>{SCRIPT_GOOGLE}</pre>
                </div>
              )}
            </div>
          )}

          {aba === "perdas" && (
            <div className="space-y-3">
              {data.ranking.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.ranking.map((r: any) => (
                    <span key={r.nome} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "#ef444418", color: "var(--foreground)" }}>
                      {r.nome}: <b>{r.total}</b>{r.semMotivo ? ` (${r.semMotivo} sem motivo)` : ""}
                    </span>
                  ))}
                </div>
              )}
              {data.semInteresse.map((s: any) => (
                <div key={s.id} className="text-sm px-3 py-2 rounded-lg space-y-0.5" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                  <div className="flex flex-wrap gap-x-3">
                    <span className="font-medium">{s.nome}</span>
                    <span style={{ color: COR[s.canal as Canal] }}>{s.canal === "google" ? "Google" : "Meta"}</span>
                    <span style={{ color: "var(--muted-foreground)" }}>corretor: {s.corretor ?? "—"}{s.marcadoPor && s.marcadoPor !== s.corretor ? ` · marcado por ${s.marcadoPor}` : ""}</span>
                    <span className="ml-auto text-xs" style={{ color: "var(--muted-foreground)" }}>{new Date(s.em).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div style={{ color: s.motivo ? "var(--foreground)" : "#f59e0b" }}>“{s.motivo ?? "sem justificativa (marcado antes da regra)"}”</div>
                </div>
              ))}
              {!data.semInteresse.length && <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum lead de anúncio marcado como sem interesse neste mês.</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
