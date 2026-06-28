"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Users,
  Kanban,
  MessageSquare,
  Calendar,
  Bot,
  Target,
  BarChart3,
  Settings,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Lead } from "@/types";

const pages = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads / CRM", icon: Users },
  { href: "/kanban", label: "Kanban", icon: Kanban },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/ia", label: "IA Agente", icon: Bot },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Abre com Ctrl/Cmd+K (ou abre via evento global disparado pelo header).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("kayser:open-search", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("kayser:open-search", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(""); setLeads([]); }
  }, [open]);

  // Busca leads conforme digita (debounce simples).
  useEffect(() => {
    if (!open || query.trim().length < 2) { setLeads([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get<{ data: Lead[] }>("/leads", { params: { search: query, limit: 6 } });
        setLeads(data.data);
      } catch {
        setLeads([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  const matchedPages = pages.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()));

  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <Search size={18} style={{ color: "var(--muted-foreground)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar leads ou navegar..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--foreground)" }}
          />
          <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {leads.length > 0 && (
            <Section title="Leads">
              {leads.map((lead) => (
                <Row key={lead.id} onClick={() => go(`/leads?q=${encodeURIComponent(lead.phone || lead.name)}`)}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--primary)", color: "white" }}>
                    {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ color: "var(--foreground)" }}>{lead.name}</div>
                    <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{lead.phone}{lead.empreendimento ? ` • ${lead.empreendimento}` : ""}</div>
                  </div>
                </Row>
              ))}
            </Section>
          )}

          <Section title="Ir para">
            {matchedPages.map((p) => (
              <Row key={p.href} onClick={() => go(p.href)}>
                <p.icon size={16} style={{ color: "var(--muted-foreground)" }} />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>{p.label}</span>
              </Row>
            ))}
            {matchedPages.length === 0 && leads.length === 0 && (
              <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Nada encontrado.</div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:opacity-80">
      {children}
    </button>
  );
}
