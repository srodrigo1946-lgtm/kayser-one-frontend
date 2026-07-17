"use client";

import { Header } from "@/components/layout/header";
import { ExternalLink, Table } from "lucide-react";

// Relatório do Grupo Direcional (Looker Studio). Abre em nova guia — o embed por
// iframe pode estar desativado pelo dono do relatório. Para embutir aqui dentro:
// no Looker, Compartilhar → Incorporar → Ativar incorporação.
const REPORT_URL =
  "https://lookerstudio.google.com/reporting/a6fcbf8c-bea2-49f6-acbf-a1ab85900b07/page/p_ly5biwnrhd";

export default function GrupoDirecionalPage() {
  return (
    <div>
      <Header title="Grupo Direcional" subtitle="Relatório do Grupo Direcional (Looker Studio)" />
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
              Relatório do Grupo Direcional
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
            <ExternalLink size={16} /> Abrir Grupo Direcional
          </a>
        </div>
      </div>
    </div>
  );
}
