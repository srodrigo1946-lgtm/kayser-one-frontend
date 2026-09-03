"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { Users, User as UserIcon, Trash2, MessageSquarePlus } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api";
import { useUsers } from "@/hooks/use-users";
import { useBreakdown, useFunil } from "@/hooks/use-dashboard";
import { useKanbanBoard } from "@/hooks/use-kanban";
import { useFeedback, useAddNote, useDeleteNote } from "@/hooks/use-feedback";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const ROLE_LABEL: Record<string, string> = { superintendente: "Superintendente", gerente_geral: "Gerente Geral", gerente: "Gerente", corretor: "Corretor", diretor: "Diretor" };
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Descendentes (recursivo) de um gestor a partir da árvore managerId.
function descendentes(users: any[], rootId: string): string[] {
  const filhos = new Map<string, string[]>();
  for (const u of users) {
    if (!u.managerId) continue;
    (filhos.get(u.managerId) ?? filhos.set(u.managerId, []).get(u.managerId)!).push(u.id);
  }
  const res: string[] = [];
  const pilha = [...(filhos.get(rootId) ?? [])];
  while (pilha.length) {
    const cur = pilha.pop()!;
    res.push(cur);
    for (const f of filhos.get(cur) ?? []) pilha.push(f);
  }
  return res;
}

