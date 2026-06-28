"use client";

import { Header } from "@/components/layout/header";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api";
import {
  useAppointments,
  useCreateAppointment,
  useDeleteAppointment,
} from "@/hooks/use-appointments";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

  const from = new Date(year, month, 1).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const { data: appointments } = useAppointments(from, to);
  const create = useCreateAppointment();
  const remove = useDeleteAppointment();

  const events = appointments ?? [];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => (i < firstDay ? null : i - firstDay + 1));
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const eventsForDay = (day: number) =>
    events.filter((e) => new Date(e.scheduledAt).getDate() === day);

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
              <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}><ChevronRight size={16} /></button>
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
              return (
                <div key={i} className="aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm" style={{ background: isToday ? "var(--primary)" : "transparent", color: isToday ? "white" : day ? "var(--foreground)" : "transparent" }}>
                  {day && (
                    <>
                      <span className="font-medium text-sm leading-none">{day}</span>
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((e, j) => (
                          <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: isToday ? "white" : typeColors[e.type] || "#3b82f6" }} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Compromissos do mês</h3>
            <button onClick={novo} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: "var(--primary)", color: "white" }}>
              <Plus size={12} /> Novo
            </button>
          </div>

          <div className="space-y-2">
            {events.map((evt) => (
              <div key={evt.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
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
            ))}
            {events.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "var(--muted-foreground)" }}>Nenhum compromisso neste mês.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
