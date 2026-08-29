"use client";

import { useRef, useState } from "react";
import { Header } from "@/components/layout/header";
import { ExternalLink, Table, Upload, Loader2, Pencil } from "lucide-react";
import { api, getApiErrorMessage, API_URL } from "@/lib/api";
import { getToken, getStoredUser } from "@/lib/auth";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";

// Links padrão (usados enquanto o Diretor não trocar pela UI).
const DEFAULT_DIRECIONAL =
  "https://lookerstudio.google.com/reporting/a6fcbf8c-bea2-49f6-acbf-a1ab85900b07/page/p_ly5biwnrhd";
const DEFAULT_TABELA_RIVA =
  "https://lookerstudio.google.com/reporting/73d40acf-7aeb-4f53-8993-299ae9c27e6f/page/mR1oC";

export default function GrupoDirecionalPage() {
  const { data: settings, refetch } = useSettings();
  const updateSettings = useUpdateSettings();
  const isDiretor = getStoredUser()?.role === "diretor";

  // Relatórios: link vem das Settings (Diretor edita) ou cai no padrão.
  const relatorios = [
    { nome: "Direcional", campo: "direcionalUrl" as const, url: settings?.direcionalUrl || DEFAULT_DIRECIONAL },
    { nome: "Tabela Riva", campo: "tabelaRivaUrl" as const, url: settings?.tabelaRivaUrl || DEFAULT_TABELA_RIVA },
  ];

  const editarLink = async (nome: string, campo: string, atual: string) => {
    const novo = window.prompt(`Cole o novo link do "${nome}" (Looker Studio):`, atual);
    if (!novo || novo.trim() === atual) return;
    try {
      await updateSettings.mutateAsync({ [campo]: novo.trim() } as any);
      await refetch();
    } catch (err) {
      alert(getApiErrorMessage(err, "Falha ao salvar o link. Apenas o Diretor pode alterar."));
    }
  };
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Muda a cada upload para furar o cache da <img> e mostrar a imagem nova.
  const [versao, setVersao] = useState(0);

  const imgUrl = `${API_URL}/settings/direcional-image?token=${getToken() ?? ""}&v=${versao}`;

  const enviarImagem = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Envie um arquivo de imagem (print da tabela).");
      return;
    }
    setEnviando(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post("/settings/direcional-image", form);
      await refetch();
      setVersao((v) => v + 1);
    } catch (err) {
      alert(getApiErrorMessage(err, "Falha ao enviar a imagem."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <Header title="Grupo Direcional" subtitle="Relatórios (Looker Studio)" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relatorios.map((r) => (
            <div
              key={r.nome}
              className="rounded-2xl border p-8 flex flex-col items-center text-center gap-4 relative"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {isDiretor && (
                <button
                  onClick={() => editarLink(r.nome, r.campo, r.url)}
                  title="Editar link"
                  className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                >
                  <Pencil size={13} /> Editar link
                </button>
              )}
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

        {/* Condições comerciais do mês (imagem). Todos veem; só o Diretor troca. */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <div className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
                Condições Comerciais do Mês
              </div>
              <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                Valores vigentes. {isDiretor ? "Troque a imagem a cada mês." : "Atualizado pela direção."}
              </div>
            </div>
            {isDiretor && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) enviarImagem(f);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={enviando}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                  style={{ background: "var(--primary)", color: "white" }}
                >
                  {enviando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {settings?.hasDirecionalImage ? "Trocar imagem" : "Enviar imagem"}
                </button>
              </>
            )}
          </div>

          {settings?.hasDirecionalImage ? (
            <a href={imgUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt="Condições comerciais do mês"
                className="w-full rounded-xl border"
                style={{ borderColor: "var(--border)" }}
              />
            </a>
          ) : (
            <div className="text-sm py-8 text-center" style={{ color: "var(--muted-foreground)" }}>
              Nenhuma imagem enviada ainda.
              {isDiretor ? " Clique em “Enviar imagem”." : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
