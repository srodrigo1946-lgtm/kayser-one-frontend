"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

type Meu = { id: string; leadId: string; nome: string; empreendimento: string | null; dueAt: string | null; transferido?: boolean; anuncio?: boolean };
const CHAVE = "kayser-leads-avisados";

function lerVistos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || "[]");
  } catch {
    return [];
  }
}
function gravarVistos(ids: string[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(ids.slice(-200)));
  } catch {
    /* sem storage: avisa de novo, sem problema */
  }
}

/** Fogos de artifício num canvas de tela cheia (sem biblioteca). */
function Fogos() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const cores = ["#facc15", "#f97316", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#ffffff"];
    type P = { x: number; y: number; vx: number; vy: number; vida: number; cor: string };
    let ps: P[] = [];
    let raf = 0;
    let ultimo = 0;
    const tam = () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
    };
    tam();
    window.addEventListener("resize", tam);
    const estoura = () => {
      const x = cv.width * (0.15 + Math.random() * 0.7);
      const y = cv.height * (0.12 + Math.random() * 0.4);
      const cor = cores[Math.floor(Math.random() * cores.length)];
      for (let i = 0; i < 70; i++) {
        const a = (Math.PI * 2 * i) / 70;
        const v = 2 + Math.random() * 3.5;
        ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 1, cor: Math.random() < 0.2 ? "#ffffff" : cor });
      }
    };
    const passo = (t: number) => {
      if (t - ultimo > 450) {
        estoura();
        ultimo = t;
      }
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ps = ps.filter((p) => p.vida > 0);
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.985;
        p.vida -= 0.012;
        ctx.globalAlpha = Math.max(p.vida, 0);
        ctx.fillStyle = p.cor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", tam);
    };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

/**
 * Chegou lead da fila pro corretor: tela cheia com fogos de artifício + botão pra
 * abrir a conversa. Cada lead avisa uma vez só (guardado no aparelho).
 */
export function AvisoLeadNovo() {
  const router = useRouter();
  // Diretor não recebe o aviso (pedido do Rodrigo).
  const ehDiretor = getStoredUser()?.role === "diretor";
  const { data } = useQuery({
    queryKey: ["lead-queue", "meus"],
    enabled: !ehDiretor,
    refetchInterval: 15_000,
    queryFn: async () => (await api.get<Meu[]>("/lead-queue/meus")).data,
  });
  const [lead, setLead] = useState<Meu | null>(null);

  useEffect(() => {
    if (!data?.length || lead) return;
    const vistos = lerVistos();
    const novo = data.find((m) => !vistos.includes(m.id));
    if (!novo) return;
    gravarVistos([...vistos, novo.id]);
    setLead(novo);
    try {
      navigator.vibrate?.([200, 100, 200, 100, 400]);
    } catch {
      /* sem vibração */
    }
  }, [data, lead]);

  if (!lead || ehDiretor) return null;
  const min = lead.dueAt ? Math.max(0, Math.round((new Date(lead.dueAt).getTime() - Date.now()) / 60000)) : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
      <Fogos />
      <div className="relative mx-4 max-w-md w-full rounded-3xl p-6 text-center" style={{ background: "linear-gradient(160deg,#1f2937,#0b0f19)", border: "2px solid #facc15", boxShadow: "0 0 60px #facc1566" }}>
        <div className="text-6xl mb-2">🎉</div>
        <div className="text-2xl font-extrabold mb-1" style={{ color: "#facc15" }}>Chegou lead pra você!</div>
        {/* Selo "#BORA VENDER" no lugar do nome do empreendimento (pedido do Rodrigo 06/10). */}
        <div
          className="inline-block mt-2 px-3 py-1 rounded-md leading-none"
          style={{
            background: "linear-gradient(135deg,#1e3a8a,#4f46e5 60%,#7c3aed)",
            boxShadow: "0 0 18px #4f46e588",
            fontFamily: "Bangers, Impact, sans-serif",
            letterSpacing: 1,
          }}
        >
          <div className="text-white text-2xl">#BORA</div>
          <div className="text-white text-2xl">VENDER 📈</div>
        </div>
        {lead.anuncio && (
          <div className="text-sm mt-3 font-semibold" style={{ color: "#86efac" }}>📣 Veio do anúncio: cliente quente, acabou de pedir informação. Chame agora!</div>
        )}
        {min != null ? (
          <div className="text-sm mt-3" style={{ color: "#fca5a5" }}>⏱️ Você tem {min} min pra fazer o primeiro contato.</div>
        ) : lead.anuncio ? null : (
          <div className="text-sm mt-3" style={{ color: "#fde68a" }}>📨 Seu gestor mandou esse lead pra você. Faça o primeiro contato!</div>
        )}
        <button
          onClick={() => {
            setLead(null);
            router.push(`/whatsapp?lead=${lead.leadId}`);
          }}
          className="mt-5 w-full py-3 rounded-2xl text-base font-bold"
          style={{ background: "#facc15", color: "#0a0a0a" }}
        >
          🚀 Atender agora
        </button>
        <button onClick={() => setLead(null)} className="mt-2 text-xs underline" style={{ color: "#94a3b8" }}>
          Fechar
        </button>
      </div>
    </div>
  );
}
