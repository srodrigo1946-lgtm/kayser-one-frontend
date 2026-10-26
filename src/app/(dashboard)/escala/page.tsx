"use client";

import { Header } from "@/components/layout/header";
import { getStoredUser } from "@/lib/auth";
import { PainelPlantao } from "@/components/plantao/painel-plantao";
import { BloqueiosPlantao } from "@/components/plantao/bloqueios-plantao";
import { RankingCheckin } from "@/components/plantao/ranking-checkin";
import { useEscala, useSetHorario, type EscalaTurno } from "@/hooks/use-escala";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/**
 * Plantão por check-in (Rodrigo 25/10): a grade de nomes por turno saiu — entra no plantão
 * quem faz check-in no stand. Aqui ficam só os HORÁRIOS dos turnos (o Diretor edita).
 */
export default function EscalaPage() {
  const role = getStoredUser()?.role;
  const isDiretor = role === "diretor";
  const { data: grade } = useEscala();
  const setHorario = useSetHorario();

  const turnosDoDia = (dia: number): EscalaTurno[] =>
    (grade ?? []).filter((t) => t.diaSemana === dia).sort((a, b) => a.turno - b.turno);
  const hora = { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" };

  return (
    <div>
      <Header title="Escala de Atendimento" subtitle="Plantão por check-in no stand" />
      <div className="p-4 md:p-6">
        <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Horários dos turnos</div>
          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
            Entra no plantão quem fizer check-in no stand (até 500 m), de 1 hora antes até o início do turno.
            {isDiretor ? " Você pode mudar os horários aqui." : ""}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DIAS.map((nome, dia) => (
              <div key={dia} className="rounded-xl p-2" style={{ background: "var(--secondary)" }}>
                <div className="text-xs font-semibold text-center mb-1.5" style={{ color: "var(--foreground)" }}>{nome}</div>
                {turnosDoDia(dia).map((t) =>
                  isDiretor ? (
                    <div key={t.id} className="flex items-center gap-1 mb-1">
                      <input
                        type="time"
                        defaultValue={t.horaInicio}
                        onBlur={(e) => e.target.value && e.target.value !== t.horaInicio && setHorario.mutate({ id: t.id, horaInicio: e.target.value, horaFim: t.horaFim })}
                        className="px-1 py-0.5 rounded border text-xs outline-none w-full min-w-0"
                        style={hora}
                      />
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>–</span>
                      <input
                        type="time"
                        defaultValue={t.horaFim}
                        onBlur={(e) => e.target.value && e.target.value !== t.horaFim && setHorario.mutate({ id: t.id, horaInicio: t.horaInicio, horaFim: e.target.value })}
                        className="px-1 py-0.5 rounded border text-xs outline-none w-full min-w-0"
                        style={hora}
                      />
                    </div>
                  ) : (
                    <div key={t.id} className="text-xs text-center py-1 rounded-lg mb-1" style={{ background: "var(--card)", color: "var(--foreground)" }}>
                      {t.horaInicio}–{t.horaFim}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
        {isDiretor && <RankingCheckin />}
        {isDiretor && <PainelPlantao />}
        {role && role !== "corretor" && <BloqueiosPlantao />}
      </div>
    </div>
  );
}
