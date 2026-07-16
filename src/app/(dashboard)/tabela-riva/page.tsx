"use client";

import { Header } from "@/components/layout/header";
import { ExternalLink, Table } from "lucide-react";

// Embed do Looker Studio está desativado pelo dono do relatório ("visualização em
// outros sites desativada"), então abrimos o relatório direto numa nova guia.
// Para embutir aqui dentro: no Looker, Compartilhar → Incorporar → Ativar incorporação.
const REPORT_URL =
  "https://lookerstudio.google.com/reporting/73d40acf-7aeb-4f53-8993-299ae9c27e6f/page/p_zivhebprhd";

export default function TabelaRivaPage() {
  return (
    <div>
      <Header title="Tabela Riva" subtitle="Relatório da Riva (Looker Studio)" />
      <div className="p-6">
        <div
          className="rounded-2xl border p-10 flex flex-col items-center text-center gap-4"
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
              Relatório da Riva
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Abre o relatório completo no Looker Studio.
            </div>
          </div>
          <a
            href={REPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <ExternalLink size={16} /> Abrir Tabela Riva
          </a>
        </div>
      </div>
    </div>
  );
}
