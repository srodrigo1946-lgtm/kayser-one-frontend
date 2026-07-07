"use client";

import { useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { useRanking } from "@/hooks/use-dashboard";
import { avatarUrl } from "@/hooks/use-profile";
import { PartyPopper, Trophy } from "lucide-react";

const roleLabels: Record<string, string> = {
  superintendente: "Superintendente",
  gerente_geral: "Gerente Geral",
  gerente: "Gerente",
  corretor: "Corretor",
};

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_COLORS = ["#d9b64e", "#c0c4cc", "#cd7f45"];

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

function fireConfetti(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const W = (canvas.width = window.innerWidth * dpr);
  const H = (canvas.height = window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  const colors = ["#d9b64e", "#f5c542", "#22c55e", "#3b82f6", "#ef4444", "#8b5cf6", "#ffffff"];
  const parts = Array.from({ length: 150 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.4,
    y: H * 0.18 + Math.random() * H * 0.08,
    vx: (Math.random() - 0.5) * 15 * dpr,
    vy: (Math.random() * -7 - 4) * dpr,
    g: (0.22 + Math.random() * 0.16) * dpr,
    size: (6 + Math.random() * 8) * dpr,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.35,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const frame = (t: number) => {
    const el = t - start;
    ctx.clearRect(0, 0, W, H);
    const life = Math.max(0, 1 - el / 2900);
    for (const p of parts) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (el < 3000) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(frame);
}

function playVictory() {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.13;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.52);
    });
    setTimeout(() => ctx.close(), 2200);
  } catch {
    /* áudio bloqueado — segue sem som */
  }
}

function Avatar({ id, name, has, size }: { id: string; name?: string | null; has?: boolean; size: number }) {
  return has ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl(id)} alt={name || ""} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: size, height: size, background: "var(--primary)", color: "white", fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  );
}

export default function RankingPage() {
  const { data } = useRanking();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rows = (data ?? []).map((r) => ({
    id: r.responsavelId ?? "",
    nome: r.nome ?? "Sem nome",
    role: r.role ?? "",
    hasAvatar: !!r.hasAvatar,
    vendas: Number(r.vendas) || 0,
    leads: Number(r.leads) || 0,
    meta: Number(r.meta) || 0,
  }));
  const topVendas = Math.max(1, ...rows.map((r) => r.vendas));
  const progress = (r: (typeof rows)[number]) =>
    r.meta > 0 ? Math.min(Math.round((r.vendas / r.meta) * 100), 100) : Math.round((r.vendas / topVendas) * 100);

  const top3 = rows.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean); // 2º, 1º, 3º
  const heights = [96, 132, 74];

  const mes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const celebrate = () => {
    fireConfetti(canvasRef.current);
    playVictory();
  };

  useEffect(() => {
    if (rows.length > 0) fireConfetti(canvasRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);

  return (
    <div>
      <Header title="Ranking de Corretores" subtitle={`Desempenho de ${mes}`} />
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" style={{ position: "fixed" }} />

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={celebrate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <PartyPopper size={16} /> Comemorar
          </button>
        </div>

        {rows.length === 0 && (
          <div className="py-20 text-center rounded-2xl border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            Sem dados de ranking ainda neste mês. Atribua leads e registre vendas para o ranking aparecer.
          </div>
        )}

        {top3.length > 0 && (
          <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-6">
              <Trophy size={18} style={{ color: "var(--primary)" }} />
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Pódio do mês</h3>
            </div>
            <div className="flex items-end justify-center gap-4 sm:gap-8">
              {podiumOrder.map((r) => {
                const rank = rows.indexOf(r);
                const h = heights[rank] ?? 74;
                return (
                  <div key={r.id} className="flex flex-col items-center" style={{ width: 96 }}>
                    <div className="text-2xl mb-1">{MEDALS[rank]}</div>
                    <Avatar id={r.id} name={r.nome} has={r.hasAvatar} size={rank === 0 ? 64 : 52} />
                    <div className="text-sm font-semibold mt-2 text-center truncate w-full" style={{ color: "var(--foreground)" }}>
                      {r.nome.split(" ").slice(0, 2).join(" ")}
                    </div>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{roleLabels[r.role] || r.role}</div>
                    <div
                      className="w-full rounded-t-xl flex items-center justify-center font-bold"
                      style={{ height: h, background: PODIUM_COLORS[rank], color: "#1a1400" }}
                    >
                      {r.vendas}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>Classificação geral</h3>
            <div className="space-y-3">
              {rows.map((r, i) => {
                const pct = progress(r);
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className="w-7 text-center text-sm font-bold flex-shrink-0" style={{ color: i < 3 ? "var(--primary)" : "var(--muted-foreground)" }}>
                      {i < 3 ? MEDALS[i] : i + 1}
                    </div>
                    <Avatar id={r.id} name={r.nome} has={r.hasAvatar} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-sm font-medium flex items-center gap-2 min-w-0" style={{ color: "var(--foreground)" }}>
                          <span className="truncate">{r.nome}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                            {roleLabels[r.role] || r.role}
                          </span>
                        </span>
                        <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                          {r.meta > 0 ? `${r.vendas}/${r.meta} vendas` : `${r.vendas} venda(s) · ${r.leads} lead(s)`}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? "var(--primary)" : "var(--success)" }} />
                      </div>
                    </div>
                    <div className="text-xs font-semibold w-9 text-right flex-shrink-0" style={{ color: "var(--foreground)" }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
