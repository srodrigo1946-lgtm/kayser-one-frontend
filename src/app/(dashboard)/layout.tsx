"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { CheckinPlantao } from "@/components/plantao/checkin-plantao";
import { AvisoLeadNovo } from "@/components/fila/aviso-lead-novo";
import { isAuthenticated, getStoredUser } from "@/lib/auth";
import { useNewLeadAlert } from "@/hooks/use-new-lead-alert";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  // Alerta sonoro quando cai lead novo (só depois de logado).
  useNewLeadAlert(ready);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      // Tema preto e amarelo só pro Diretor (os cargos seguem com o tema padrão).
      document.documentElement.dataset.perfil = getStoredUser()?.role === "diretor" ? "diretor" : "";
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: "var(--background)", color: "var(--muted-foreground)" }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Check-in do plantão por GPS (aparece só pra quem está na escala do turno). */}
        <CheckinPlantao />
        <AvisoLeadNovo />
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