export default function FeedbackPage() {
  const me = getStoredUser();
  const podeUsar = (me as any)?.role && (me as any).role !== "corretor";
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [modo, setModo] = useState<"user" | "time">("user");
  const [alvoId, setAlvoId] = useState<string>("");

  const { data: users = [] } = useUsers();
  const { data: breakdown = [] } = useBreakdown(year, month || undefined);

  // Individual: todo mundo do escopo (menos empresa parceira). Time: só gestores.
  const pessoas = users.filter((u: any) => u.role !== "diretor" && !u.empresaId);
  const gestores = users.filter((u: any) => ["superintendente", "gerente_geral", "gerente"].includes(u.role) && !u.empresaId);
  const opcoes = modo === "user" ? pessoas : gestores;

  const bkById = useMemo(() => new Map(breakdown.map((b: any) => [b.responsavelId, b])), [breakdown]);

  // Números do alvo: pessoa = a linha dela; time = soma dos descendentes.
  const membrosTime = modo === "time" && alvoId ? descendentes(users, alvoId) : [];
  const nums = (() => {
    if (!alvoId) return null;
    if (modo === "user") {
      const b: any = bkById.get(alvoId) ?? { leads: 0, vendas: 0, vgv: 0 };
      return { leads: b.leads, vendas: b.vendas, vgv: b.vgv };
    }
    const rows = membrosTime.map((id) => bkById.get(id)).filter(Boolean) as any[];
    return {
      leads: rows.reduce((a, r) => a + r.leads, 0),
      vendas: rows.reduce((a, r) => a + r.vendas, 0),
      vgv: rows.reduce((a, r) => a + r.vgv, 0),
    };
  })();
  const conversao = nums && nums.leads > 0 ? (nums.vendas / nums.leads) * 100 : 0;

  // Funil por etapa (usa as colunas reais do Kanban pros nomes/ordem/cores).
  const alvoIds = modo === "user" ? (alvoId ? [alvoId] : []) : membrosTime;
  const { data: funil = [] } = useFunil(alvoIds, year, month || undefined);
  const { data: colunas = [] } = useKanbanBoard();
  const countByStatus = new Map(funil.map((f: any) => [f.status, f.count]));
  const totalFunil = funil.reduce((a: number, f: any) => a + f.count, 0);
  const etapas = (colunas ?? []).map((c: any) => ({
    key: c.id, // = status do lead
    label: c.title,
    emoji: c.emoji,
    color: c.color,
    count: countByStatus.get(c.id) ?? 0,
  }));

  const { data: notas = [] } = useFeedback(modo, alvoId || null);
  const addNote = useAddNote();
  const delNote = useDeleteNote();
  const [texto, setTexto] = useState("");
  const [feedback, setFeedback] = useState("");

  const salvar = async () => {
    if (!alvoId || !texto.trim()) return;
    setFeedback("");
    try {
      await addNote.mutateAsync({ alvoTipo: modo, alvoId, texto: texto.trim() });
      setTexto("");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Falha ao salvar a anotação."));
    }
  };

  const quando = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (!podeUsar) {
    return (
      <div>
        <Header title="1-on-1 / Feedback" subtitle="Reunião de acompanhamento" />
        <div className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Disponível para gestores.</div>
      </div>
    );
  }

  const Metric = ({ titulo, valor, cor }: any) => (
    <div className="rounded-xl border p-4" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
      <div className="text-2xl font-bold" style={{ color: cor ?? "var(--foreground)" }}>{valor}</div>
      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{titulo}</div>
    </div>
  );

  return (
    <div>
      <Header title="1-on-1 / Feedback" subtitle="Acompanhamento individual e de time" />
      <div className="p-6 space-y-6">
        {/* Controles */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            {(["user", "time"] as const).map((m) => (
              <button key={m} onClick={() => { setModo(m); setAlvoId(""); }} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
                style={{ background: modo === m ? "var(--primary)" : "transparent", color: modo === m ? "white" : "var(--muted-foreground)" }}>
                {m === "user" ? <UserIcon size={14} /> : <Users size={14} />} {m === "user" ? "Individual" : "Time"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select value={alvoId} onChange={(e) => setAlvoId(e.target.value)} className="text-sm px-3 py-1.5 rounded-lg border outline-none min-w-[200px]" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
              <option value="">{modo === "user" ? "Escolha a pessoa..." : "Escolha o gestor (time)..."}</option>
              {opcoes.map((u: any) => <option key={u.id} value={u.id}>{u.name} — {ROLE_LABEL[u.role] ?? u.role}</option>)}
            </select>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="text-sm px-3 py-1.5 rounded-lg border outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
              <option value={0}>Ano todo</option>
              {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-sm px-3 py-1.5 rounded-lg border outline-none" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
              {Array.from({ length: 3 }, (_, i) => currentYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {!alvoId ? (
          <div className="rounded-2xl border p-10 text-center text-sm" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            Escolha {modo === "user" ? "uma pessoa" : "um time"} acima para ver os números e as anotações.
          </div>
        ) : (
          <>
            {/* Números */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Metric titulo={modo === "time" ? "Leads do time" : "Leads recebidos"} valor={nums?.leads ?? 0} cor="#3b82f6" />
              <Metric titulo="Vendas" valor={nums?.vendas ?? 0} cor="#10b981" />
              <Metric titulo="Conversão" valor={`${conversao.toFixed(0)}%`} cor="#8b5cf6" />
              <Metric titulo="VGV" valor={brl(nums?.vgv ?? 0)} cor="#22c55e" />
            </div>

            {/* Funil por etapa (com %) */}
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Funil por etapa</div>
              <div className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Onde estão os {totalFunil} leads do período · % sobre o total</div>
              <div className="space-y-2.5">
                {etapas.map((e: any) => {
                  const pct = totalFunil > 0 ? (e.count / totalFunil) * 100 : 0;
                  return (
                    <div key={e.key} className="flex items-center gap-3">
                      <div className="w-40 text-sm flex items-center gap-1.5 flex-shrink-0" style={{ color: "var(--foreground)" }}>
                        <span>{e.emoji}</span><span className="truncate">{e.label}</span>
                      </div>
                      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: e.color }} />
                      </div>
                      <div className="w-24 text-right text-sm tabular-nums flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                        {e.count} · {pct.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
                {etapas.length === 0 && <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Sem etapas configuradas no Kanban.</div>}
              </div>
            </div>

            {/* Membros do time */}
            {modo === "time" && (
              <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>Membros do time</div>
                <div className="space-y-2">
                  {membrosTime.map((id) => {
                    const u: any = users.find((x: any) => x.id === id);
                    const b: any = bkById.get(id) ?? { leads: 0, vendas: 0 };
                    const cv = b.leads > 0 ? (b.vendas / b.leads) * 100 : 0;
                    return (
                      <div key={id} className="flex items-center justify-between text-sm py-1.5 border-b" style={{ borderColor: "var(--border)" }}>
                        <span style={{ color: "var(--foreground)" }}>{u?.name ?? "—"} <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {ROLE_LABEL[u?.role] ?? u?.role}</span></span>
                        <span className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>{b.leads} leads · {b.vendas} vendas · {cv.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                  {membrosTime.length === 0 && <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Este gestor não tem equipe cadastrada abaixo.</div>}
                </div>
              </div>
            )}

            {/* Anotações da reunião */}
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Anotações da reunião</div>
              <div className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>O que foi combinado — fica registrado com data pra acompanhar a evolução.</div>
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} placeholder="Escreva o feedback / o que foi alinhado nesta reunião..." className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-y" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }} />
              <div className="flex items-center gap-3 mt-2">
                <button onClick={salvar} disabled={addNote.isPending || !texto.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: "var(--primary)", color: "white" }}>
                  <MessageSquarePlus size={15} /> {addNote.isPending ? "Salvando…" : "Registrar anotação"}
                </button>
                {feedback && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{feedback}</span>}
              </div>

              <div className="mt-5 space-y-3">
                {notas.map((n) => (
                  <div key={n.id} className="rounded-xl p-3" style={{ background: "var(--secondary)" }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{quando(n.createdAt)} · {n.autorNome}</span>
                      <button onClick={() => { if (window.confirm("Apagar esta anotação?")) delNote.mutate(n.id); }} title="Apagar" className="opacity-60 hover:opacity-100" style={{ color: "#ef4444" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{n.texto}</div>
                  </div>
                ))}
                {notas.length === 0 && <div className="text-sm py-2" style={{ color: "var(--muted-foreground)" }}>Nenhuma anotação ainda. Registre a primeira acima.</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
