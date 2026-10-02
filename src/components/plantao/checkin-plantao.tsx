"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";
import { usePlantaoStatus, useCheckin, pegarLocalizacao } from "@/hooks/use-plantao";

/**
 * Check-in do plantão por GPS. Quem está na escala do turno ativo faz check-in
 * AUTOMÁTICO ao abrir o Kayser (se estiver a até 200 m de um stand). Sem check-in,
 * a fila não manda lead. Fica no topo das telas do sistema.
 */
export function CheckinPlantao() {
  const { data: st } = usePlantaoStatus(true);
  const checkin = useCheckin();
  const [msg, setMsg] = useState("");
  const [tentando, setTentando] = useState(false);
  const tentouAuto = useRef(false);

  const precisa = !!st?.regraAtiva && !!st?.turnoAtivo && !!st?.naEscala && !st?.checkin && st?.janela !== "fechada";

  const fazer = async (automatico = false) => {
    setTentando(true);
    if (!automatico) setMsg("");
    try {
      const loc = await pegarLocalizacao();
      const r = await checkin.mutateAsync(loc);
      setMsg(`✅ Check-in feito no ${r.stand} (${r.distancia} m). Você já está recebendo leads do plantão!`);
    } catch (err) {
      setMsg(err instanceof Error && !(err as any).response ? err.message : getApiErrorMessage(err, "Não consegui fazer o check-in."));
    } finally {
      setTentando(false);
    }
  };

  // Automático: na primeira vez que o sistema vê que ele precisa de check-in.
  useEffect(() => {
    if (precisa && !tentouAuto.current) {
      tentouAuto.current = true;
      fazer(true);
    }
    if (!precisa) tentouAuto.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precisa]);

  if (!st?.regraAtiva || !st.turnoAtivo || !st.naEscala) return null;

  if (st.checkin) {
    return (
      <div className="mx-4 lg:mx-6 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2" style={{ background: "#22c55e1a", color: "#16a34a", border: "1px solid #22c55e44" }}>
        <CheckCircle2 size={15} /> Plantão {st.turno?.horaInicio}–{st.turno?.horaFim}: check-in no <b>{st.checkin.stand}</b> — você está recebendo leads.
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
