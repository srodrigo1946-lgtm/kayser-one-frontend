"use client";

import { Header } from "@/components/layout/header";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const events = [
  { day: 26, time: "09:00", title: "Visita — Ana Paula", type: "visita", color: "#3b82f6" },
  { day: 26, time: "14:00", title: "Visita — João Marcos", type: "visita", color: "#3b82f6" },
  { day: 27, time: "10:00", title: "Reunião equipe", type: "reuniao", color: "#8b5cf6" },
  { day: 28, time: "15:30", title: "Simulação — Roberto", type: "simulacao", color: "#f59e0b" },
  { day: 30, time: "09:00", title: "Visita — Fernanda Lima", type: "visita", color: "#3b82f6" },
];

export default function AgendaPage() {
  const [current, setCurrent] = useState(new Date(2025, 5, 1));
  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  return (
    <div>
      <Header title="Agenda" subtitle="Visitas, tarefas e compromissos" />
      <div className="p-6 grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              {months[month]} {year}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrent(new Date(year, month - 1, 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center border"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrent(new Date(year, month + 1, 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center border"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold py-2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const dayEvents = day ? events.filter((e) => e.day === day) : [];
              const isToday = day === 26;
              return (
                <div
                  key={i}
                  className="aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm cursor-pointer transition-colors"
                  style={{
                    background: isToday ? "var(--primary)" : day ? "transparent" : "transparent",
                    color: isToday ? "white" : day ? "var(--foreground)" : "transparent",
                  }}
                >
                  {day && (
                    <>
                      <span className="font-medium text-sm leading-none">{day}</span>
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((e, j) => (
                          <div
                            key={j}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isToday ? "white" : e.color }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
              Próximos eventos
            </h3>
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <Plus size={12} />
              Novo
            </button>
          </div>

          <div className="space-y-2">
            {events.map((evt, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div
                  className="w-1 h-10 rounded-full flex-shrink-0"
                  style={{ background: evt.color }}
                />
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {evt.title}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {`Junho ${evt.day}`} • {evt.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
