"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Moon, Sun, Search, AlertCircle, Clock, UserPlus, Menu, Volume2, VolumeX, MessageCircle, CalendarCheck } from "lucide-react";
import { somLigado, setSomLigado, tocarBip } from "@/hooks/use-new-lead-alert";
import { getStoredUser } from "@/lib/auth";
import { useTheme } from "@/hooks/use-theme";
import { useAlerts } from "@/hooks/use-alerts";
import { usePendingUsers } from "@/hooks/use-users";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const { data: alerts } = useAlerts();
  const { data: pending } = usePendingUsers();
  const [open, setOpen] = useState(false);
  const [som, setSom] = useState(true);
  // Só o Diretor liga/desliga o som — o time não pode se silenciar e perder lead.
  const isDiretor = (getStoredUser() as any)?.role === "diretor";

  // Lê a preferência salva (localStorage) só no cliente.
  useEffect(() => setSom(somLigado()), []);

  const alternarSom = () => {
    const novo = !som;
    setSom(novo);
    setSomLigado(novo);
    if (novo) tocarBip(); // toca uma amostra ao ligar
  };

  const semAtendimento = alerts?.semAtendimento ?? [];
  const semContato = alerts?.semContato ?? [];
  const responderam = alerts?.responderam ?? [];
  const visitasIA = alerts?.visitasIA ?? [];
  const pendentes = pending ?? [];
  // Totais verdadeiros (as listas vêm limitadas).
  const count =
    visitasIA.length +
    (alerts?.responderamTotal ?? responderam.length) +
    semAtendimento.length +
    (alerts?.semContatoTotal ?? semContato.length) +
    pendentes.length;

  const goToLead = () => {
    setOpen(false);
    router.push("/leads");
  };

  // Abre a conversa do lead no WhatsApp (deep-link já suportado pela página).
  const goToConversa = (leadId: string) => {
    setOpen(false);
    router.push(`/whatsapp?lead=${leadId}`);
  };

  const goToApprovals = () => {
    setOpen(false);
    router.push("/configuracoes?tab=usuarios");
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-6 border-b sticky top-0 z-20"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Abrir menu (só celular) */}
        <button
          onClick={() => window.dispatchEvent(new Event("kayser:toggle-menu"))}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 lg:hidden"
          style={{ background: "var(--secondary)", color: "var(--foreground)" }}
          title="Menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate" style={{ color: "var(--foreground)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new Event("kayser:open-search"))}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
          style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
        >
          <Search size={16} />
          <span>Buscar...</span>
          <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--border)" }}>⌘K</kbd>
        </button>

        {/* Notificações */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "var(--secondary)", color: "var(--foreground)" }}
          >
            <Bell size={18} />
            {count > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "var(--danger, #ef4444)", color: "white" }}
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div
                className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-lg z-40 overflow-hidden"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="p-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                    Notificações
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {count === 0 && (
                    <div className="p-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                      Tudo em dia! Nenhum alerta. 🎉
                    </div>
                  )}
                  {pendentes.map((u) => (
                    <AlertRow
                      key={`pend-${u.id}`}
                      icon={<UserPlus size={14} style={{ color: "#f59e0b" }} />}
                      name={u.name}
                      reason="Novo cadastro • aguardando aprovação"
                      onClick={goToApprovals}
                    />
                  ))}
                  {visitasIA.map((v) => (
                    <AlertRow
                      key={`vi-${v.id}`}
                      icon={<CalendarCheck size={14} style={{ color: "#3b82f6" }} />}
                      name={`📅 Visita: ${v.nome}`}
                      reason={`${dataVisita(v.scheduledAt)} · ${v.phone || "sem telefone"}${v.corretor ? ` · ${v.corretor.split(" ")[0]}` : " · aguardando plantão"}`}
                      onClick={() => goToConversa(v.leadId)}
                    />
                  ))}
                  {responderam.map((r) => (
                    <AlertRow
                      key={`rp-${r.leadId}`}
                      icon={<MessageCircle size={14} style={{ color: "#22c55e" }} />}
                      name={`${r.nome} respondeu`}
                      reason={`“${r.mensagem || "(mensagem)"}” · ${tempoDesde(r.at)}`}
                      onClick={() => goToConversa(r.leadId)}
                    />
                  ))}
                  {semAtendimento.map((lead) => (
                    <AlertRow
                      key={`sa-${lead.id}`}
                      icon={<AlertCircle size={14} style={{ color: "#ef4444" }} />}
                      name={lead.name}
                      reason="Sem atendimento"
                      onClick={goToLead}
                    />
                  ))}
                  {semContato.map((lead) => (
                    <AlertRow
                      key={`sc-${lead.id}`}
                      icon={<Clock size={14} style={{ color: "#f97316" }} />}
                      name={lead.name}
                      reason={`${diasDesde(lead.lastContactAt)} dias sem contato — chame o cliente`}
                      onClick={() => goToConversa(lead.id)}
                    />
                  ))}
                </div>
                {pendentes.length > 0 && (
                  <button
                    onClick={goToApprovals}
                    className="w-full p-3 text-sm font-medium border-t"
                    style={{ borderColor: "var(--border)", color: "var(--primary)" }}
                  >
                    Aprovar cadastros
                  </button>
                )}
                {visitasIA.length + responderam.length + semAtendimento.length + semContato.length > 0 && (
                  <button
                    onClick={goToLead}
                    className="w-full p-3 text-sm font-medium border-t"
                    style={{ borderColor: "var(--border)", color: "var(--primary)" }}
                  >
                    Ver leads
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Som de lead novo — só o Diretor controla */}
        {isDiretor && (
        <button
          onClick={alternarSom}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--secondary)", color: som ? "var(--primary)" : "var(--muted-foreground)" }}
          title={som ? "Som de lead novo: LIGADO (clique para desligar)" : "Som de lead novo: desligado (clique para ligar)"}
          aria-label="Alternar som de lead novo"
        >
          {som ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        )}

        {/* Tema */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--secondary)", color: "var(--foreground)" }}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}

/** "sáb., 28/09 às 10:00". */
function dataVisita(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

/** "há 5 min" / "há 2 h" / "há 3 dias". */
function tempoDesde(iso?: string | Date | null) {
  if (!iso) return "";
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} dia(s)`;
}

/** Dias inteiros desde a data (mínimo 3, que é o critério do alerta). */
function diasDesde(iso?: string | Date | null) {
  if (!iso) return 3;
  return Math.max(3, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function AlertRow({
  icon,
  name,
  reason,
  onClick,
}: {
  icon: React.ReactNode;
  name: string;
  reason: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 text-left border-b transition-colors hover:opacity-80"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--secondary)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{name}</div>
        <div className="text-xs line-clamp-2 break-words" style={{ color: "var(--muted-foreground)" }}>{reason}</div>
      </div>
    </button>
  );
}
