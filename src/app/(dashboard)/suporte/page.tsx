"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Mail, Trash2, Check, AlertTriangle, LifeBuoy } from "lucide-react";
import { useSupportMessages, useMarkSupportRead, useDeleteSupport } from "@/hooks/use-support";
import { getStoredUser } from "@/lib/auth";

const fmt = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function SuportePage() {
  const router = useRouter();
  const user = getStoredUser() as any;
  useEffect(() => {
    if (user && user.role !== "diretor") router.replace("/dashboard");
  }, [router, user]);

  const { data: msgs = [], isLoading } = useSupportMessages();
  const markRead = useMarkSupportRead();
  const del = useDeleteSupport();

  return (
    <div>
      <Header title="Suporte" subtitle="Mensagens de suporte e reclamações enviadas pela tela de login" />
      <div className="p-6">
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {isLoading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando…</div>
          ) : msgs.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              <LifeBuoy size={28} className="mx-auto mb-2 opacity-60" />
              Nenhuma mensagem ainda.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {msgs.map((m) => {
                const recl = m.type === "reclamacao";
                return (
                  <div key={m.id} className="p-4 flex gap-3" style={{ background: m.read ? "transparent" : "var(--secondary)" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: recl ? "#f59e0b22" : "var(--primary)22" }}>
                      {recl ? <AlertTriangle size={16} style={{ color: "#f59e0b" }} /> : <LifeBuoy size={16} style={{ color: "var(--primary)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: recl ? "#f59e0b22" : "var(--primary)22", color: recl ? "#f59e0b" : "var(--primary)" }}>
                          {recl ? "Reclamação" : "Suporte"}
                        </span>
                        {!m.read && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#ef444422", color: "#ef4444" }}>Nova</span>}
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{m.name || "Sem nome"}</span>
                        {m.email && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {m.email}</span>}
                        <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>{fmt(m.createdAt)}</span>
                      </div>
                      <div className="text-sm mt-1 whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{m.message}</div>
                      <div className="flex items-center gap-3 mt-2">
                        {m.email && (
                          <a href={`mailto:${m.email}`} className="text-xs flex items-center gap-1" style={{ color: "var(--primary)" }}>
                            <Mail size={12} /> Responder
                          </a>
                        )}
                        {!m.read && (
                          <button onClick={() => markRead.mutate(m.id)} className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                            <Check size={12} /> Marcar como lida
                          </button>
                        )}
                        <button onClick={() => del.mutate(m.id)} className="text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
