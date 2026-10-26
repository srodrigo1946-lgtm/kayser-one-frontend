"use client";

/**
 * Pódio 3D dos 3 primeiros do ranking (visual K1, 26/10): blocos de ouro, prata e bronze
 * com frente, topo e lateral (projeção oblíqua em CSS), o 1º no meio e mais alto.
 */
type Linha = { responsavelId?: string; nome?: string; vendas?: number | string; leads?: number | string };

const PROF = 18; // profundidade do bloco (px)
const DEGRAUS = [
  { lugar: 2, altura: 96, frente: ["#e2e8f0", "#94a3b8"], topo: "#f1f5f9", lado: "#64748b", texto: "#0f172a" },
  { lugar: 1, altura: 136, frente: ["#fde68a", "#d4a017"], topo: "#fef3c7", lado: "#a16207", texto: "#1c1405" },
  { lugar: 3, altura: 72, frente: ["#f0b27a", "#b4692e"], topo: "#f8d2ac", lado: "#7c3f12", texto: "#1f0f04" },
];

// Primeira letra do primeiro e do último nome ("Anita de Alvarenga Silva" → "AS").
const iniciais = (n?: string) => {
  const p = (n || "?").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
};

export function Podio3D({ ranking }: { ranking: Linha[] }) {
  const top = [ranking[1], ranking[0], ranking[2]]; // 2º, 1º, 3º
  if (!ranking.length) return null;
  return (
    <div className="flex items-end justify-center gap-6 sm:gap-10 pt-4 pb-2" aria-label="Pódio dos 3 primeiros do mês">
      {DEGRAUS.map((d, i) => {
        const c = top[i];
        if (!c) return <div key={d.lugar} className="w-24 sm:w-28" />;
        const vendas = Number(c.vendas) || 0;
        return (
          <div key={d.lugar} className="flex flex-col items-center w-24 sm:w-28">
            {/* Quem está no degrau */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-1.5"
              style={{
                background: `linear-gradient(135deg, ${d.frente[0]}, ${d.frente[1]})`,
                color: d.texto,
                boxShadow: d.lugar === 1 ? "0 0 0 3px #f2c23055, 0 8px 22px -6px #f2c230aa" : "0 6px 14px -6px rgba(0,0,0,.6)",
              }}
            >
              {iniciais(c.nome)}
            </div>
            <div className="text-xs font-semibold text-center leading-tight line-clamp-2 mb-0.5" style={{ color: "var(--foreground)" }}>
              {c.nome || "Sem responsável"}
            </div>
            <div className="text-[11px] mb-6" style={{ color: "var(--muted-foreground)" }}>
              {vendas} venda{vendas === 1 ? "" : "s"}
            </div>

            {/* Bloco 3D: topo (skewX), lateral (skewY) e frente */}
            <div className="relative w-full" style={{ height: d.altura, marginRight: PROF }}>
              <div
                aria-hidden
                className="absolute left-0 w-full"
                style={{ top: -PROF, height: PROF, background: d.topo, transform: "skewX(-45deg)", transformOrigin: "bottom left" }}
              />
              <div
                aria-hidden
                className="absolute top-0 h-full"
                style={{ right: -PROF, width: PROF, background: d.lado, transform: "skewY(-45deg)", transformOrigin: "top left" }}
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-start pt-2"
                style={{ background: `linear-gradient(180deg, ${d.frente[0]}, ${d.frente[1]})`, color: d.texto }}
              >
                <span className="text-3xl font-black leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{d.lugar}º</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
