"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

type Painel = {
  gestorId: string;
  ativo: boolean;
  corretores: { id: string; name: string; noRodizio: boolean }[];
  enviadosHoje: number; simHoje: number; naoHoje: number;
  enviadosTotal: number; simTotal: number; naoTotal: number;
  aguardando: number; faltam: number;
  ultimas: { nome: string | null; tipo: string; texto: string | null; createdAt: string }[];
};
type Linha = { gestorId: string; name: string; role: string; ativo: boolean; faltam: number; enviados: number; sim: number };

const card = { background: "var(--card)", borderColor: "var(--border)" };
const CARGO: Record<string, string> = { superintendente: "Superintendente", gerente_geral: "Gerente Geral", gerente: "Gerente" };

/**
 * Fila da Equipe (25/10): planilha do gestor → o K1 chama pelo número central (9h–22h,
 * sem check-in) → quem responde "sim" vai em rodízio pros corretores dele.
 * Gestor: vê a dele e escolhe os corretores. Diretor: liga/desliga cada fila.
 */
export function FilaEquipe() {
  const role = getStoredUser()?.role ?? "";
  if (role === "diretor") return <FilasDoDiretor />;
  if (["superintendente", "gerente_geral", "gerente"].includes(role)) return <MinhaFila />;
  return null;
}

function Numeros({ p }: { p: Painel }) {
  const caixa = (n: number, rot: string, total: number, cor: string) => (
    <div className="rounded-xl border p-3 text-center" style={{ borderColor: cor, background: `${cor}14` }}>
      <div className="text-2xl font-bold" style={{ color: cor }}>{n}</div>
      <div className="text-xs" style={{ color: "var(--foreground)" }}>{rot}</div>
      <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>total {total}</div>
    </div>
  );
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {caixa(p.enviadosHoje, "chamados hoje", p.enviadosTotal, "#3b82f6")}
        {caixa(p.simHoje, "sim → corretor", p.simTotal, "#22c55e")}
        {caixa(p.naoHoje, "não → removido", p.naoTotal, "#ef4444")}
      </div>
      <div className="text-xs flex gap-4 flex-wrap" style={{ color: "var(--muted-foreground)" }}>
        <span>⏳ Aguardando resposta: <b style={{ color: "var(--foreground)" }}>{p.aguardando}</b></span>
        <span>Faltam chamar: <b style={{ color: "var(--foreground)" }}>{p.faltam}</b></span>
      </div>
    </>
  );
}

