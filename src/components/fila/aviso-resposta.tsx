"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import { somLigado, tocarBip } from "@/hooks/use-new-lead-alert";

type Resp = { id: string; leadId: string; nome: string; texto: string; naoLidas: number };

/**
 * Cliente respondeu numa conversa do corretor: bip + notificação do navegador/celular
 * + aviso no canto com "Abrir conversa" (pedido do Rodrigo 10/11). Só avisa quem
 * atende a conversa; a primeira leitura só memoriza.
 */
export function AvisoResposta() {
  const router = useRouter();
  const vistos = useRef<Map<string, number> | null>(null);
  const [aviso, setAviso] = useState<Resp | null>(null);

  const { data } = useQuery({
    queryKey: ["conversas-respostas"],
    refetchInterval: 15_000,
    queryFn: async () => (await api.get<Resp[]>("/conversations/respostas")).data,
  });

  // Pede permissão de notificação no primeiro clique (navegador exige gesto do usuário).
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    const pedir = () => Notification.requestPermission().catch(() => {});
    window.addEventListener("click", pedir, { once: true });
    return () => window.removeEventListener("click", pedir);
  }, []);

  useEffect(() => {
    if (!data) return;
    const antes = vistos.current;
    vistos.current = new Map(data.map((r) => [r.id, r.naoLidas]));
    if (!antes) return;
    const novo = data.find((r) => r.naoLidas > (antes.get(r.id) ?? 0));
    if (!novo) return;
    // Já está com essa conversa aberta na tela: não precisa avisar.
    if (document.visibilityState === "visible" && window.location.search.includes(novo.leadId)) return;
    setAviso(novo);
    if (somLigado()) tocarBip();
    try {
      navigator.vibrate?.([150, 80, 150]);
    } catch {
      /* sem vibração */
    }
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const n = new Notification(`${novo.nome} respondeu`, { body: novo.texto || "Nova mensagem no WhatsApp", icon: "/icons/icon-192.png", tag: novo.id });
        n.onclick = () => {
          window.focus();
          router.push(`/whatsapp?lead=${novo.leadId}`);
          n.close();
        };
      }
    } catch {
      /* celular sem Notification no navegador: fica o aviso na tela */
    }
  }, [data, router]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 20_000);
    return () => clearTimeout(t);
  }, [aviso]);

  if (!aviso) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[9998] rounded-2xl p-4 flex gap-3 items-start"
      style={{ background: "#111827", border: "1px solid #facc15", boxShadow: "0 10px 40px rgba(0,0,0,.5)" }}
    >
      <MessageCircle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: "#facc15" }} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white">{aviso.nome} respondeu</div>
        {aviso.texto && <div className="text-sm text-gray-300 line-clamp-2 break-words">{aviso.texto}</div>}
        <button
          onClick={() => {
            setAviso(null);
            router.push(`/whatsapp?lead=${aviso.leadId}`);
          }}
          className="mt-2 px-3 py-1.5 rounded-lg text-sm font-bold"
          style={{ background: "#facc15", color: "#0a0a0a" }}
        >
          Abrir conversa
        </button>
      </div>
      <button onClick={() => setAviso(null)} aria-label="Fechar aviso" className="text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
