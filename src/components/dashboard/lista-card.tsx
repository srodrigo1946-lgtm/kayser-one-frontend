"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle } from "lucide-react";
import { useCardLista, type CardListaItem } from "@/hooks/use-dashboard";

const STATUS: Record<string, string> = {
  novo_lead: "Novo lead",
  primeiro_contato: "Primeiro contato",
  em_atendimento: "Em atendimento",
  agendamento: "Agendamento",
  visita_realizada: "Visita realizada",
  documentacao: "Documentação",
  subida_pasta: "Subida de pasta",
  aprovacao: "Aprovação",
  reprovacao: "Reprovação",
  venda_ganha: "Venda ganha",
  venda_perdida: "Sem interesse",
};

function dataCurta(iso: string | null) {
  if (!iso) return "nunca";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function tempoDesde(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 1440)} d`;
}

/**
 * Gaveta lateral que abre ao clicar num card do painel: mostra os leads que o
 * número conta. Clicar no lead abre a conversa dele.
 */
export function ListaCard({
  tipo,
  titulo,
  year,
  month,
  fonte,
  onFechar,
  onAbrirLead,
}: {
  tipo: string;
  titulo: string;
  year: number;
  month?: number;
  // Lista já buscada por fora (1-on-1); sem ela, busca pelo tipo do card do painel.
  fonte?: { data?: { total: number; items: CardListaItem[] }; isLoading: boolean; isError: boolean };
  onFechar: () => void;
  onAbrirLead: (l: { leadId: string; phone: string }) => void;
}) {
  const proprio = useCardLista(fonte ? null : tipo, year, month);
  const { data, isLoading, isError } = fonte ?? proprio;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const itens = data?.items ?? [];
  const mostraContato = tipo === "semContato";

  // Portal no <body>: o layout tem blur/transform nos pais, que prendem o "fixed" dentro deles.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={titulo}>
      <button aria-label="Fechar" className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div
        className="relative w-full max-w-md h-full flex flex-col border-l"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>{titulo}</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {isLoading
                ? "Carregando…"
                : `${data?.total ?? 0} lead(s)${(data?.total ?? 0) > itens.length ? ` · mostrando ${itens.length}` : ""} · clique para abrir a conversa`}
            </p>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="p-1 rounded-lg" style={{ color: "var(--muted-foreground)" }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isError && (
            <div className="py-8 text-center text-sm" style={{ color: "var(--danger)" }}>
              Não consegui carregar a lista. Feche e abra de novo.
            </div>
          )}
          {!isLoading && !isError && itens.length === 0 && (
            <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Nenhum lead aqui.
            </div>
          )}
          {itens.map((l) => (
            <button
              key={l.id}
              onClick={() => onAbrirLead({ leadId: l.id, phone: l.phone })}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:opacity-90"
              style={{ background: "var(--secondary)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                  {l.nome || "Lead sem nome"}
                </div>
                <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                  {STATUS[l.status] ?? l.status} · {l.responsavel ?? "sem responsável"}
                </div>
                {l.ultimaMsg && (
                  <div className="text-xs truncate mt-0.5" style={{ color: l.ultimaDirecao === "in" ? "#facc15" : "var(--muted-foreground)" }}>
                    {l.ultimaDirecao === "in" ? "Cliente: " : "Equipe: "}
                    {l.ultimaMsg}
                  </div>
                )}
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: l.ultimaDirecao === "in" && tipo === "esperando" ? "#f87171" : "var(--muted-foreground)" }}>
                {tipo === "esperando" && l.ultimaEm
                  ? `esperando ${tempoDesde(l.ultimaEm)}`
                  : l.ultimaEm
                    ? dataCurta(l.ultimaEm)
                    : mostraContato
                      ? `contato ${dataCurta(l.lastContactAt)}`
                      : dataCurta(l.createdAt)}
              </span>
              <MessageCircle size={16} style={{ color: "#25d366" }} />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
