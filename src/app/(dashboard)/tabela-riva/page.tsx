"use client";

import { Header } from "@/components/layout/header";

export default function TabelaRivaPage() {
  return (
    <div>
      <Header title="Tabela Riva" subtitle="Relatório da Riva (Looker Studio)" />
      <div className="p-6">
        {/* Embed nativo do Looker Studio. Requer "Ativar incorporação" no relatório. */}
        <iframe
          title="Tabela Riva"
          src="https://lookerstudio.google.com/embed/reporting/73d40acf-7aeb-4f53-8993-299ae9c27e6f/page/p_zivhebprhd"
          className="w-full rounded-2xl border"
          style={{ height: "calc(100vh - 160px)", borderColor: "var(--border)" }}
          allowFullScreen
        />
      </div>
    </div>
  );
}