function MinhaFila() {
  const qc = useQueryClient();
  const { data: p } = useQuery({
    queryKey: ["fila-equipe", "minha"],
    refetchInterval: 60_000,
    queryFn: async () => (await api.get<Painel>("/fila-equipe/minha")).data,
  });
  if (!p) return null;
  const noRodizio = p.corretores.filter((c) => c.noRodizio);
  const foraDoRodizio = p.corretores.filter((c) => !c.noRodizio);
  const salvar = async (novos: string[]) => {
    try {
      const { data } = await api.put<Painel>("/fila-equipe/minha/corretores", { memberIds: novos });
      qc.setQueryData(["fila-equipe", "minha"], data);
    } catch (err) {
      alert(getApiErrorMessage(err, "Falha ao salvar os corretores."));
    }
  };
  return (
    <div className="rounded-2xl border p-4 space-y-3" style={card}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Users size={18} /> Fila da minha equipe
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: p.ativo ? "#22c55e22" : "var(--secondary)", color: p.ativo ? "#22c55e" : "var(--muted-foreground)" }}>
          {p.ativo ? "Ligada · 9h às 22h" : "Desligada — o Diretor liga"}
        </span>
      </div>
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Suba a planilha em Leads marcando <b>“Mandar para a fila da minha equipe”</b>. O K1 chama cada cliente pelo WhatsApp
        (sem precisar de check-in) e quem responder com interesse vai em rodízio para os corretores marcados abaixo.
      </p>
      <Numeros p={p} />
      <div className="space-y-2">
        <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          No rodízio ({noRodizio.length})
        </div>
        {noRodizio.length === 0 ? (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#f59e0b1a", color: "#d97706" }}>
            Nenhum corretor no rodízio: quem responder “sim” fica com você. Coloque pelo menos um corretor abaixo.
          </p>
        ) : (
          noRodizio.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "#22c55e55", background: "#22c55e0d", color: "var(--foreground)" }}>
              <span className="text-xs w-6" style={{ color: "var(--muted-foreground)" }}>{i + 1}º</span>
              <span className="flex-1">{c.name}</span>
              <button
                onClick={() => salvar(noRodizio.filter((x) => x.id !== c.id).map((x) => x.id))}
                className="text-xs px-2.5 py-1 rounded-lg border"
                style={{ borderColor: "#ef444466", color: "#ef4444" }}
              >
                Remover
              </button>
            </div>
          ))
        )}
        {p.corretores.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum corretor ativo na sua equipe.</p>
        ) : foraDoRodizio.length > 0 ? (
          <select
            value=""
            onChange={(e) => e.target.value && salvar([...noRodizio.map((x) => x.id), e.target.value])}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <option value="">+ Colocar corretor no rodízio…</option>
            {foraDoRodizio.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Todos os corretores da sua equipe já estão no rodízio.</p>
        )}
      </div>
      {p.ultimas.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Últimas respostas</div>
          {p.ultimas.slice(0, 6).map((u, i) => (
            <div key={i} className="text-xs py-1 border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              {u.tipo === "sim" ? "✅ Sim → corretor" : "❌ Não → removido"} · <b style={{ color: "var(--foreground)" }}>{u.nome || "Cliente"}</b>
              {u.texto ? ` — “${u.texto.slice(0, 80)}”` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Filas de todos os gestores + liga/desliga (só Diretor). Usado aqui e no quadro da IA. */
function useFilasDoDiretor() {
  const qc = useQueryClient();
  const { data: filas } = useQuery({
    queryKey: ["fila-equipe", "todas"],
    refetchInterval: 60_000,
    queryFn: async () => (await api.get<Linha[]>("/fila-equipe")).data,
  });
  const ligar = async (f: Linha) => {
    const msg = f.ativo
      ? `Desligar a IA da equipe de ${f.name}? Ela para de chamar os clientes da planilha dele até você ligar de novo.`
      : `Ligar a fila de ${f.name}? O K1 começa a chamar os ${f.faltam} cliente(s) da planilha dele pelo número central.`;
    if (!window.confirm(msg)) return;
    try {
      await api.put(`/fila-equipe/${f.gestorId}/ativo`, { ativo: !f.ativo });
      qc.invalidateQueries({ queryKey: ["fila-equipe"] });
    } catch (err) {
      alert(getApiErrorMessage(err, "Falha ao mudar a fila."));
    }
  };
  return { filas, ligar };
}

/** Quadro da IA (Diretor): liga/desliga a IA de cada gestor, com os números de cada um. */
export function IaPorGestor() {
  const { filas, ligar } = useFilasDoDiretor();
  return (
    <div className="rounded-2xl border p-4" style={card}>
      <div className="font-semibold text-sm flex items-center gap-2 mb-1" style={{ color: "var(--foreground)" }}>
        <Users size={16} /> IA por gestor
      </div>
      <p className="text-[11px] mb-2" style={{ color: "var(--muted-foreground)" }}>
        Cada gestor tem a IA chamando a planilha dele. Ligue ou desligue um por um.
      </p>
      <div className="space-y-1.5">
        {(filas ?? []).map((f) => (
          <div key={f.gestorId} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "var(--secondary)" }}>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>
                {f.name} <span style={{ color: "var(--muted-foreground)" }}>· {CARGO[f.role] ?? f.role}</span>
              </div>
              <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                faltam {f.faltam} · chamados {f.enviados} · <span style={{ color: "#22c55e" }}>sim {f.sim}</span>
              </div>
            </div>
            <button
              onClick={() => ligar(f)}
              className="text-[11px] px-2.5 py-1 rounded-lg font-semibold flex-shrink-0"
              style={f.ativo ? { background: "#ef444418", color: "#ef4444", border: "1px solid #ef444455" } : { background: "#22c55e", color: "white" }}
            >
              {f.ativo ? "⏸ Desligar" : "▶ Ligar"}
            </button>
          </div>
        ))}
        {(filas ?? []).length === 0 && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum gestor ativo.</p>
        )}
      </div>
    </div>
  );
}

function FilasDoDiretor() {
  const { filas, ligar } = useFilasDoDiretor();
  return (
    <div className="rounded-2xl border p-4 space-y-3" style={card}>
      <div className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
        <Users size={18} /> Filas das equipes (sem check-in · 9h às 22h)
      </div>
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Leads que cada gestor subiu na planilha. O K1 chama pelo número central, dentro das 25 mensagens por hora, e quem
        responde “sim” vai para os corretores da equipe. Só você liga e desliga.
      </p>
      {(filas ?? []).length === 0 ? (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum gestor ativo.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-left" style={{ color: "var(--muted-foreground)" }}>
                <th className="py-1.5 pr-2">Gestor</th>
                <th className="py-1.5 pr-2 text-right">Faltam chamar</th>
                <th className="py-1.5 pr-2 text-right">Chamados</th>
                <th className="py-1.5 pr-2 text-right">Sim</th>
                <th className="py-1.5 text-right">Fila</th>
              </tr>
            </thead>
            <tbody>
              {(filas ?? []).map((f) => (
                <tr key={f.gestorId} className="border-t" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                  <td className="py-1.5 pr-2">
                    {f.name} <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {CARGO[f.role] ?? f.role}</span>
                  </td>
                  <td className="py-1.5 pr-2 text-right">{f.faltam}</td>
                  <td className="py-1.5 pr-2 text-right">{f.enviados}</td>
                  <td className="py-1.5 pr-2 text-right" style={{ color: "#22c55e" }}>{f.sim}</td>
                  <td className="py-1.5 text-right">
                    <button
                      onClick={() => ligar(f)}
                      className="text-xs px-3 py-1 rounded-lg font-semibold"
                      style={{ background: f.ativo ? "#22c55e" : "var(--secondary)", color: f.ativo ? "#0a0a0a" : "var(--foreground)" }}
                    >
                      {f.ativo ? "Ligada" : "Desligada"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
