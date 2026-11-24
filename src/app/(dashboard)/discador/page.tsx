"use client";

import { useEffect, useState } from "react";
import { Loader2, PhoneCall, PhoneOff, Power } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";

type Proximo = { id: string; nome: string; telefone: string; empreendimento: string; status: string };
type Painel = {
  ligado: boolean;
  numeros: string[];
  telefoniaConectada: boolean;
  podeGerir: boolean;
  ehDiretor: boolean;
  euIncluido: boolean;
  euCheckin: boolean;
  equipe: { id: string; nome: string; incluido: boolean; checkin: boolean }[];
  indicadores: { feitas: number; atendidas: number; naoAtendidas: number; caixaPostal: number; whatsapp: number; taxa: number };
  porCorretor: { nome: string; feitas: number; atendidas: number; naoAtendidas: number; caixaPostal: number; whatsapp: number; duracaoMedia: number }[];
  ultimas: { id: string; resultado: string; duracaoSeg: number | null; anotacao: string | null; whatsappEnviado: boolean; createdAt: string; lead: string; corretor: string }[];
  proximos: Proximo[];
};

const RESULTADOS: { key: string; label: string; cor: string }[] = [
  { key: "atendeu", label: "✅ Atendeu", cor: "#22c55e" },
  { key: "nao_atendeu", label: "📵 Não atendeu", cor: "#f59e0b" },
  { key: "caixa_postal", label: "📼 Caixa postal", cor: "#f97316" },
  { key: "ocupado", label: "⛔ Ocupado", cor: "#a1a1aa" },
  { key: "numero_invalido", label: "❌ Número inválido", cor: "#ef4444" },
];
const nomeResultado = (k: string) => RESULTADOS.find((r) => r.key === k)?.label ?? k;
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const card = { background: "var(--card)", borderColor: "var(--border)" };

