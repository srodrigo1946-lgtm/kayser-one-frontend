"use client";

/**
 * Bolsa do Bolsão (bolsa de couro vermelha com o medalhão K1 dourado).
 * Com leads: bolsa aberta, cartões de lead saltam da boca e caem empilhando no chão;
 * etiqueta dourada na alça com a quantidade. Vazia: bolsa fechada (zíper) e quieta.
 */
export function BolsaTransbordando({ qtd }: { qtd: number }) {
  const cheia = qtd > 0;
  const voando = Math.min(qtd, 7);
  // Cada cartão sai da boca numa direção (x final em px, giro em graus).
  const rotas = [
    { x: -150, r: -28 },
    { x: 140, r: 24 },
    { x: -80, r: -12 },
    { x: 95, r: 16 },
    { x: -190, r: -36 },
    { x: 185, r: 32 },
    { x: 20, r: 6 },
  ];
  const ciclo = 3.2; // segundos
  const naPilha = Math.min(qtd, 5);
  return (
    <div className={`k1-bolsa ${cheia ? "cheia" : "vazia"}`} role="img" aria-label={cheia ? `${qtd} lead(s) no Bolsão` : "Bolsão vazio"}>
      <div className="k1-bolsa-palco">
        {/* Pilha no chão (atrás da bolsa) */}
        {cheia && (
          <div className="k1-pilha">
            {Array.from({ length: naPilha }).map((_, i) => (
              <span key={i} className="k1-lead-chao" style={{ transform: `translateX(${(i - (naPilha - 1) / 2) * 62}px) rotate(${[-8, 5, -3, 9, -6][i]}deg)` }}>
                <span className="k1-lead-av" />
                <span className="k1-lead-ln" />
              </span>
            ))}
          </div>
        )}

        {/* Cartões saltando da boca */}
        {cheia &&
          rotas.slice(0, voando).map((r, i) => (
            <div
              key={i}
              className="k1-lead-voa"
              style={{ ["--x" as any]: `${r.x}px`, ["--r" as any]: `${r.r}deg`, animationDelay: `${(i * ciclo) / voando}s`, animationDuration: `${ciclo}s` }}
            >
              <span className="k1-lead-av" />
              <span className="k1-lead-ln" />
            </div>
          ))}

        <svg className="k1-bolsa-svg" viewBox="0 0 260 250" width="260" height="250" aria-hidden>
          <defs>
            <linearGradient id="k1Couro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="45%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <linearGradient id="k1Lateral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
            <linearGradient id="k1Ouro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
            <radialGradient id="k1Brilho" cx="30%" cy="25%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity=".28" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Alça de trás */}
          <path d="M92 92 C92 34 168 34 168 92" fill="none" stroke="#a16207" strokeWidth="9" strokeLinecap="round" />

          {/* Boca: forro escuro (aberta) */}
          {cheia && <path d="M58 88 L202 88 L192 104 L68 104 Z" fill="#2a0505" />}

          {/* Laterais (sanfona) */}
          <path d="M58 88 L40 226 Q40 236 52 236 L64 236 L70 100 Z" fill="url(#k1Lateral)" />
          <path d="M202 88 L220 226 Q220 236 208 236 L196 236 L190 100 Z" fill="url(#k1Lateral)" />

          {/* Frente */}
          <path d="M68 100 H192 L206 222 Q207 236 192 236 H68 Q53 236 54 222 Z" fill="url(#k1Couro)" />
          <path d="M68 100 H192 L206 222 Q207 236 192 236 H68 Q53 236 54 222 Z" fill="url(#k1Brilho)" />
          {/* Costura dourada */}
          <path d="M74 110 H186 L197 220 Q197 226 190 226 H70 Q63 226 63 220 Z" fill="none" stroke="#facc15" strokeOpacity=".55" strokeWidth="1.6" strokeDasharray="5 5" />

          {/* Fechada: zíper dourado */}
          {!cheia && (
            <>
              <path d="M60 92 H200" stroke="url(#k1Ouro)" strokeWidth="5" strokeLinecap="round" />
              <path d="M60 92 H200" stroke="#7f1d1d" strokeWidth="1.2" strokeDasharray="2 3" />
              <rect x="186" y="88" width="10" height="16" rx="3" fill="url(#k1Ouro)" />
            </>
          )}

          {/* Alça da frente */}
          <path d="M100 100 C100 48 160 48 160 100" fill="none" stroke="url(#k1Ouro)" strokeWidth="9" strokeLinecap="round" />
          <rect x="92" y="96" width="16" height="12" rx="3" fill="#a16207" />
          <rect x="152" y="96" width="16" height="12" rx="3" fill="#a16207" />

          {/* Medalhão K1 */}
          <circle cx="130" cy="166" r="34" fill="url(#k1Ouro)" />
          <circle cx="130" cy="166" r="27" fill="none" stroke="#7f1d1d" strokeOpacity=".5" strokeWidth="1.5" />
          <text x="130" y="178" textAnchor="middle" fontSize="32" fontWeight="900" fill="#1c1917" style={{ letterSpacing: "-1px" }}>
            K1
          </text>

          {/* Etiqueta com a quantidade */}
          {cheia && (
            <g className="k1-etiqueta">
              <line x1="160" y1="66" x2="214" y2="82" stroke="#facc15" strokeWidth="2" />
              <rect x="204" y="78" width="46" height="30" rx="7" fill="url(#k1Ouro)" />
              <circle cx="212" cy="86" r="3" fill="#7f1d1d" />
              <text x="231" y="100" textAnchor="middle" fontSize="17" fontWeight="800" fill="#1c1917">
                {qtd > 99 ? "99+" : qtd}
              </text>
            </g>
          )}
        </svg>
      </div>

      <style>{`
        .k1-bolsa { display: flex; justify-content: center; padding: 8px 0 4px; }
        .k1-bolsa-palco { position: relative; width: 440px; max-width: 100%; height: 320px; display: flex; align-items: flex-end; justify-content: center; }
        .k1-bolsa-svg { position: relative; z-index: 2; margin-bottom: 18px; overflow: visible; }
        .k1-bolsa.cheia .k1-bolsa-svg { animation: k1Respira ${ciclo / Math.max(voando, 1)}s ease-in-out infinite; transform-origin: 50% 100%;
          filter: drop-shadow(0 0 22px #ef444455) drop-shadow(0 16px 20px #000b); }
        .k1-bolsa.vazia .k1-bolsa-svg { filter: drop-shadow(0 16px 20px #000b) saturate(.8); }
        .k1-etiqueta { animation: k1Balanca 2.4s ease-in-out infinite; transform-origin: 160px 66px; }

        .k1-lead-voa, .k1-lead-chao { width: 56px; height: 34px; border-radius: 8px; background: #f8fafc; border: 2px solid #facc15;
          box-shadow: 0 4px 10px #0008; display: flex; align-items: center; gap: 5px; padding: 0 6px; box-sizing: border-box; }
        .k1-lead-voa { position: absolute; z-index: 3; left: calc(50% - 28px); bottom: 190px; opacity: 0;
          animation-name: k1Transborda; animation-timing-function: cubic-bezier(.2,.7,.4,1); animation-iteration-count: infinite; }
        .k1-lead-av { width: 14px; height: 14px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
        .k1-lead-ln { height: 5px; flex: 1; border-radius: 3px; background: #cbd5e1; }
        .k1-pilha { position: absolute; z-index: 1; bottom: 10px; left: 50%; width: 0; }
        .k1-lead-chao { position: absolute; bottom: 0; left: -28px; background: #e2e8f0; }

        @keyframes k1Transborda {
          0%   { opacity: 0; transform: translate(0, 50px) rotate(0) scale(.5); }
          12%  { opacity: 1; transform: translate(calc(var(--x) * .25), -60px) rotate(calc(var(--r) * .5)) scale(1); }
          30%  { transform: translate(calc(var(--x) * .6), -85px) rotate(var(--r)); }
          75%  { opacity: 1; transform: translate(var(--x), 155px) rotate(calc(var(--r) * 2.2)); }
          90%, 100% { opacity: 0; transform: translate(var(--x), 170px) rotate(calc(var(--r) * 2.4)); }
        }
        @keyframes k1Respira { 0%, 100% { transform: scale(1) rotate(0); } 18% { transform: scale(1.035, .965) rotate(-1.2deg); } 36% { transform: scale(.985, 1.025) rotate(.8deg); } }
        @keyframes k1Balanca { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(8deg); } }

        @media (max-width: 480px) { .k1-bolsa-palco { transform: scale(.8); transform-origin: 50% 100%; height: 280px; } }
        @media (prefers-reduced-motion: reduce) {
          .k1-bolsa.cheia .k1-bolsa-svg, .k1-etiqueta { animation: none; }
          .k1-lead-voa { animation: none; opacity: 1; transform: translate(calc(var(--x) * .6), -50px) rotate(var(--r)); }
        }
      `}</style>
    </div>
  );
}
