"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const FECHOU = "kayser-instalar-fechado";

/**
 * Registra o service worker e oferece "Instalar app" no celular.
 * Android/Chrome: botão que abre o instalador. iPhone: dica "Compartilhar → Adicionar à Tela de Início".
 */
export function InstalarApp() {
  const [evento, setEvento] = useState<PromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [fechado, setFechado] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const instalado =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    if (instalado) return;
    try {
      setFechado(localStorage.getItem(FECHOU) === "1");
    } catch {
      setFechado(false);
    }
    const ua = navigator.userAgent;
    setIos(/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as PromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const fechar = () => {
    setFechado(true);
    try {
      localStorage.setItem(FECHOU, "1");
    } catch {}
  };

  if (fechado || (!evento && !ios)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-yellow-400/40 bg-neutral-950 p-4 text-neutral-100 shadow-2xl">
      <button onClick={fechar} className="absolute right-3 top-3 text-neutral-400" aria-label="Fechar">
        <X size={18} />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
        <div className="text-sm">
          <div className="font-bold text-yellow-400">Instale o app Kayser One</div>
          {evento ? (
            <div className="text-neutral-400">Abre direto do celular, em tela cheia.</div>
          ) : (
            <div className="text-neutral-400">
              Toque em <Share size={14} className="inline -mt-1" /> <b>Compartilhar</b> e depois em{" "}
              <b>Adicionar à Tela de Início</b>.
            </div>
          )}
        </div>
      </div>
      {evento && (
        <button
          onClick={async () => {
            await evento.prompt();
            await evento.userChoice.catch(() => null);
            setEvento(null);
            fechar();
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-2.5 font-bold text-neutral-950"
        >
          <Download size={18} /> Instalar app
        </button>
      )}
    </div>
  );
}