/** Discador do K1 (24/11): o K1 liga pelos números virtuais; o corretor fala pelo K1. */
export default function DiscadorPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [anotacao, setAnotacao] = useState("");
  const [pulados, setPulados] = useState<string[]>([]);
  const [numeros, setNumeros] = useState<string[] | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["discador"],
    refetchInterval: 15_000,
    queryFn: async () => (await api.get<Painel>("/discador")).data,
  });
  useEffect(() => {
    if (data && numeros === null) setNumeros([0, 1, 2].map((i) => data.numeros[i] || ""));
  }, [data, numeros]);
  const atualizar = () => qc.invalidateQueries({ queryKey: ["discador"] });
  const erro = (e: unknown) => setMsg(getApiErrorMessage(e, "Não deu certo. Tente de novo."));

  const ligado = useMutation({
    mutationFn: async (v: boolean) => (await api.put("/discador/ligado", { ligado: v })).data,
    onSuccess: atualizar,
    onError: erro,
  });
  const corretor = useMutation({
    mutationFn: async (p: { id: string; incluido: boolean }) => (await api.put(`/discador/corretor/${p.id}`, { incluido: p.incluido })).data,
    onSuccess: atualizar,
    onError: erro,
  });
  const salvarNumeros = useMutation({
    mutationFn: async () => (await api.put("/discador/numeros", { numeros: (numeros || []).filter(Boolean) })).data,
    onSuccess: () => {
      setMsg("✅ Números salvos.");
      atualizar();
    },
    onError: erro,
  });
  const registrar = useMutation({
    mutationFn: async (p: { leadId: string; resultado: string }) =>
      (await api.post<{ whatsappEnviado: boolean }>("/discador/ligacoes", { ...p, anotacao: anotacao || undefined })).data,
    onSuccess: (r, p) => {
      setMsg(r.whatsappEnviado ? "✅ Ligação registrada e WhatsApp enviado pro cliente." : "✅ Ligação registrada no histórico do lead.");
      setAnotacao("");
      setPulados((x) => [...x, p.leadId]);
      atualizar();
    },
    onError: erro,
  });

  if (isLoading || !data) return <Loader2 className="animate-spin m-6" />;
  const lead = data.proximos.find((l) => !pulados.includes(l.id));
  const ind = data.indicadores;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PhoneCall size={22} style={{ color: "var(--primary)" }} />
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Discador</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          O K1 liga pros leads pelos números da Kayser. O cliente atendeu: a ligação vai pro corretor de plantão com check-in, que fala pelo K1 com
          fone de ouvido. Não atendeu ou caixa postal: o K1 manda WhatsApp na hora.
        </p>
      </div>

      {!data.telefoniaConectada && (
        <div className="p-3 rounded-xl border text-sm" style={{ borderColor: "#f59e0b", color: "var(--foreground)", background: "rgba(245,158,11,.08)" }}>
          ⏳ <b>Telefonia ainda não conectada.</b> As ligações automáticas começam quando os números virtuais forem ligados ao K1. Até lá, registre aqui o
          resultado das ligações: o histórico, o WhatsApp e os indicadores já funcionam.
        </div>
      )}
      {msg && <p className="text-sm" style={{ color: "var(--foreground)" }}>{msg}</p>}

      {/* Indicadores de hoje */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ["Ligações feitas", ind.feitas],
          ["Atenderam", ind.atendidas],
          ["Taxa de atendimento", `${ind.taxa}%`],
          ["Não atenderam", ind.naoAtendidas],
          ["Caixa postal", ind.caixaPostal],
          ["WhatsApps enviados", ind.whatsapp],
        ].map(([t, v]) => (
          <div key={t as string} className="p-3 rounded-2xl border" style={card}>
            <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{v}</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t} hoje</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Telefone */}
        <div className="p-4 rounded-2xl border" style={card}>
          <h2 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>📞 Telefone</h2>
          {!data.podeGerir && (
            <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
              {data.euIncluido ? "Você está no Discador." : "Você ainda não foi incluído no Discador pelo seu gerente."}{" "}
              {data.euCheckin ? "Check-in feito ✅" : "Faça o check-in no plantão pra receber as ligações."}
            </p>
          )}
          {lead ? (
            <>
              <div className="p-3 rounded-xl border mb-3" style={{ borderColor: "var(--border)" }}>
                <div className="font-semibold" style={{ color: "var(--foreground)" }}>{lead.nome}</div>
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {lead.telefone}
                  {lead.empreendimento ? ` · 🏢 ${lead.empreendimento}` : ""}
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  disabled={!data.telefoniaConectada}
                  title={data.telefoniaConectada ? "" : "Disponível quando a telefonia for conectada"}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold disabled:opacity-40"
                  style={{ background: "#22c55e", color: "#0a0a0a" }}
                >
                  <PhoneCall size={18} /> Ligar
                </button>
                <button
                  disabled={!data.telefoniaConectada}
                  title={data.telefoniaConectada ? "" : "Disponível quando a telefonia for conectada"}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold disabled:opacity-40"
                  style={{ background: "#ef4444", color: "#fff" }}
                >
                  <PhoneOff size={18} /> Desligar
                </button>
              </div>
              <textarea
                value={anotacao}
                onChange={(e) => setAnotacao(e.target.value)}
                placeholder="Escreva aqui o que o cliente falou (vai pro histórico do lead)"
                rows={3}
                className="w-full p-2 rounded-xl border text-sm mb-3 bg-transparent"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Como foi a ligação?</div>
              <div className="flex flex-wrap gap-2">
                {RESULTADOS.map((r) => (
                  <button
                    key={r.key}
                    disabled={registrar.isPending}
                    onClick={() => registrar.mutate({ leadId: lead.id, resultado: r.key })}
                    className="px-3 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
                    style={{ borderColor: r.cor, color: r.cor }}
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setPulados((x) => [...x, lead.id])}
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Pular
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum lead pra ligar agora (Novo Lead e Primeiro Contato com telefone).</p>
          )}
        </div>

        {/* Controle do gestor */}
        {data.podeGerir && (
          <div className="p-4 rounded-2xl border" style={card}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Discador automático</h2>
              <button
                onClick={() => ligado.mutate(!data.ligado)}
                disabled={ligado.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold disabled:opacity-50"
                style={data.ligado ? { background: "#ef4444", color: "#fff" } : { background: "#22c55e", color: "#0a0a0a" }}
              >
                <Power size={16} /> {data.ligado ? "Desligar" : "Ligar"}
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: data.ligado ? "#22c55e" : "var(--muted-foreground)" }}>
              {data.ligado ? "● Ligado: o K1 está chamando os leads." : "○ Desligado."}
            </p>
            {data.ehDiretor && numeros && (
              <div className="mb-4">
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Números virtuais (até 3)</div>
                <div className="flex flex-wrap gap-2">
                  {numeros.map((n, i) => (
                    <input
                      key={i}
                      value={n}
                      onChange={(e) => setNumeros(numeros.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`+55 21 …  (número ${i + 1})`}
                      className="flex-1 min-w-[140px] p-2 rounded-lg border text-sm bg-transparent"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  ))}
                  <button
                    onClick={() => salvarNumeros.mutate()}
                    disabled={salvarNumeros.isPending}
                    className="px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                    style={{ background: "var(--primary)", color: "#0a0a0a" }}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
            <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Corretores no Discador</div>
            <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
              {data.equipe.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <span style={{ color: "var(--foreground)" }}>
                    {c.nome}{" "}
                    <span className="text-xs" style={{ color: c.checkin ? "#22c55e" : "var(--muted-foreground)" }}>
                      {c.checkin ? "· check-in ✅" : "· sem check-in"}
                    </span>
                  </span>
                  <button
                    onClick={() => corretor.mutate({ id: c.id, incluido: !c.incluido })}
                    disabled={corretor.isPending}
                    className="px-3 py-1 rounded-lg text-xs font-bold border disabled:opacity-50"
                    style={c.incluido ? { borderColor: "#ef4444", color: "#ef4444" } : { borderColor: "#22c55e", color: "#22c55e" }}
                  >
                    {c.incluido ? "Remover" : "Incluir"}
                  </button>
                </div>
              ))}
              {!data.equipe.length && <p className="text-sm py-2" style={{ color: "var(--muted-foreground)" }}>Nenhum corretor na sua equipe.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Por corretor */}
      {data.porCorretor.length > 0 && (
        <div className="p-4 rounded-2xl border overflow-x-auto" style={card}>
          <h2 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>Hoje por corretor</h2>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--muted-foreground)" }} className="text-left">
                <th className="py-1">Corretor</th>
                <th>Feitas</th>
                <th>Atenderam</th>
                <th>Não atenderam</th>
                <th>Caixa postal</th>
                <th>WhatsApp</th>
                <th>Tempo médio</th>
              </tr>
            </thead>
            <tbody style={{ color: "var(--foreground)" }}>
              {data.porCorretor.map((r) => (
                <tr key={r.nome} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-1.5">{r.nome}</td>
                  <td>{r.feitas}</td>
                  <td>{r.atendidas}</td>
                  <td>{r.naoAtendidas}</td>
                  <td>{r.caixaPostal}</td>
                  <td>{r.whatsapp}</td>
                  <td>{r.duracaoMedia ? `${Math.round(r.duracaoMedia / 60)} min` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Últimas ligações */}
      <div className="p-4 rounded-2xl border" style={card}>
        <h2 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>Últimas ligações de hoje</h2>
        {data.ultimas.length ? (
          <div className="space-y-2">
            {data.ultimas.map((u) => (
              <div key={u.id} className="text-sm" style={{ color: "var(--foreground)" }}>
                <span style={{ color: "var(--muted-foreground)" }}>{hora(u.createdAt)}</span> · <b>{u.lead || "—"}</b> · {nomeResultado(u.resultado)}
                {u.whatsappEnviado ? " · 💬 WhatsApp" : ""} · <span style={{ color: "var(--muted-foreground)" }}>{u.corretor}</span>
                {u.anotacao && <div className="text-xs ml-12" style={{ color: "var(--muted-foreground)" }}>📝 {u.anotacao}</div>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma ligação hoje ainda.</p>
        )}
      </div>
    </div>
  );
}
