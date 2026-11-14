"use client";

import { Header } from "@/components/layout/header";
import { getStoredUser } from "@/lib/auth";
import { TathyPainel } from "@/components/trafego/tathy-painel";

/** Aba própria da Tathy (Rodrigo 14/11): fixa no menu, com foto. Só o Diretor. */
export default function TathyPage() {
  const isDiretor = getStoredUser()?.role === "diretor";
  const agora = new Date();
  return (
    <div>
      <Header title="Tathy" subtitle="Gestora de tráfego · ao vivo, só leads de anúncio" />
      <div className="p-6">
        {isDiretor ? (
          <TathyPainel year={agora.getFullYear()} month={agora.getMonth() + 1} />
        ) : (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>A Tathy é só para o Diretor.</p>
        )}
      </div>
    </div>
  );
}
