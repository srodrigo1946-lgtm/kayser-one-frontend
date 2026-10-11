"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { usePlantaoStatus, useCheckin, pegarLocalizacao } from "@/hooks/use-plantao";

const hora = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/**
 * Check-in do plantão por GPS. Quem está na escala do turno ativo faz check-in
 * AUTOMÁTICO ao abrir o Kayser (se estiver a até 500 m de um stand). Sem check-in,
 * a fila não manda lead. Fica no topo das telas do sistema.
 */
export function CheckinPlantao() {
  const { data: st } = usePlantaoStatus(true);
  const checkin = useCheckin();
  const [msg, setMsg] = useState("");
  const [tentando, setTentando] = useState(false);
  const tentouAuto = useRef(false);

  const precisa = !!st?.regraAtiva && !!st?.turnoAtivo && !!st?.naEscala && !st?.checkin && st?.janela !== "fechada" && !st?.bloqueado;

  const fazer = async (automatico = false) => {
    setTentando(true);
    if (!automatico) setMsg("");
    try {
      const loc = await pegarLocalizacao();
      const r = await checkin.mutateAsync(loc);
      setMsg(`✅ Check-in feito no ${r.stand} (${r.distancia} m). Você já está recebendo leads do plantão!`);
    } catch (err) {
      const local = err instanceof Error && !(err as any).response;
      setMsg(local ? err.message : getApiErrorMessage(err, "Não consegui fazer o check-in."));
      // Falha do lado do celular (GPS negado/desligado) não chega no servidor sozinha — avisa o painel do Diretor.
      if (local) api.post("/plantao/tentativa", { motivo: (err as Error).message }).catch(() => {});
    } finally {
      setTentando(false);
    }
  };

  // Depois do check-in (menos no plantão das 21h): manda a posição a cada 2 min com o app
  // aberto. Mais de 500 m do stand em 2 leituras seguidas → sai do plantão.
  const qc = useQueryClient();
  const [longe, setLonge] = useState<number | null>(null);
  const acompanhar = !!st?.checkin?.acompanhar;
  useEffect(() => {
    if (!acompanhar) {
      setLonge(null);
      return;
    }
    const enviar = async () => {
      try {
        const loc = await pegarLocalizacao();
        const { data } = await api.post<{ status: string; distancia?: number }>("/plantao/posicao", loc);
        if (data.status === "aviso") setLonge(data.distancia ?? null);
        else if (data.status === "ok") setLonge(null);
        else if (data.status === "saiu") qc.invalidateQueries({ queryKey: ["plantao"] });
      } catch {
        // GPS desligado/negado ou sem internet: tenta de novo na próxima.
      }
    };
    const t = setInterval(enviar, 120_000);
    return () => clearInterval(t);
  }, [acompanhar, qc]);

  // Automático: na primeira vez que o sistema vê que ele precisa de check-in.
  useEffect(() => {
    if (precisa && !tentouAuto.current) {
      tentouAuto.current = true;
      fazer(true);
    }
    if (!precisa) tentouAuto.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precisa]);

  if (st?.turnoAtivo && st.bloqueado) {
    return (
      <div className="mx-4 lg:mx-6 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2" style={{ background: "#ef44441a", color: "#ef4444", border: "1px solid #ef444455" }}>
        <MapPin size={15} /> Você está <b>bloqueado no plantão</b> (por {st.bloqueado.por}). Fale com seu gestor.
      </div>
    );
  }

  if (!st?.regraAtiva || !st.turnoAtivo || !st.naEscala) return null;

  if (st.checkin?.saiu) {
    return (
      <div className="mx-4 lg:mx-6 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2" style={{ background: "#ef44441a", color: "#ef4444", border: "1px solid #ef444455" }}>
        <MapPin size={15} /> Você se afastou do stand às <b>{hora(st.checkin.saiu.hora)}</b>
        {st.checkin.saiu.distancia != null && <> ({st.checkin.saiu.distancia} m)</>} e <b>saiu do plantão</b> {st.turno?.horaInicio}–{st.turno?.horaFim}. Fale com seu gestor pra voltar.
      </div>
    );
  }

  if (st.checkin && longe != null) {
    return (
      <div className="mx-4 lg:mx-6 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2" style={{ background: "#f59e0b1a", color: "#d97706", border: "1px solid #f59e0b66" }}>
        <MapPin size={15} /> Você está a <b>{longe} m</b> do stand. Volte pra até 500 m ou vai <b>sair do plantão</b> em 2 minutos.
      </div>
    );
  }

  if (st.checkin) {
    return (
      <div className="mx-4 lg:mx-6 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2" style={{ background: "#22c55e1a", color: "#16a34a", border: "1px solid #22c55e44" }}>
        <CheckCircle2 size={15} /> Plantão {st.turno?.horaInicio}–{st.turno?.horaFim}: {st.checkin.stand?.startsWith("Liberado") ? <b>{st.checkin.stand}</b> : <>check-in no <b>{st.checkin.stand}</b></>} — você está no plantão.
      </div>
    );
  }

  if (st.janela === "fechada") {
    return (
      <div className="mx-4 lg:mx-6 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2" style={{ background: "#ef44441a", color: "#ef4444", border: "1px solid #ef444455" }}>
        <MapPin size={15} /> Check-in encerrado: era até as <b>{st.turno?.horaInicio}</b>. Você não entra no plantão {st.turno?.horaInicio}–{st.turno?.horaFim}.
      </div>
    );
  }

  return (
    <div className="mx-4 lg:mx-6 mt-3 p-3 rounded-xl flex items-center gap-3 flex-wrap" style={{ background: "#f59e0b1a", border: "1px solid #f59e0b66" }}>
      <MapPin size={20} style={{ color: "#f59e0b" }} />
      <div className="flex-1 min-w-[200px] text-sm" style={{ color: "var(--foreground)" }}>
        <b>Plantão {st.turno?.horaInicio}–{st.turno?.horaFim}:</b> faça o check-in no stand até as <b>{st.turno?.horaInicio}</b> pra entrar no plantão.
        {msg && <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{msg}</div>}
      </div>
      <button
        onClick={() => fazer(false)}
        disabled={tentando}
        className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
        style={{ background: "#f59e0b", color: "#0a0a0a" }}
      >
        {tentando ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
        {tentando ? "Pegando localização…" : "📍 Fazer check-in"}
      </button>
    </div>
  );
}
