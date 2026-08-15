"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Plus, X } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { useUsers } from "@/hooks/use-users";
import { useEscala, useSetTurno, type EscalaTurno } from "@/hooks/use-escala";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function EscalaPage() {
  const isDiretor = getStoredUser()?.role === "diretor";
  const { data: grade } = useEscala();
  const { data: users } = useUsers();
  const setTurno = useSetTurno();
  const [abrindo, setAbrindo] = useState<string | null>(null); // id do turno com o seletor aberto

  const byId = new Map((users ?? []).map((u: any) => [u.id, u]));
  // Atendentes elegíveis: todos menos o Diretor (que não entra no rodízio).
  const elegiveis = (users ?? []).filter((u: any) => u.role !== "diretor" && u.approved !== false);

  const turnosDoDia = (dia: number): EscalaTurno[] =>
    (grade ?? []).filter((t) => t.diaSemana === dia).sort((a, b) => a.turno - b.turno);

  const add = (t: EscalaTurno, userId: string) => {
    if (t.atendenteIds.includes(userId)) return;
    setTurno.mutate({ id: t.id, atendenteIds: [...t.atendenteIds, userId] });
    setAbrindo(null);
  };
  const remove = (t: EscalaTurno, userId: string) =>
    setTurno.mutate({ id: t.id, atendenteIds: t.atendenteIds.filter((id) => id !== userId) });

  return (
    <div>
      <Header title="Escala de Atendimento" subtitle="Plantões que recebem os leads" />
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {DIAS.map((nome, dia) => (
            <div key={dia} className="flex flex-col gap-3">
              <div className="text-sm font-semibold text-center py-2 rounded-lg" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                {nome}
              </div>
              {turnosDoDia(dia).map((t) => (
                <div key={t.id} className="rounded-xl border p-3 flex flex-col gap-2" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    {t.horaInicio}–{t.horaFim}
                  </div>

                  <div className="flex flex-col gap-1">
                    {t.atendenteIds.length === 0 && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Sem plantão</span>
                    )}
                    {t.atendenteIds.map((id) => (
                      <div key={id} className="flex items-center justify-between gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                        <span className="truncate">{(byId.get(id) as any)?.name ?? "—"}</span>
                        {isDiretor && (
                          <button onClick={() => remove(t, id)} title="Remover" className="flex-shrink-0 opacity-70 hover:opacity-100">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isDiretor && (
                    abrindo === t.id ? (
                      <select
                        autoFocus
                        defaultValue=""
                        onChange={(e) => e.target.value && add(t, e.target.value)}
                        onBlur={() => setAbrindo(null)}
                        className="text-xs px-2 py-1.5 rounded-lg border outline-none"
                        style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                      >
                        <option value="">— escolher —</option>
                        {elegiveis
                          .filter((u: any) => !t.atendenteIds.includes(u.id))
                          .map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setAbrindo(t.id)}
                        className="flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border"
                        style={{ borderColor: "var(--border)", color: "var(--primary)" }}
                      >
                        <Plus size={13} /> Adicionar
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        {!isDiretor && (
          <p className="text-xs mt-4" style={{ color: "var(--muted-foreground)" }}>
            Só o Diretor edita a escala.
          </p>
        )}
      </div>
    </div>
  );
}
