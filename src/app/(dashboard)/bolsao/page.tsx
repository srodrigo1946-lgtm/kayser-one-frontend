"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Inbox } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

type BolsaoLead = { id: string; empreendimento: string; origem: string; campanha: string; desde: string | null; name?: string; phone?: string; responsavel?: string };
type Bolsao = { podePegar: boolean; horas: number; leads: BolsaoLead[] };

const tempo = (iso: string | null) => {
  if (!iso) return "";
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? "agora" : h < 24 ? `há ${h} h` : `há ${Math.floor(h / 24)} d`;
};

/** Bolsão: lead SWAT com o relógio da etapa zerado — só corretor pega (o 1º que clicar leva). */
export default function BolsaoPage() {
  const isDiretor = getStoredUser()?.role === "diretor";
  const router = useRouter();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [pegos, setPegos] = useState<string[]>([]);
  const { data, isLoading } = useQuery({
    queryKey: ["bolsao"],
    refetchInterval: 20_000,
    queryFn: async () => (await api.get<Bolsao>("/bolsao")).data,
  });
  const pegar = useMutation({
    mutationFn: async (id: string) => (await api.post<{ leadId: string }>(`/bolsao/pegar/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bolsao"] });
      qc.invalidateQueries({ queryKey: ["kanban"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
  const moverAgora = useMutation({
    mutationFn: async () => (await api.post<{ movidos: number }>("/bolsao/mover-agora")).data,
    onSuccess: (r) => {
      setMsg(`✅ ${r.movidos} lead(s) SWAT parados foram pro Bolsão agora.`);
      qc.invalidateQueries({ queryKey: ["bolsao"] });
    },
  });

  const leads = (data?.leads ?? []).filter((l) => !pegos.includes(l.id));

  const handlePegar = async (id: string) => {
    setMsg("");
    try {
      await pegar.mutateAsync(id);
      setPegos((p) => [...p, id]);
      setMsg("🎯 Lead é seu! Ele entrou em Primeiro Contato.");
      router.push(`/whatsapp?lead=${id}`);
    } catch (err) {
      setMsg(getApiErrorMessage(err, "Não deu pra pegar esse lead."));
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Inbox size={22} style={{ color: "var(--primary)" }} />
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Bolsão de leads</h1>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
        Lead da SWAT cai aqui sozinho quando o relógio da etapa zera: <b>Primeiro Contato 48h</b>, <b>Em Atendimento 72h</b>, <b>Agendamento 7 dias</b>, <b>Visita realizada 15 dias</b>, <b>Pasta 30 dias</b>. <b>Só corretores pegam</b>: o primeiro que clicar leva, e o lead entra em Primeiro Contato com você.
      </p>

      {isDiretor && (
        <button
          onClick={() => moverAgora.mutate()}
          disabled={moverAgora.isPending}
          className="mb-4 text-xs px-3 py-1.5 rounded-lg border disabled:opacity-60"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          title="Normalmente roda sozinho de hora em hora"
        >
          {moverAgora.isPending ? "…" : "⏱️ Conferir parados agora"}
        </button>
      )}
      {msg && <p className="text-sm mb-3" style={{ color: "var(--foreground)" }}>{msg}</p>}

      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : leads.length === 0 ? (
        <p className="text-sm py-10 text-center rounded-xl border" style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}>
          O Bolsão está vazio agora. Quando o relógio de um lead da SWAT zerar, ele aparece aqui.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((l) => (
            <div key={l.id} className="p-4 rounded-2xl border flex flex-col" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>{l.name || "Lead disponível"}</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {l.empreendimento ? `🏢 ${l.empreendimento}` : "Empreendimento não informado"}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                {[l.campanha || l.origem, `no Bolsão ${tempo(l.desde)}`].filter(Boolean).join(" · ")}
                {isDiretor && l.phone ? ` · ${l.phone}` : ""}
              </div>
              {data?.podePegar && (
                <button
                  onClick={() => handlePegar(l.id)}
                  disabled={pegar.isPending}
                  className="mt-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: "var(--primary)", color: "#0a0a0a" }}
                >
                  🎯 Pegar lead
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
