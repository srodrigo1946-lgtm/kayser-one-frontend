"use client";

import { Header } from "@/components/layout/header";
import { ExternalLink, Table } from "lucide-react";

// Relatórios do Looker Studio. Abrem em nova guia — o embed por iframe pode estar
// desativado pelo dono. Para embutir aqui dentro: no Looker, Compartilhar →
// Incorporar → Ativar incorporação.
const RELATORIOS = [
  {
    nome: "Direcional",
    url: "https://lookerstudio.google.com/reporting/a6fcbf8c-bea2-49f6-acbf-a1ab85900b07/page/p_ly5biwnrhd",
  },
  {
    nome: "Tabela Riva",
    url: "https://lookerstudio.google.com/reporting/73d40acf-7aeb-4f53-8993-299ae9c27e6f/page/mR1oC",
  },
];

export default function GrupoDirecionalPage() {
  return (
    <div>
      <Header title="Grupo Direcional" subtitle="Relatórios (Looker Studio)" />
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RELATORIOS.map((r) => (
          <div
            key={r.nome}
            className="rounded-2xl border p-8 flex flex-col items-center text-center gap-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--secondary)", color: "var(--primary)" }}
            >
              <Table size={26} />
            </div>
            <div>
              <div className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
                {r.nome}
              </div>
              <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                Abre o relatório completo no Looker Studio.
              </div>
            </div>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <ExternalLink size={16} /> Abrir {r.nome}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
