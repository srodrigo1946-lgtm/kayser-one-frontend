"use client";

import { Header } from "@/components/layout/header";
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Download } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import {
  useAppointments,
  useCreateAppointment,
  useDeleteAppointment,
  googleCalendarUrl,
  outlookCalendarUrl,
  downloadIcs,
  type Appointment,
} from "@/hooks/use-appointments";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const roleLabels: Record<string, string> = {
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
  diretor: "Diretor",
};

type LinhaRanking = { id: string; nome: string; role: string; agendamentos: number; visitas: number };

const typeColors: Record<string, string> = {
  visita: "#3b82f6",
  reuniao: "#8b5cf6",
  tarefa: "#10b981",
  lembrete: "#f59e0b",
};

export default function AgendaPage() {
  const [current, setCurrent] = useState(() => new Date());
  const year = current.getFullYear();
  const month = current.getMonth();

  // Busca o ANO inteiro: o calendário usa o mês, e o resumo/gráfico usa o ano.
  const from = new Date(year, 0, 1).toISOString();
  const to = new Date(year, 11, 31, 23, 59, 59).toISOString();
  const { data: appointments } = useAppointments(from, to);
  const create = useCreateAppointment();
  const remove = useDeleteAppointment();
  const [diaSel, setDiaSel] = useState<number | null>(null);
  // Ranking igual ao Kanban (colunas Agendamento e Visita realizada); cada cargo vê o seu time.
  const { data: ranking } = useQuery({
    queryKey: ["appointments", "ranking"],
    queryFn: async () => (await api.get<LinhaRanking[]>("/appointments/ranking")).data,
  });
  const totAg = (ranking ?? []).reduce((s, r) => s + r.agendamentos, 0);
  const totVis = (ranking ?? []).reduce((s, r) => s + r.visitas, 0);

  const doAno = appointments ?? [];
  const porMes = months.map((_, m) => doAno.filter((e) => new Date(e.scheduledAt).getMonth() === m).length);
  const maxMes = Math.max(1, ...porMes);
  const events = doAno.filter((e) => new Date(e.scheduledAt).getMonth() === month);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => (i < firstDay ? null : i - firstDay + 1));
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const eventsForDay = (day: number) =>
    events.filter((e) => new Date(e.scheduledAt).getDate() === day);
  const hoje = today.getFullYear() === year ? doAno.filter((e) => new Date(e.scheduledAt).toDateString() === today.toDateString()).length : 0;
  const lista = diaSel ? eventsForDay(diaSel) : events;
  const hora = (s: string) => new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const irPara = (d: Date) => {
    setCurrent(d);
    setDiaSel(null);
  };

  const novo = async () => {
    const title = window.prompt("Título do compromisso:");
    if (!title) return;
    const dateStr = window.prompt("Data e hora (AAAA-MM-DD HH:MM):", new Date().toISOString().slice(0, 16).replace("T", " "));
    if (!dateStr) return;
    const scheduledAt = new Date(dateStr.replace(" ", "T"));
    if (isNaN(scheduledAt.getTime())) {
      alert("Data inválida.");
      return;
    }
    const type = (window.prompt("Tipo (visita, reuniao, tarefa, lembrete):", "visita") || "visita") as any;
    try {
      await create.mutateAsync({ title, scheduledAt: scheduledAt.toISOString(), type });
    } catch (err) {
      alert(getApiErrorMessage(err, "Falha ao criar compromisso."));
    }
  };

  return (
    <div>
      <Header title="Agenda" subtitle="Visitas, tarefas e compromissos" />
      <div className="p-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{months[month]} {year}</h2>
            <div className="flex gap-2">
              <button onClick={() => irPara(new Date(year, month - 1, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}><ChevronLeft size={16} /></button>
              <button onClick={() => irPara(new Date(year, month + 1, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((d) => (
              <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: "var(--muted-foreground)" }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const dayEvents = day ? eventsForDay(day) : [];
              const isToday = isCurrentMonth && day === today.getDate();
              const sel = day !== null && day === diaSel;
              const coluna = i % 7;
              return (
                <div
                  key={i}
                  onClick={() => day && setDiaSel(sel ? null : day)}
                  className={`group relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm ${day ? "cursor-pointer hover:ring-1" : ""}`}
                  style={{
                    background: isToday ? "var(--primary)" : "transparent",
                    color: isToday ? "white" : day ? "var(--foreground)" : "transparent",
                    outline: sel ? "2px solid var(--primary)" : undefined,
                  }}
                >
                  {day && (
                    <>
                      <span className="font-medium text-sm leading-none">{day}</span>
                      {dayEvents.length > 0 && (
                        <>
                          <span
                            className="mt-1 min-w-[20px] px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none text-center"
                            style={{ background: isToday ? "white" : typeColors[dayEvents[0].type] || "#3b82f6", color: isToday ? "#0a0a0a" : "white" }}
                          >
                            {dayEvents.length}
                          </span>
                          {/* Passar o mouse: lista do dia */}
                          <div
                            className={`hidden group-hover:block absolute z-20 top-full mt-1 w-60 p-2 rounded-xl border shadow-xl text-left ${coluna > 3 ? "right-0" : "left-0"}`}
                            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                          >
                            <div className="text-xs font-semibold mb-1">
                              {day}/{month + 1} — {dayEvents.length} agendamento{dayEvents.length > 1 ? "s" : ""}
                            </div>
                            {dayEvents.slice(0, 8).map((e) => (
                              <div key={e.id} className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                                <b style={{ color: typeColors[e.type] || "#3b82f6" }}>{hora(e.scheduledAt)}</b> {e.lead?.name || e.title}
                              </div>
                            ))}
                            {dayEvents.length > 8 && <div className="text-xs mt-1">+{dayEvents.length - 8} — clique no dia pra ver todos</div>}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ranking por cargo — mesmos números das colunas do Kanban */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>🏆 Ranking — agendamentos e visitas realizadas</h3>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Kanban agora: 📅 {totAg} agendamentos · ✅ {totVis} visitas realizadas
              </span>
            </div>
            {(ranking ?? []).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Ninguém com lead em Agendamento ou Visita realizada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-left" style={{ color: "var(--muted-foreground)" }}>
                      <th className="py-1.5 pr-2">#</th>
                      <th className="py-1.5 pr-2">Nome</th>
                      <th className="py-1.5 pr-2">Cargo</th>
                      <th className="py-1.5 pr-2 text-right">📅 Agendamentos</th>
                      <th className="py-1.5 text-right">✅ Visitas realizadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ranking ?? []).map((r, i) => (
                      <tr key={r.id} className="border-t" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                        <td className="py-1.5 pr-2 font-semibold">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`}</td>
                        <td className="py-1.5 pr-2">{r.nome}</td>
                        <td className="py-1.5 pr-2 text-xs" style={{ color: "var(--muted-foreground)" }}>{roleLabels[r.role] ?? r.role}</td>
                        <td className="py-1.5 pr-2 text-right font-semibold">{r.agendamentos}</td>
                        <td className="py-1.5 text-right font-semibold" style={{ color: "#22c55e" }}>{r.visitas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Resumo: hoje / mês / ano + gráfico por mês */}
          <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              {[
                ["Hoje", hoje],
                [months[month], events.length],
                [`Ano ${year}`, doAno.length],
              ].map(([rotulo, n]) => (
                <div key={rotulo as string} className="rounded-xl py-2" style={{ background: "var(--secondary)" }}>
                  <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{n}</div>
                  <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{rotulo}</div>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-1 h-28">
              {porMes.map((n, m) => (
                <button
                  key={m}
                  onClick={() => irPara(new Date(year, m, 1))}
                  title={`${months[m]}: ${n} agendamento(s)`}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1"
                >
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{n || ""}</span>
                  <div
                    className="w-full rounded-t-md"
                    style={{ height: `${(n / maxMes) * 100}%`, minHeight: n ? 4 : 1, background: m === month ? "var(--primary)" : "#3b82f6aa" }}
                  />
                  <span className="text-[10px]" style={{ color: m === month ? "var(--foreground)" : "var(--muted-foreground)" }}>{months[m].slice(0, 3)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
              {diaSel ? `Compromissos de ${diaSel}/${month + 1} (${lista.length})` : `Compromissos do mês (${events.length})`}
            </h3>
            <div className="flex gap-2">
              {diaSel && (
                <button onClick={() => setDiaSel(null)} className="px-3 py-1.5 rounded-xl text-xs border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                  Ver o mês
                </button>
              )}
              <button onClick={novo} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: "var(--primary)", color: "white" }}>
                <Plus size={12} /> Novo
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {lista.map((evt) => (
              <div key={evt.id} className="p-3 rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: typeColors[evt.type] || "#3b82f6" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{evt.title}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(evt.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {evt.lead?.name ? ` • ${evt.lead.name}` : ""}
                    </div>
                  </div>
                  <button onClick={() => remove.mutate(evt.id)} style={{ color: "#ef4444" }} title="Remover"><Trash2 size={14} /></button>
                </div>
                <CalendarActions appointment={evt} />
              </div>
            ))}
            {lista.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--muted-foreground)" }}>
                {diaSel ? "Nenhum compromisso neste dia." : "Nenhum compromisso neste mês."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarActions({ appointment }: { appointment: Appointment }) {
  const linkStyle = {
    color: "var(--muted-foreground)",
    borderColor: "var(--border)",
  } as React.CSSProperties;
  return (
    <div className="flex items-center gap-2 mt-2 pl-4">
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        <CalendarIcon size={11} className="inline mr-1" />Adicionar:
      </span>
      <a
        href={googleCalendarUrl(appointment)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-2 py-0.5 rounded-lg border"
        style={linkStyle}
      >
        Google
      </a>
      <a
        href={outlookCalendarUrl(appointment)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs px-2 py-0.5 rounded-lg border"
        style={linkStyle}
      >
        Outlook
      </a>
      <button
        onClick={() => downloadIcs(appointment.id)}
        className="text-xs px-2 py-0.5 rounded-lg border inline-flex items-center gap-1"
        style={linkStyle}
      >
        <Download size={11} /> .ics
      </button>
    </div>
  );
}
